// elkjs で、文法から作った制約だけでサンプル構成図を配置できるかを確かめる検証。
// 実行: node spikes/elk-layout/layout.ts
// 案ごとに out/<案>.json（配置の結果）と out/<案>.svg を書き、リンターの結果を表で出す。

import ElkModule from "elkjs/lib/elk.bundled.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { edgeRule, regionOf, regionOrder, type EdgeRule, type Region } from "./grammar.ts";
import { model as baseModel, type Model, type ModelGroup, type ModelNode } from "./model.ts";

// elkjs の型定義は ESM の default export を宣言しているが、実体は CJS なので NodeNext では型が合わない
const ELK = ElkModule as unknown as typeof ElkModule.default;

const OUT = join(dirname(fileURLToPath(import.meta.url)), "out");
const NODE_H = 56;

// --- 文字幅 -----------------------------------------------------------------
// 検証では粗く見積もる。本実装では同梱フォントのメトリクスから測る。
const textWidth = (s: string, size: number) =>
  [...s].reduce((w, c) => w + (c.codePointAt(0)! >= 0x2e80 ? size : size * 0.6), 0);

// --- 配置の結果（ELK に依存しない形） --------------------------------------
type Rect = { x: number; y: number; w: number; h: number };
type Pt = [number, number];
export type Placed = {
  nodes: Record<string, Rect & { label: string; region: Region }>;
  groups: Record<string, Rect & { label: string; members: string[] }>;
  edges: { from: string; to: string; rule: EdgeRule; points: Pt[]; label?: { text: string } & Rect }[];
};

// --- 案 ---------------------------------------------------------------------
// A: 流れの向きと出入りの辺だけ。グループは ELK の入れ子のノードにする
// B: A に、領域から作った層と層内の順序の制約を足す（入れ子のまま）
// C: 入れ子をやめて平らに配置し、層と順序の制約を足す。グループの枠はあとから囲む
// D: C の制約を、ELK の対話モード（入力の座標を手がかりにする）に渡す。文法から粗いグリッドを作り、ELK が詰めて線を引く二段構成
// E: 本流と下段だけを A と同じく ELK で配置し、上段と端の列は文法から後で置く二段構成
// どの案でも、逆向きの線は ELK に向きを反転して渡す（閉路を壊すときに本流が反転されないように）
type Variant = "A" | "B" | "C" | "D" | "E";
type VariantOpt = { nested: boolean; constrain: boolean; interactive: boolean; postPlace?: boolean; note: string };
const variants: Record<Variant, VariantOpt> = {
  A: { nested: true, constrain: false, interactive: false, note: "流れの向き＋出入りの辺" },
  B: { nested: true, constrain: true, interactive: false, note: "A＋層と層内順序（入れ子）" },
  C: { nested: false, constrain: true, interactive: false, note: "平ら＋層と層内順序、枠は後付け" },
  D: { nested: false, constrain: true, interactive: true, note: "文法のグリッド→ELK対話モード" },
  E: { nested: true, constrain: false, interactive: false, postPlace: true, note: "A＋上段と端の列を後置き" },
};
const nodeWidth = (n: ModelNode) => Math.max(120, Math.ceil(textWidth(n.label, 13)) + 40);
const labelBox = (text: string) => ({ w: Math.ceil(textWidth(text, 11)) + 6, h: 16 });

type Ctx = {
  model: Model;
  nodeById: Map<string, ModelNode>;
  groupById: Map<string, ModelGroup>;
  parentOf: Map<string, string>; // ノードかグループ → 親グループ
};

function context(model: Model): Ctx {
  const groupById = new Map<string, ModelGroup>();
  const parentOf = new Map<string, string>();
  const walk = (g: ModelGroup) => {
    groupById.set(g.id, g);
    for (const m of g.members) parentOf.set(m, g.id);
    for (const c of g.groups ?? []) {
      parentOf.set(c.id, g.id);
      walk(c);
    }
  };
  model.groups.forEach(walk);
  return { model, nodeById: new Map(model.nodes.map((n) => [n.id, n])), groupById, parentOf };
}

