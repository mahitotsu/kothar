// 配置（S-LAYOUT-1、S-LAYOUT-2、ADR 0001 の二段構成）。
// 1. 本流と下段のノードとグループを ELK で配置する。
// 2. 上段のノードを呼び出す側の真上に、端の列のノードを全体の右に置く。
// 3. 2で置いたノードへの線を、経路探索で引く。
// 4. 左上の余白をそろえ、ピン留めしたノードを指定した座標に移して、そのノードの線を引き直す。

import ElkModule from "elkjs/lib/elk.bundled.js";
import type { Compiled } from "./compile.ts";
import { route, simplify, type Obstacles } from "./route.ts";
import { LABEL_FONT_SIZE, NODE_FONT_SIZE, textWidth } from "./text.ts";
import type { Layout, Point, Rect, Side } from "./types.ts";

// elkjs の型定義は ESM の default export を宣言しているが、実体は CJS なので NodeNext では型が合わない
const ELK = ElkModule as unknown as typeof ElkModule.default;
type ElkNode = Record<string, any>;

const NODE_H = 56;
const GAP = 40; // ノードの間隔
const BAND_GAP = 100; // 本体と上段の間
const SIDE_GAP = 120; // 本体と端の列の間
const MARGIN = 20; // 図の左上の余白

export const r2 = (n: number) => Math.round(n * 100) / 100;
const nodeWidth = (label: string) => Math.max(120, Math.ceil(textWidth(label, NODE_FONT_SIZE)) + 40);
const labelSize = (text: string) => ({ w: Math.ceil(textWidth(text, LABEL_FONT_SIZE)) + 6, h: 16 });
const ELK_SIDE: Record<Side, string> = { north: "NORTH", south: "SOUTH", east: "EAST", west: "WEST" };
const cx = (r: Rect) => r.x + r.w / 2;
const cy = (r: Rect) => r.y + r.h / 2;