const regionOfId = (ctx: Ctx, id: string) => regionOf(ctx.nodeById.get(id));

function rules(ctx: Ctx) {
  return ctx.model.edges.map((e) => edgeRule(e, regionOfId(ctx, e.from), regionOfId(ctx, e.to)));
}

// 文法から粗いグリッド（列と、列の中の順序）を作る。
// 本流は同期の呼び出しの最長路で列を決め、上段は呼び出す側の列、下段は発行する側の列から右へ、端の列は最後の列。
function grid(ctx: Ctx): Map<string, { layer: number; pos: number }> {
  const layer = new Map<string, number>();
  const rs = rules(ctx);
  const main = ctx.model.nodes.filter((n) => regionOf(n) === "main").map((n) => n.id);
  for (const id of main) layer.set(id, 0);
  for (let i = 0; i < main.length; i++) {
    ctx.model.edges.forEach((e, k) => {
      if (rs[k].style === "sync" && layer.has(e.from) && layer.has(e.to))
        layer.set(e.to, Math.max(layer.get(e.to)!, layer.get(e.from)! + 1));
    });
  }
  // 上段と下段は、呼び出す側（発行する側）が決まるまで繰り返す
  for (let i = 0; i < ctx.model.nodes.length; i++) {
    ctx.model.edges.forEach((e, k) => {
      if (!layer.has(e.from)) return;
      if (rs[k].style === "external") layer.set(e.to, layer.get(e.from)!);
      if (rs[k].style === "async")
        layer.set(e.to, layer.get(e.from)! + (regionOfId(ctx, e.from) === regionOfId(ctx, e.to) ? 1 : 0));
    });
  }
  const last = Math.max(...layer.values()) + 1;
  for (const n of ctx.model.nodes) if (regionOf(n) === "side") layer.set(n.id, last);

  const out = new Map<string, { layer: number; pos: number }>();
  const byLayer = new Map<number, ModelNode[]>();
  for (const n of ctx.model.nodes) {
    const l = layer.get(n.id) ?? 0;
    byLayer.set(l, [...(byLayer.get(l) ?? []), n]);
  }
  for (const [l, ns] of byLayer) {
    const rank = (n: ModelNode) => (regionOf(n) === "side" ? 0 : regionOrder.indexOf(regionOf(n)));
    ns.sort((a, b) => rank(a) - rank(b)); // 同じ領域の中はモデルの順（sort は安定）
    ns.forEach((n, pos) => out.set(n.id, { layer: l, pos }));
  }
  return out;
}

// --- ELK のグラフを作る ----------------------------------------------------
type ElkNode = Record<string, any>;

function buildElk(ctx: Ctx, v: Variant): ElkNode {
  const opt = variants[v];
  const rs = rules(ctx);
  const g = grid(ctx);
  const elkNodes = new Map<string, ElkNode>();

  for (const n of ctx.model.nodes) {
    if (opt.postPlace && (regionOf(n) === "top" || regionOf(n) === "side")) continue;
    const layoutOptions: Record<string, string> = { "elk.portConstraints": "FIXED_SIDE" };
    const cell = g.get(n.id)!;
    if (opt.constrain && !opt.interactive) {
      if (regionOf(n) === "side") layoutOptions["elk.layered.layering.layerConstraint"] = "LAST";
      else layoutOptions["elk.layered.layering.layerChoiceConstraint"] = String(cell.layer);
      layoutOptions["elk.layered.crossingMinimization.positionChoiceConstraint"] = String(cell.pos);
    }
    elkNodes.set(n.id, {
      id: n.id,
      width: nodeWidth(n),
      height: NODE_H,
      // 対話モードでは、グリッドの列と順序を座標の手がかりとして渡す
      ...(opt.interactive ? { x: cell.layer * 220, y: cell.pos * 120 } : {}),
      layoutOptions,
      ports: [],
    });
  }
  const groupNode = (gr: ModelGroup): ElkNode => ({
    id: gr.id,
    layoutOptions: {
      "elk.portConstraints": "FIXED_SIDE",
      "elk.padding": "[top=32,left=16,bottom=16,right=16]",
    },
    ports: [],
    children: [...gr.members.flatMap((m) => elkNodes.get(m) ?? []), ...(gr.groups ?? []).map(groupNode)],
  });
  const grouped = new Set(ctx.parentOf.keys());
  const children: ElkNode[] = opt.nested
    ? [...ctx.model.nodes.filter((n) => !grouped.has(n.id)).flatMap((n) => elkNodes.get(n.id) ?? []), ...ctx.model.groups.map(groupNode)]
    : [...elkNodes.values()];
  const all = new Map<string, ElkNode>();
  const index = (n: ElkNode) => {
    all.set(n.id, n);
    (n.children ?? []).forEach(index);
  };
  children.forEach(index);

  const edges: ElkNode[] = [];
  ctx.model.edges.forEach((e, k) => {
    const src = all.get(e.from);
    const tgt = all.get(e.to);
    if (!src || !tgt) return; // ELK に渡さなかった相手への線は後付けで引く
    const sp = { id: `e${k}.s`, layoutOptions: { "elk.port.side": rs[k].from } };
    const tp = { id: `e${k}.t`, layoutOptions: { "elk.port.side": rs[k].to } };
    src.ports.push(sp);
    tgt.ports.push(tp);
    const reversed = rs[k].style === "reverse";
    edges.push({
      id: `e${k}`,
      sources: [reversed ? tp.id : sp.id],
      targets: [reversed ? sp.id : tp.id],
      labels: e.label ? [{ text: e.label, width: labelBox(e.label).w, height: labelBox(e.label).h }] : [],
    });
  });

  return {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": "RIGHT",
      "elk.edgeRouting": "ORTHOGONAL",
      "elk.hierarchyHandling": opt.nested ? "INCLUDE_CHILDREN" : "SEPARATE_CHILDREN",
      "elk.json.shapeCoords": "ROOT",
      "elk.json.edgeCoords": "ROOT",
      "elk.spacing.nodeNode": "40",
      "elk.layered.spacing.nodeNodeBetweenLayers": "60",
      "elk.spacing.edgeLabel": "4",
      "elk.layered.considerModelOrder.strategy": "NODES_AND_EDGES",
      "elk.separateConnectedComponents": "false",
      ...(opt.interactive
        ? {
            "elk.layered.cycleBreaking.strategy": "INTERACTIVE",
            "elk.layered.layering.strategy": "INTERACTIVE",
            "elk.layered.crossingMinimization.strategy": "INTERACTIVE",
          }
        : {}),
    },
    children,
    edges,
  };
}

// --- ELK の結果を、ELK に依存しない形に直す -------------------------------
const r2 = (n: number) => Math.round(n * 100) / 100;