export async function layout(c: Compiled): Promise<Layout> {
  const { model } = c.input;
  const groups = model.groups ?? [];
  const isPost = (id: string) => c.nodes.has(id) && ["above-caller", "side-column"].includes(c.regionOf(id).place);

  // --- 1. ELK で本体を配置する ---------------------------------------------
  const elkNodes = new Map<string, ElkNode>();
  for (const n of model.nodes) {
    if (isPost(n.id)) continue;
    elkNodes.set(n.id, { id: n.id, width: nodeWidth(n.label), height: NODE_H, layoutOptions: { "elk.portConstraints": "FIXED_SIDE" }, ports: [] });
  }
  for (const g of groups)
    elkNodes.set(g.id, {
      id: g.id,
      layoutOptions: {
        "elk.portConstraints": "FIXED_SIDE",
        "elk.padding": "[top=32,left=16,bottom=16,right=16]",
        // グループの中にもノードの間隔を指定する。指定しないと 20px になる（検証 0003 の観察5）
        "elk.spacing.nodeNode": String(GAP),
      },
      ports: [],
      children: [],
    });
  const roots: ElkNode[] = [];
  for (const id of [...model.nodes.map((n) => n.id), ...groups.map((g) => g.id)]) {
    const node = elkNodes.get(id);
    if (!node) continue;
    const parent = c.parentOf.get(id);
    (parent ? elkNodes.get(parent)!.children : roots).push(node);
  }
  const elkEdges: ElkNode[] = [];
  model.edges.forEach((e, k) => {
    const [src, tgt] = [elkNodes.get(e.from), elkNodes.get(e.to)];
    if (!src || !tgt) return;
    const rule = c.edgeRules[k];
    const sp = { id: `e${k}.s`, layoutOptions: { "elk.port.side": ELK_SIDE[rule.exit] } };
    const tp = { id: `e${k}.t`, layoutOptions: { "elk.port.side": ELK_SIDE[rule.enter] } };
    src.ports.push(sp);
    tgt.ports.push(tp);
    // 外周を回る線は向きを反転して渡す。反転しないと、ELK が閉路を壊すときに本流の線を反転することがある（検証 0001 の観察2）
    const reversed = rule.route === "around";
    // ラベルは ELK に渡さず、配置のあとで置く。ELK に渡すと、ラベルの場所を取るために、線を1本足しただけでほかのノードが大きく動く
    elkEdges.push({ id: `e${k}`, sources: [reversed ? tp.id : sp.id], targets: [reversed ? sp.id : tp.id] });
  });
  const laid = await new ELK().layout({
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.json.shapeCoords": "ROOT",
      "elk.json.edgeCoords": "ROOT",
      "elk.spacing.nodeNode": String(GAP),
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.separateConnectedComponents": "false",
    },
    children: roots,
    edges: elkEdges,
  } as any);

  const rects = new Map<string, Rect>();
  const visit = (n: ElkNode) => {
    rects.set(n.id, { x: r2(n.x), y: r2(n.y), w: r2(n.width), h: r2(n.height) });
    (n.children ?? []).forEach(visit);
  };
  (laid.children ?? []).forEach(visit);

  // --- 2. 上段と端の列を置く -----------------------------------------------
  const body = [...rects.values()];
  const bodyTop = body.length ? Math.min(...body.map((r) => r.y)) : 0;
  const bodyLeft = body.length ? Math.min(...body.map((r) => r.x)) : 0;
  const bodyRight = body.length ? Math.max(...body.map((r) => r.x + r.w)) : 0;

  // 上段：呼び出す側の真上。複数の呼び出す側があるときは、幅をその全員の真上にかかるまで広げる
  const tops: { id: string; rect: Rect }[] = [];
  for (const n of model.nodes) {
    if (c.regionOf(n.id).place !== "above-caller") continue;
    const callers = model.edges.filter((e) => e.to === n.id && rects.has(e.from)).map((e) => cx(rects.get(e.from)!));
    const w0 = nodeWidth(n.label);
    const y = bodyTop - BAND_GAP - NODE_H;
    if (callers.length === 0) tops.push({ id: n.id, rect: { x: bodyLeft, y, w: w0, h: NODE_H } });
    else {
      const [lo, hi] = [Math.min(...callers), Math.max(...callers)];
      const w = callers.length > 1 ? Math.max(w0, r2(hi - lo + 60)) : w0;
      tops.push({ id: n.id, rect: { x: r2((lo + hi) / 2 - w / 2), y, w, h: NODE_H } });
    }
  }
  // 上段どうしが重なるときは右へずらす
  const sorted = [...tops].sort((a, b) => a.rect.x - b.rect.x);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1].rect;
    sorted[i].rect.x = r2(Math.max(sorted[i].rect.x, prev.x + prev.w + GAP));
  }
  for (const t of tops) rects.set(t.id, t.rect);

  // 端の列：全体の右に縦に並べ、使う側の高さの中央に揃える
  const sides = model.nodes.filter((n) => c.regionOf(n.id).place === "side-column");
  if (sides.length) {
    const users = model.edges.filter((e) => sides.some((n) => n.id === e.to) && rects.has(e.from)).map((e) => rects.get(e.from)!);
    const span = users.length ? [Math.min(...users.map((u) => u.y)), Math.max(...users.map((u) => u.y + u.h))] : [bodyTop, bodyTop];
    const height = sides.length * NODE_H + (sides.length - 1) * GAP;
    let y = r2((span[0] + span[1]) / 2 - height / 2);
    for (const n of sides) {
      rects.set(n.id, { x: r2(bodyRight + SIDE_GAP), y, w: nodeWidth(n.label), h: NODE_H });
      y = r2(y + NODE_H + GAP);
    }
  }

  // --- 3. 線を引く ----------------------------------------------------------
  const elkById = new Map<string, ElkNode>((laid.edges ?? []).map((e: ElkNode) => [e.id, e]));
  const points: (Point[] | undefined)[] = model.edges.map((_, k) => {
    const ee = elkById.get(`e${k}`);
    if (!ee) return undefined;
    const s = ee.sections[0];
    const pts: Point[] = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((q: any) => [r2(q.x), r2(q.y)]);
    return c.edgeRules[k].route === "around" ? pts.reverse() : pts;
  });
  routeEdges(c, rects, points, model.edges.map((_, k) => k).filter((k) => !points[k]));

  // --- 4. 余白をそろえ、ピン留めを当てる -----------------------------------
  const all = [...rects.values()];
  const pts = points.flatMap((p) => p ?? []);
  const dx = r2(MARGIN - Math.min(...all.map((r) => r.x), ...pts.map((q) => q[0])));
  const dy = r2(MARGIN - Math.min(...all.map((r) => r.y), ...pts.map((q) => q[1])));
  for (const r of rects.values()) {
    r.x = r2(r.x + dx);
    r.y = r2(r.y + dy);
  }
  points.forEach((p, k) => (points[k] = p?.map(([x, y]) => [r2(x + dx), r2(y + dy)] as Point)));

  const pinned = new Set<string>();
  for (const n of model.nodes) {
    if (!n.pin) continue;
    const r = rects.get(n.id)!;
    r.x = r2(n.pin.x - r.w / 2);
    r.y = r2(n.pin.y - r.h / 2);
    pinned.add(n.id);
  }
  if (pinned.size) {
    // ピン留めしたノードにつながる線と、ピン留めしたノードを通るようになった線を、引き直す
    const pinnedRects = [...pinned].map((id) => rects.get(id)!);
    const through = (p: Point[] | undefined) =>
      !!p && p.slice(1).some((q, i) => pinnedRects.some((r) => segmentHits(p[i], q, r)));
    const again = model.edges
      .map((_, k) => k)
      .filter((k) => pinned.has(model.edges[k].from) || pinned.has(model.edges[k].to) || through(points[k]));
    for (const k of again) {
      points[k] = undefined;
    }
    routeEdges(c, rects, points, again);
  }

  // --- 結果 -------------------------------------------------------------------
  // ラベルは線分の横に置く。長い線分の中点から順に候補を作り、ノード、グループの枠線、先に置いたラベル、ほかの線と
  // 重ならない位置を選ぶ。どの候補も何かと重なるときは、重なりの重みの合計が最も小さい候補を選ぶ（ノードとの重なりを最も避ける）
  const placedLabels: Rect[] = [];
  const labelRects = model.edges.map((e, k) => {
    if (!e.label) return undefined;
    const p = points[k]!;
    const size = labelSize(e.label);
    const segments = p
      .slice(1)
      .map((b, i) => [p[i], b] as [Point, Point])
      .sort(([a1, b1], [a2, b2]) => Math.abs(b2[0] - a2[0]) + Math.abs(b2[1] - a2[1]) - (Math.abs(b1[0] - a1[0]) + Math.abs(b1[1] - a1[1])));
    const candidates = segments.flatMap(([a, b]) =>
      [0.5, 0.35, 0.65, 0.2, 0.8].flatMap((t) => {
        const [x, y] = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        return a[0] === b[0]
          ? [{ x: r2(x + 6), y: r2(y - size.h / 2), w: size.w, h: size.h }, { x: r2(x - 6 - size.w), y: r2(y - size.h / 2), w: size.w, h: size.h }]
          : [{ x: r2(x - size.w / 2), y: r2(y - size.h - 4), w: size.w, h: size.h }, { x: r2(x - size.w / 2), y: r2(y + 4), w: size.w, h: size.h }];
      }),
    );
    const others = points.filter((q, j): q is Point[] => j !== k && !!q);
    const cost = (r: Rect) =>
      100 * model.nodes.filter((n) => intersects(r, rects.get(n.id)!)).length +
      10 * (model.groups ?? []).filter((g) => crossesFrame(r, rects.get(g.id)!)).length +
      10 * placedLabels.filter((l) => intersects(r, l)).length +
      others.filter((q) => q.slice(1).some((z, i) => segmentHits(q[i], z, r))).length;
    let chosen = candidates[0];
    let best = Infinity;
    for (const r of candidates) {
      const v = cost(r);
      if (v < best) [chosen, best] = [r, v];
      if (v === 0) break;
    }
    placedLabels.push(chosen);
    return chosen;
  });

  const regionRects = c.input.grammar.regions.flatMap((region) => {
    const members = model.nodes.filter((n) => c.regionOf(n.id) === region).map((n) => rects.get(n.id)!);
    if (!members.length) return [];
    const x = Math.min(...members.map((r) => r.x));
    const y = Math.min(...members.map((r) => r.y));
    const rect = { x, y, w: r2(Math.max(...members.map((r) => r.x + r.w)) - x), h: r2(Math.max(...members.map((r) => r.y + r.h)) - y) };
    return [{ region, rect }];
  });

  return {
    nodes: model.nodes.map((n) => ({ id: n.id, label: n.label, region: c.regionOf(n.id), rect: rects.get(n.id)!, pinned: pinned.has(n.id) })),
    groups: groups.map((g) => ({ id: g.id, label: g.label, rect: rects.get(g.id)!, members: [...c.descendantsOf(g.id)] })),
    edges: model.edges.map((e, k) => ({
      from: e.from,
      to: e.to,
      kind: e.kind,
      rule: c.edgeRules[k],
      points: points[k]!,
      ...(e.label ? { label: { text: e.label, rect: labelRects[k]! } } : {}),
    })),
    regions: regionRects,
  };
}