function flatten(ctx: Ctx, v: Variant, laid: ElkNode): Placed {
  const placed: Placed = { nodes: {}, groups: {}, edges: [] };
  const visit = (n: ElkNode) => {
    const rect = { x: r2(n.x), y: r2(n.y), w: r2(n.width), h: r2(n.height) };
    const m = ctx.nodeById.get(n.id);
    if (m) placed.nodes[n.id] = { ...rect, label: m.label, region: regionOf(m) };
    const gr = ctx.groupById.get(n.id);
    if (gr) placed.groups[n.id] = { ...rect, label: gr.label, members: membersOf(ctx, gr) };
    (n.children ?? []).forEach(visit);
  };
  (laid.children ?? []).forEach(visit);

  // 平らな案では、グループの枠をメンバーの外接矩形から作る（内側から順に）
  if (!variants[v].nested) {
    const make = (gr: ModelGroup): Rect => {
      const rects = [...gr.members.map((m) => placed.nodes[m]), ...(gr.groups ?? []).map(make)];
      const x = Math.min(...rects.map((r) => r.x)) - 16;
      const y = Math.min(...rects.map((r) => r.y)) - 32;
      const rect = {
        x,
        y,
        w: Math.max(...rects.map((r) => r.x + r.w)) + 16 - x,
        h: Math.max(...rects.map((r) => r.y + r.h)) + 16 - y,
      };
      placed.groups[gr.id] = { ...rect, label: gr.label, members: membersOf(ctx, gr) };
      return rect;
    };
    ctx.model.groups.forEach(make);
  }

  // 後置き：上段は呼び出す側の真上、端の列は全体の右に、使う側のグループの高さの中央に揃えて積む
  if (variants[v].postPlace) {
    const rs0 = rules(ctx);
    const body = [...Object.values(placed.nodes), ...Object.values(placed.groups)];
    const top = Math.min(...body.map((r) => r.y));
    const right = Math.max(...body.map((r) => r.x + r.w));
    const tops: (Rect & { id: string })[] = [];
    ctx.model.edges.forEach((e, k) => {
      if (rs0[k].style !== "external" || placed.nodes[e.to]) return;
      const n = ctx.nodeById.get(e.to)!;
      const c = placed.nodes[e.from];
      const w = nodeWidth(n);
      tops.push({ id: n.id, x: r2(c.x + c.w / 2 - w / 2), y: top - 100 - NODE_H, w, h: NODE_H });
    });
    // 上段どうしが重なるときは右へずらす
    tops.sort((a, b) => a.x - b.x);
    for (let i = 1; i < tops.length; i++) tops[i].x = Math.max(tops[i].x, tops[i - 1].x + tops[i - 1].w + 40);
    for (const t of tops) placed.nodes[t.id] = { x: t.x, y: t.y, w: t.w, h: t.h, label: ctx.nodeById.get(t.id)!.label, region: "top" };

    const sides = ctx.model.nodes.filter((n) => regionOf(n) === "side");
    const users = ctx.model.edges.filter((e) => sides.some((n) => n.id === e.to)).map((e) => placed.groups[e.from] ?? placed.nodes[e.from]);
    const span = users.length
      ? [Math.min(...users.map((u) => u.y)), Math.max(...users.map((u) => u.y + u.h))]
      : [top, top + 400];
    const height = sides.length * NODE_H + (sides.length - 1) * 40;
    let y = r2((span[0] + span[1]) / 2 - height / 2);
    for (const n of sides) {
      placed.nodes[n.id] = { x: right + 120, y, w: nodeWidth(n), h: NODE_H, label: n.label, region: "side" };
      y += NODE_H + 40;
    }
  }

  const rs = rules(ctx);
  const elkEdges = new Map<string, ElkNode>((laid.edges ?? []).map((e: ElkNode) => [e.id, e]));
  ctx.model.edges.forEach((e, k) => {
    const ee = elkEdges.get(`e${k}`);
    let points: Pt[];
    if (ee) {
      const s = ee.sections[0];
      points = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((p: any) => [r2(p.x), r2(p.y)]);
      if (rs[k].style === "reverse") points.reverse();
    } else if (rs[k].style === "external") {
      // 後付けの線：呼び出す側の上辺から真上へ
      const c = placed.nodes[e.from];
      const t = placed.nodes[e.to];
      const x = r2(c.x + c.w / 2);
      points = [[x, c.y], [x, t.y + t.h]];
    } else {
      // 後付けの線：グループの右辺から、相手の左辺の中央へ。高さが合わなければ途中で折る
      const g = placed.groups[e.from];
      const t = placed.nodes[e.to];
      const ty = r2(t.y + t.h / 2);
      const sy = Math.min(Math.max(ty, g.y + 8), g.y + g.h - 8);
      const mx = r2((g.x + g.w + t.x) / 2);
      points = sy === ty ? [[g.x + g.w, ty], [t.x, ty]] : [[g.x + g.w, sy], [mx, sy], [mx, ty], [t.x, ty]];
    }
    let l = ee?.labels?.[0];
    if (!ee && e.label) {
      // 後付けの線のラベルは、線の中点の右に置く
      const [a, b] = [points[0], points.at(-1)!];
      const box = labelBox(e.label);
      l = { text: e.label, x: (a[0] + b[0]) / 2 + 6, y: (a[1] + b[1]) / 2 - box.h / 2, width: box.w, height: box.h };
    }
    placed.edges.push({
      from: e.from,
      to: e.to,
      rule: rs[k],
      points,
      ...(l ? { label: { text: l.text, x: r2(l.x), y: r2(l.y), w: r2(l.width), h: r2(l.height) } } : {}),
    });
  });
  return normalize(placed);
}

// 左上の余白を揃える。後置きで負の座標になる案があるため
function normalize(p: Placed): Placed {
  const rects = [...Object.values(p.nodes), ...Object.values(p.groups)];
  const pts = p.edges.flatMap((e) => e.points);
  const dx = r2(20 - Math.min(...rects.map((r) => r.x), ...pts.map((q) => q[0])));
  const dy = r2(20 - Math.min(...rects.map((r) => r.y), ...pts.map((q) => q[1])));
  const mv = <T extends Rect>(r: T): T => ({ ...r, x: r2(r.x + dx), y: r2(r.y + dy) });
  return {
    nodes: Object.fromEntries(Object.entries(p.nodes).map(([k, r]) => [k, mv(r)])),
    groups: Object.fromEntries(Object.entries(p.groups).map(([k, r]) => [k, mv(r)])),
    edges: p.edges.map((e) => ({
      ...e,
      points: e.points.map(([x, y]) => [r2(x + dx), r2(y + dy)] as Pt),
      ...(e.label ? { label: mv(e.label) } : {}),
    })),
  };
}

function membersOf(ctx: Ctx, g: ModelGroup): string[] {
  return [...g.members, ...(g.groups ?? []).flatMap((c) => membersOf(ctx, c))];
}

// --- リンター（benchmarks/sample-arch/grammar.md の不変条件） --------------
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const onSide = (p: Pt, r: Rect, side: string, eps = 0.5) =>
  side === "WEST" ? Math.abs(p[0] - r.x) < eps
  : side === "EAST" ? Math.abs(p[0] - (r.x + r.w)) < eps
  : side === "NORTH" ? Math.abs(p[1] - r.y) < eps
  : Math.abs(p[1] - (r.y + r.h)) < eps;
const cx = (r: Rect) => r.x + r.w / 2;

// 線分が矩形の枠を横切る回数（軸に平行な線分だけを扱う）
function borderCrossings(a: Pt, b: Pt, r: Rect): number {
  const inside = (p: Pt) => p[0] > r.x && p[0] < r.x + r.w && p[1] > r.y && p[1] < r.y + r.h;
  if (inside(a) !== inside(b)) return 1;
  if (inside(a)) return 0;
  // 両端とも外：矩形を貫いていれば2回
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  if (y1 === y2) return y1 > r.y && y1 < r.y + r.h && x1 < r.x && x2 > r.x + r.w ? 2 : 0;
  return x1 > r.x && x1 < r.x + r.w && y1 < r.y && y2 > r.y + r.h ? 2 : 0;
}