// 指定した線を、ほかの線とノードを避けて引く。同じ辺に複数の線が出入りするときは、辺の上の別の点に分ける
function routeEdges(c: Compiled, rects: Map<string, Rect>, points: (Point[] | undefined)[], targets: number[]) {
  const { model } = c.input;
  if (!targets.length) return;
  const ends = new Map<string, { k: number; end: "s" | "t"; along: number }[]>();
  for (const k of targets) {
    const e = model.edges[k];
    const rule = c.edgeRules[k];
    const [s, t] = [rects.get(e.from)!, rects.get(e.to)!];
    const add = (id: string, side: Side, end: "s" | "t", other: Rect) => {
      const key = `${id}:${side}`;
      const list = ends.get(key) ?? [];
      list.push({ k, end, along: side === "north" || side === "south" ? cx(other) : cy(other) });
      ends.set(key, list);
    };
    add(e.from, rule.exit, "s", t);
    add(e.to, rule.enter, "t", s);
  }
  const port = new Map<string, Point>();
  for (const [key, list] of ends) {
    const [id, side] = key.split(":") as [string, Side];
    const r = rects.get(id)!;
    list.sort((a, b) => a.along - b.along || a.k - b.k);
    const straightUp = side === "south" && c.nodes.has(id) && c.regionOf(id).place === "above-caller";
    let last = -Infinity;
    list.forEach((slot, i) => {
      const f = (i + 1) / (list.length + 1);
      let along: number;
      if (straightUp) {
        // 上段のノードの下辺は、呼び出す側の中心の真上に点を置く（まっすぐ引けるように）。近すぎる点はずらす
        along = Math.min(Math.max(slot.along, r.x + 8), r.x + r.w - 8);
        if (along - last < 12) along = Math.min(last + 12, r.x + r.w - 4);
        last = along;
      } else along = side === "north" || side === "south" ? r.x + r.w * f : r.y + r.h * f;
      const pt: Point =
        side === "north" ? [r2(along), r.y]
        : side === "south" ? [r2(along), r2(r.y + r.h)]
        : side === "east" ? [r2(r.x + r.w), r2(along)]
        : [r.x, r2(along)];
      port.set(`${slot.k}.${slot.end}`, pt);
    });
  }
  for (const k of targets) {
    const e = model.edges[k];
    const rule = c.edgeRules[k];
    // 線の端になっているグループの枠は、横切りの費用を数えない
    const obstacles: Obstacles = {
      nodes: model.nodes.map((n) => rects.get(n.id)!),
      groups: (model.groups ?? []).filter((g) => g.id !== e.from && g.id !== e.to).map((g) => rects.get(g.id)!),
      lines: [
        ...points.filter((p): p is Point[] => !!p),
        ...(model.groups ?? []).map((g) => frame(rects.get(g.id)!)),
      ],
    };
    const [a, b] = [port.get(`${k}.s`)!, port.get(`${k}.t`)!];
    points[k] = (route(a, rule.exit, b, rule.enter, obstacles) ?? simplify([a, b])).map(([x, y]) => [r2(x), r2(y)] as Point);
  }
}

// 軸に平行な線分が、矩形の内側を通るか
const segmentHits = (a: Point, b: Point, r: Rect) =>
  Math.min(a[0], b[0]) < r.x + r.w && Math.max(a[0], b[0]) > r.x && Math.min(a[1], b[1]) < r.y + r.h && Math.max(a[1], b[1]) > r.y;
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
// 矩形が、グループの枠線をまたぐか（枠の中に収まるか、外にあれば、またがない）
const crossesFrame = (r: Rect, g: Rect) => {
  const inside = r.x >= g.x && r.x + r.w <= g.x + g.w && r.y >= g.y && r.y + r.h <= g.y + g.h;
  return !inside && intersects(r, g);
};
const frame = (g: Rect): Point[] => [[g.x, g.y], [g.x + g.w, g.y], [g.x + g.w, g.y + g.h], [g.x, g.y + g.h], [g.x, g.y]];