export function lint(p: Placed): Record<string, string[]> {
  const v: Record<string, string[]> = {
    "1 重なり": [], "2 出入りの辺": [], "3 領域": [], "4 同期の向き": [],
    "5 上段の列": [], "6 逆向きは外周": [], "7 枠の横切り": [],
  };
  const nodes = Object.entries(p.nodes);
  const labels = p.edges.flatMap((e) => (e.label ? [e.label] : []));
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (overlap(nodes[i][1], nodes[j][1])) v["1 重なり"].push(`${nodes[i][0]}×${nodes[j][0]}`);
  for (const l of labels) for (const [id, n] of nodes) if (overlap(l, n)) v["1 重なり"].push(`「${l.text}」×${id}`);

  const shape = (id: string): Rect => p.nodes[id] ?? p.groups[id];
  for (const e of p.edges) {
    const name = `${e.from}→${e.to}`;
    if (!onSide(e.points[0], shape(e.from), e.rule.from)) v["2 出入りの辺"].push(`${name} が ${e.rule.from} から出ていない`);
    if (!onSide(e.points.at(-1)!, shape(e.to), e.rule.to)) v["2 出入りの辺"].push(`${name} が ${e.rule.to} に入っていない`);
    if (e.rule.style === "sync" && cx(shape(e.from)) >= cx(shape(e.to))) v["4 同期の向き"].push(name);
    if (e.rule.style === "external" && Math.abs(cx(shape(e.from)) - cx(shape(e.to))) > 1) v["5 上段の列"].push(name);
    if (e.rule.style === "reverse") {
      const low = Math.max(...e.points.map((q) => q[1]));
      const span = [Math.min(...e.points.map((q) => q[0])), Math.max(...e.points.map((q) => q[0]))];
      for (const [id, n] of nodes)
        if (n.region !== "top" && n.x < span[1] && n.x + n.w > span[0] && n.y + n.h > low) v["6 逆向きは外周"].push(`${name} が ${id} より上を通る`);
    }
    for (const [gid, g] of Object.entries(p.groups)) {
      if (gid === e.from || gid === e.to) continue;
      const inside = (id: string) => g.members.includes(id) || (p.groups[id]?.members.every((m) => g.members.includes(m)) ?? false);
      const expected = inside(e.from) === inside(e.to) ? 0 : 1;
      let n = 0;
      for (let i = 1; i < e.points.length; i++) n += borderCrossings(e.points[i - 1], e.points[i], g);
      if (n !== expected) v["7 枠の横切り"].push(`${name} が ${gid} の枠を ${n} 回横切る（期待 ${expected}）`);
    }
  }

  const byRegion = (r: Region) => nodes.filter(([, n]) => n.region === r).map(([, n]) => n);
  const [top, main, bottom, side] = (["top", "main", "bottom", "side"] as Region[]).map(byRegion);
  if (Math.max(...top.map((n) => n.y + n.h)) > Math.min(...main.map((n) => n.y))) v["3 領域"].push("上段が本流より上にない");
  if (Math.min(...bottom.map((n) => n.y)) < Math.max(...main.map((n) => n.y + n.h))) v["3 領域"].push("下段が本流より下にない");
  const rightOfRest = Math.max(...[...top, ...main, ...bottom, ...Object.values(p.groups)].map((n) => n.x + n.w));
  if (Math.min(...side.map((n) => n.x)) < rightOfRest) v["3 領域"].push("端の列がほかより右にない");
  return v;
}

// --- 描画 -------------------------------------------------------------------
const STROKE: Record<string, string> = {
  sync: `stroke="#1f2937" stroke-width="1.6"`,
  external: `stroke="#1f2937" stroke-width="1.6"`,
  async: `stroke="#1f2937" stroke-width="1.6" stroke-dasharray="6 4"`,
  reverse: `stroke="#b45309" stroke-width="1.6" stroke-dasharray="2 3"`,
  telemetry: `stroke="#9ca3af" stroke-width="1.2" stroke-dasharray="2 3"`,
};

function svg(p: Placed, title: string): string {
  const shapes = [...Object.values(p.nodes), ...Object.values(p.groups)];
  const pts = p.edges.flatMap((e) => e.points);
  const W = Math.ceil(Math.max(...shapes.map((s) => s.x + s.w), ...pts.map((q) => q[0]))) + 40;
  const H = Math.ceil(Math.max(...shapes.map((s) => s.y + s.h), ...pts.map((q) => q[1]))) + 40;
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const o = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H + 30}" viewBox="0 -30 ${W} ${H + 30}" font-family="Noto Sans CJK JP, sans-serif" font-size="13">`,
    `<defs><marker id="a" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="context-stroke"/></marker></defs>`,
    `<rect x="0" y="-30" width="${W}" height="${H + 30}" fill="#fff"/>`,
    `<text x="8" y="-10" fill="#6b7280" font-size="12">${esc(title)}</text>`,
  ];
  for (const g of Object.values(p.groups))
    o.push(`<rect x="${g.x}" y="${g.y}" width="${g.w}" height="${g.h}" rx="8" fill="none" stroke="#6b7280"/>`,
      `<text x="${g.x + 8}" y="${g.y + 16}" fill="#374151" font-size="12">${esc(g.label)}</text>`);
  for (const n of Object.values(p.nodes))
    o.push(`<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="6" fill="#f9fafb" stroke="#111827"/>`,
      `<text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 5}" text-anchor="middle">${esc(n.label)}</text>`);
  for (const e of p.edges) {
    const d = e.points.map(([x, y], i) => `${i ? "L" : "M"}${x},${y}`).join(" ");
    o.push(`<path d="${d}" fill="none" ${STROKE[e.rule.style]} marker-end="url(#a)"/>`);
    if (e.label) o.push(`<text x="${e.label.x + 3}" y="${e.label.y + 12}" fill="#374151" font-size="11">${esc(e.label.text)}</text>`);
  }
  o.push(`</svg>`);
  return o.join("\n") + "\n";
}

// --- 実行 -------------------------------------------------------------------
async function run(model: Model, v: Variant): Promise<{ placed?: Placed; json?: string; error?: string }> {
  const ctx = context(model);
  try {
    const laid = await new ELK().layout(buildElk(ctx, v) as any);
    const placed = flatten(ctx, v, laid);
    return { placed, json: JSON.stringify(placed, null, 1) + "\n" };
  } catch (err) {
    return { error: String((err as Error).message ?? err).split("\n")[0] };
  }
}

// 安定性：本流に1つノードを足したとき、ほかのノードがどれだけ動くか
function withExtraNode(m: Model): Model {
  return {
    nodes: [...m.nodes, { id: "search", label: "検索サービス" }],
    groups: m.groups.map((g) => (g.id === "vpc" ? { ...g, groups: g.groups?.map((c) => ({ ...c, members: [...c.members, "search"] })) } : g)),
    edges: [...m.edges, { from: "apigw", to: "search", kind: "call" }],
  };
}

mkdirSync(OUT, { recursive: true });
const rows: string[] = [];
for (const v of Object.keys(variants) as Variant[]) {
  const a = await run(baseModel, v);
  if (!a.placed) {
    rows.push(`| ${v} | ${variants[v].note} | 失敗: ${a.error} | | | |`);
    continue;
  }
  const b = await run(baseModel, v);
  writeFileSync(join(OUT, `${v}.json`), a.json!);
  writeFileSync(join(OUT, `${v}.svg`), svg(a.placed, `案${v}：${variants[v].note}`));
  const result = lint(a.placed);
  const count = Object.values(result).reduce((s, x) => s + x.length, 0);
  const plus = await run(withExtraNode(baseModel), v);
  const moved = plus.placed
    ? Object.entries(a.placed.nodes).reduce(
        (s, [id, n]) => s + Math.hypot(plus.placed!.nodes[id].x - n.x, plus.placed!.nodes[id].y - n.y), 0)
    : NaN;
  writeFileSync(join(OUT, `${v}.lint.json`), JSON.stringify(result, null, 1) + "\n");
  const by = Object.entries(result).filter(([, x]) => x.length).map(([k, x]) => `${k.split(" ")[0]}:${x.length}`).join(" ");
  rows.push(`| ${v} | ${variants[v].note} | ${count}（${by || "なし"}） | ${a.json === b.json ? "同じ" : "違う"} | ${Math.round(moved)} |`);
}
console.log("| 案 | 内容 | 違反（規則番号:件数） | 2回実行 | 1ノード追加時の移動量合計(px) |");
console.log("| --- | --- | --- | --- | --- |");
console.log(rows.join("\n"));
