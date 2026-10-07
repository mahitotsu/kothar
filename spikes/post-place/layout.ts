// 検証 0002：後から置く規則（上段は呼び出す側の真上、端の列は全体の右）が、特定の図の形に依存しないかを確かめる。
// 実行: node spikes/post-place/layout.ts
// out/<題材>-<案>.json（配置の結果）、.svg、.lint.json を書き、結果の表を出す。
// 検証 0001 の spikes/elk-layout/layout.ts をもとにした。違いは各所のコメントに書く。

import ElkModule from "elkjs/lib/elk.bundled.js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  archGrammar, process as processModel, processGrammar, sample, shared,
  type EdgeRule, type Grammar, type Model, type ModelGroup, type ModelNode, type Region, type Side,
} from "./models.ts";

const ELK = ElkModule as unknown as typeof ElkModule.default;
const OUT = join(dirname(fileURLToPath(import.meta.url)), "out");
const NODE_H = 56;

const textWidth = (s: string, size: number) =>
  [...s].reduce((w, c) => w + (c.codePointAt(0)! >= 0x2e80 ? size : size * 0.6), 0);
const nodeWidth = (n: ModelNode) => Math.max(120, Math.ceil(textWidth(n.label, 13)) + 40);
const labelBox = (text: string) => ({ w: Math.ceil(textWidth(text, 11)) + 6, h: 16 });
const r2 = (n: number) => Math.round(n * 100) / 100;

type Rect = { x: number; y: number; w: number; h: number };
type Pt = [number, number];
type Placed = {
  nodes: Record<string, Rect & { label: string; region: Region }>;
  groups: Record<string, Rect & { label: string; members: string[] }>;
  edges: { from: string; to: string; rule: EdgeRule; points: Pt[]; routed?: boolean; label?: { text: string } & Rect }[];
};

// --- 案 ---------------------------------------------------------------------
// A〜D：検証 0001 と同じ。検証 0001 のリンターの訂正（規則6の範囲）のためにだけ回す。
// E：検証 0001 の案 E。上段は呼び出す側ごとにその真上、端の列は全体の右。後付けの線はまっすぐ引く。
//    違いは、端の列を使う側がノードのときにも線を引けるようにしたことだけ（検証 0001 ではグループだけを想定していた）。
// F：上段のノードは、呼び出す側すべての中心の平均の真上に1つだけ置く。後付けの線は、ノードを避ける直交の経路探索で引く。
// G：上段のノードの幅を、呼び出す側すべての中心を含むまで広げる。後付けの線は F と同じ経路探索で引く。
type Variant = "A" | "B" | "C" | "D" | "E" | "F" | "G";
type VariantOpt = { nested: boolean; constrain: boolean; interactive: boolean; post?: "E" | "F" | "G"; note: string };
const variants: Record<Variant, VariantOpt> = {
  A: { nested: true, constrain: false, interactive: false, note: "流れの向き＋出入りの辺" },
  B: { nested: true, constrain: true, interactive: false, note: "A＋層と層内順序（入れ子）" },
  C: { nested: false, constrain: true, interactive: false, note: "平ら＋層と層内順序、枠は後付け" },
  D: { nested: false, constrain: true, interactive: true, note: "文法のグリッド→ELK対話モード" },
  E: { nested: true, constrain: false, interactive: false, post: "E", note: "検証0001の案E" },
  F: { nested: true, constrain: false, interactive: false, post: "F", note: "上段は呼び出す側の平均の上＋経路探索" },
  G: { nested: true, constrain: false, interactive: false, post: "G", note: "上段を呼び出す側の幅に広げる＋経路探索" },
};

type Ctx = {
  model: Model;
  grammar: Grammar;
  nodeById: Map<string, ModelNode>;
  groupById: Map<string, ModelGroup>;
  parentOf: Map<string, string>;
};

function context(model: Model, grammar: Grammar): Ctx {
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
  return { model, grammar, nodeById: new Map(model.nodes.map((n) => [n.id, n])), groupById, parentOf };
}

// グループは本流に属するものとして扱う
function regionOf(ctx: Ctx, n: ModelNode | undefined): Region {
  for (const r of ctx.grammar.regions) if (n?.attrs?.[r.attr] === r.value) return r.region;
  return "main";
}
const regionOfId = (ctx: Ctx, id: string) => regionOf(ctx, ctx.nodeById.get(id));
const rules = (ctx: Ctx) =>
  ctx.model.edges.map((e) => ctx.grammar.edges[e.kind](regionOfId(ctx, e.from), regionOfId(ctx, e.to)));

// 検証 0001 と同じ粗いグリッド（案 B〜D で使う）
function grid(ctx: Ctx): Map<string, { layer: number; pos: number }> {
  const layer = new Map<string, number>();
  const rs = rules(ctx);
  const main = ctx.model.nodes.filter((n) => regionOf(ctx, n) === "main").map((n) => n.id);
  for (const id of main) layer.set(id, 0);
  for (let i = 0; i < main.length; i++)
    ctx.model.edges.forEach((e, k) => {
      if (rs[k].style === "sync" && layer.has(e.from) && layer.has(e.to))
        layer.set(e.to, Math.max(layer.get(e.to)!, layer.get(e.from)! + 1));
    });
  for (let i = 0; i < ctx.model.nodes.length; i++)
    ctx.model.edges.forEach((e, k) => {
      if (!layer.has(e.from)) return;
      if (rs[k].style === "external") layer.set(e.to, layer.get(e.from)!);
      if (rs[k].style === "async")
        layer.set(e.to, layer.get(e.from)! + (regionOfId(ctx, e.from) === regionOfId(ctx, e.to) ? 1 : 0));
    });
  const last = Math.max(...layer.values()) + 1;
  for (const n of ctx.model.nodes) if (regionOf(ctx, n) === "side") layer.set(n.id, last);
  const order: Region[] = ["top", "main", "bottom"];
  const out = new Map<string, { layer: number; pos: number }>();
  const byLayer = new Map<number, ModelNode[]>();
  for (const n of ctx.model.nodes) {
    const l = layer.get(n.id) ?? 0;
    byLayer.set(l, [...(byLayer.get(l) ?? []), n]);
  }
  for (const [l, ns] of byLayer) {
    const rank = (n: ModelNode) => (regionOf(ctx, n) === "side" ? 0 : order.indexOf(regionOf(ctx, n)));
    ns.sort((a, b) => rank(a) - rank(b));
    ns.forEach((n, pos) => out.set(n.id, { layer: l, pos }));
  }
  return out;
}

// --- ELK のグラフ（検証 0001 と同じ） ---------------------------------------
type ElkNode = Record<string, any>;

function buildElk(ctx: Ctx, v: Variant): ElkNode {
  const opt = variants[v];
  const rs = rules(ctx);
  const g = grid(ctx);
  const elkNodes = new Map<string, ElkNode>();
  for (const n of ctx.model.nodes) {
    const region = regionOf(ctx, n);
    if (opt.post && (region === "top" || region === "side")) continue;
    const layoutOptions: Record<string, string> = { "elk.portConstraints": "FIXED_SIDE" };
    const cell = g.get(n.id)!;
    if (opt.constrain && !opt.interactive) {
      if (region === "side") layoutOptions["elk.layered.layering.layerConstraint"] = "LAST";
      else layoutOptions["elk.layered.layering.layerChoiceConstraint"] = String(cell.layer);
      layoutOptions["elk.layered.crossingMinimization.positionChoiceConstraint"] = String(cell.pos);
    }
    elkNodes.set(n.id, {
      id: n.id,
      width: nodeWidth(n),
      height: NODE_H,
      ...(opt.interactive ? { x: cell.layer * 220, y: cell.pos * 120 } : {}),
      layoutOptions,
      ports: [],
    });
  }
  const groupNode = (gr: ModelGroup): ElkNode => ({
    id: gr.id,
    layoutOptions: { "elk.portConstraints": "FIXED_SIDE", "elk.padding": "[top=32,left=16,bottom=16,right=16]" },
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
    if (!src || !tgt) return;
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

// --- 直交の経路探索（案 F、G） ----------------------------------------------
// 格子の上で、ノードを通らず、ノードのまわりの余白、折れ曲がり、グループの枠の横切りの少ない経路を、ダイクストラ法で探す。
// 余白を通れなくすると、ELK が同じ層に 20px の間隔で積んだノードの間から出られない。
// 出る点と入る点は、文法が決めた辺の上に置き、辺から垂直に出入りさせる。
const STEP = 5;
const PAD = 10; // ノードのまわりの余白。通れるが、1歩ごとに MARGIN の費用がかかる
const MARGIN = 4;
const BEND = 12; // 折れ曲がり1回の費用（格子の歩数で数える）
const CROSS = 60; // グループの枠を1回横切る費用
const DIRS: Pt[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const outward: Record<Side, number> = { EAST: 0, SOUTH: 1, WEST: 2, NORTH: 3 };

function route(p: Placed, from: Pt, fromSide: Side, to: Pt, toSide: Side, ends: string[]): Pt[] | undefined {
  const rects = [...Object.values(p.nodes), ...Object.values(p.groups)];
  const x0 = Math.min(...rects.map((r) => r.x)) - 200;
  const y0 = Math.min(...rects.map((r) => r.y)) - 200;
  const W = Math.ceil((Math.max(...rects.map((r) => r.x + r.w)) + 200 - x0) / STEP);
  const H = Math.ceil((Math.max(...rects.map((r) => r.y + r.h)) + 200 - y0) / STEP);
  const blocked = new Uint8Array(W * H); // 1：余白、2：ノードの中
  for (const n of Object.values(p.nodes))
    for (const [pad, mark] of [[PAD, 1], [1, 2]] as const) {
      const [a, b] = [Math.floor((n.x - pad - x0) / STEP), Math.ceil((n.x + n.w + pad - x0) / STEP)];
      const [c, d] = [Math.floor((n.y - pad - y0) / STEP), Math.ceil((n.y + n.h + pad - y0) / STEP)];
      for (let i = Math.max(0, a); i <= Math.min(W - 1, b); i++)
        for (let j = Math.max(0, c); j <= Math.min(H - 1, d); j++) blocked[j * W + i] = Math.max(blocked[j * W + i], mark);
    }
  const groups = Object.entries(p.groups).filter(([id]) => !ends.includes(id)).map(([, g]) => g);
  const inside = (r: Rect, i: number, j: number) => {
    const [x, y] = [x0 + i * STEP, y0 + j * STEP];
    return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  };
  // 出る点と入る点から、辺の外へ余白の分だけ出た格子点
  const off = (q: Pt, side: Side): [number, number] => {
    const [dx, dy] = DIRS[outward[side]];
    return [Math.round((q[0] + dx * 2 * STEP - x0) / STEP), Math.round((q[1] + dy * 2 * STEP - y0) / STEP)];
  };
  const [si, sj] = off(from, fromSide);
  const [ti, tj] = off(to, toSide);
  const startDir = outward[fromSide];
  const endDir = (outward[toSide] + 2) % 4; // 入る辺に向かって進む向き
  blocked[sj * W + si] = 0;
  blocked[tj * W + ti] = 0;

  const N = W * H * 4;
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const heap: [number, number, number][] = []; // [費用, 通し番号, 状態]
  let seq = 0;
  const push = (c: number, s: number) => {
    heap.push([c, seq++, s]);
    let i = heap.length - 1;
    while (i > 0) {
      const pa = (i - 1) >> 1;
      if (heap[pa][0] < heap[i][0] || (heap[pa][0] === heap[i][0] && heap[pa][1] < heap[i][1])) break;
      [heap[pa], heap[i]] = [heap[i], heap[pa]];
      i = pa;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const [l, r] = [2 * i + 1, 2 * i + 2];
        let m = i;
        const less = (a: number, b: number) => heap[a][0] < heap[b][0] || (heap[a][0] === heap[b][0] && heap[a][1] < heap[b][1]);
        if (l < heap.length && less(l, m)) m = l;
        if (r < heap.length && less(r, m)) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  const start = (sj * W + si) * 4 + startDir;
  dist[start] = 0;
  push(0, start);
  let goal = -1;
  while (heap.length) {
    const [c, , s] = pop();
    if (c > dist[s]) continue;
    const cell = s >> 2;
    const dir = s & 3;
    const [i, j] = [cell % W, Math.floor(cell / W)];
    if (i === ti && j === tj) {
      if (dir === endDir) {
        goal = s;
        break;
      }
    }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === (dir + 2) % 4) continue;
      const [ni, nj] = [i + DIRS[nd][0], j + DIRS[nd][1]];
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || blocked[nj * W + ni] === 2) continue;
      let cost = c + 1 + (nd === dir ? 0 : BEND) + (blocked[nj * W + ni] ? MARGIN : 0);
      for (const g of groups) if (inside(g, i, j) !== inside(g, ni, nj)) cost += CROSS;
      const ns = (nj * W + ni) * 4 + nd;
      if (cost < dist[ns]) {
        dist[ns] = cost;
        prev[ns] = s;
        push(cost, ns);
      }
    }
    // 終点では、向きだけを変えられる（入る辺に向かうための最後の折れ曲がり）
    if (i === ti && j === tj && dir !== endDir) {
      const ns = cell * 4 + endDir;
      if (c + BEND < dist[ns]) {
        dist[ns] = c + BEND;
        prev[ns] = s;
        push(c + BEND, ns);
      }
    }
  }
  if (goal < 0) return undefined;
  const cells: Pt[] = [];
  for (let s = goal; s >= 0; s = prev[s]) {
    const cell = s >> 2;
    const pt: Pt = [r2(x0 + (cell % W) * STEP), r2(y0 + Math.floor(cell / W) * STEP)];
    if (!cells.length || cells.at(-1)![0] !== pt[0] || cells.at(-1)![1] !== pt[1]) cells.push(pt);
  }
  cells.reverse();
  // 辺の上の点と、格子の点の間を、辺に垂直な線分でつなぐ
  const a: Pt = fromSide === "NORTH" || fromSide === "SOUTH" ? [cells[0][0], from[1]] : [from[0], cells[0][1]];
  const b: Pt = toSide === "NORTH" || toSide === "SOUTH" ? [cells.at(-1)![0], to[1]] : [to[0], cells.at(-1)![1]];
  return simplify([a, ...cells, b]);
}

// 一直線に並ぶ途中の点を除く
function simplify(pts: Pt[]): Pt[] {
  const out: Pt[] = [];
  for (const q of pts) {
    if (out.length && out.at(-1)![0] === q[0] && out.at(-1)![1] === q[1]) continue;
    if (out.length >= 2) {
      const [a, b] = [out.at(-2)!, out.at(-1)!];
      if ((a[0] === b[0] && b[0] === q[0]) || (a[1] === b[1] && b[1] === q[1])) out.pop();
    }
    out.push(q);
  }
  return out;
}

// --- ELK の結果を、ELK に依存しない形に直し、後から置く -----------------------
function flatten(ctx: Ctx, v: Variant, laid: ElkNode): Placed {
  const placed: Placed = { nodes: {}, groups: {}, edges: [] };
  const visit = (n: ElkNode) => {
    const rect = { x: r2(n.x), y: r2(n.y), w: r2(n.width), h: r2(n.height) };
    const m = ctx.nodeById.get(n.id);
    if (m) placed.nodes[n.id] = { ...rect, label: m.label, region: regionOf(ctx, m) };
    const gr = ctx.groupById.get(n.id);
    if (gr) placed.groups[n.id] = { ...rect, label: gr.label, members: membersOf(gr) };
    (n.children ?? []).forEach(visit);
  };
  (laid.children ?? []).forEach(visit);

  if (!variants[v].nested) {
    const make = (gr: ModelGroup): Rect => {
      const rects = [...gr.members.map((m) => placed.nodes[m]), ...(gr.groups ?? []).map(make)];
      const x = Math.min(...rects.map((r) => r.x)) - 16;
      const y = Math.min(...rects.map((r) => r.y)) - 32;
      const rect = { x, y, w: Math.max(...rects.map((r) => r.x + r.w)) + 16 - x, h: Math.max(...rects.map((r) => r.y + r.h)) + 16 - y };
      placed.groups[gr.id] = { ...rect, label: gr.label, members: membersOf(gr) };
      return rect;
    };
    ctx.model.groups.forEach(make);
  }

  const rs = rules(ctx);
  const post = variants[v].post;
  const shape = (id: string): Rect => placed.nodes[id] ?? placed.groups[id];
  if (post) {
    const body = [...Object.values(placed.nodes), ...Object.values(placed.groups)];
    const top = Math.min(...body.map((r) => r.y));
    const right = Math.max(...body.map((r) => r.x + r.w));
    const tops: (Rect & { id: string })[] = [];
    if (post === "E") {
      // 検証 0001 のまま：上段への線ごとに、呼び出す側の真上に置く（共有されると後の線の位置で上書きされる）
      ctx.model.edges.forEach((e, k) => {
        if (rs[k].style !== "external" || placed.nodes[e.to]) return;
        const n = ctx.nodeById.get(e.to)!;
        const c = placed.nodes[e.from];
        const w = nodeWidth(n);
        tops.push({ id: n.id, x: r2(c.x + c.w / 2 - w / 2), y: top - 100 - NODE_H, w, h: NODE_H });
      });
    } else {
      for (const n of ctx.model.nodes.filter((n) => regionOf(ctx, n) === "top")) {
        const callers = ctx.model.edges.filter((e, k) => e.to === n.id && rs[k].style === "external").map((e) => shape(e.from));
        const cxs = callers.map((c) => c.x + c.w / 2);
        const w0 = nodeWidth(n);
        if (post === "F" || cxs.length < 2) {
          const mid = cxs.reduce((s, x) => s + x, 0) / cxs.length;
          tops.push({ id: n.id, x: r2(mid - w0 / 2), y: top - 100 - NODE_H, w: w0, h: NODE_H });
        } else {
          const [lo, hi] = [Math.min(...cxs), Math.max(...cxs)];
          const w = Math.max(w0, hi - lo + 60);
          tops.push({ id: n.id, x: r2((lo + hi) / 2 - w / 2), y: top - 100 - NODE_H, w, h: NODE_H });
        }
      }
    }
    tops.sort((a, b) => a.x - b.x);
    for (let i = 1; i < tops.length; i++) tops[i].x = Math.max(tops[i].x, tops[i - 1].x + tops[i - 1].w + 40);
    for (const t of tops) placed.nodes[t.id] = { x: t.x, y: t.y, w: t.w, h: t.h, label: ctx.nodeById.get(t.id)!.label, region: "top" };

    const sides = ctx.model.nodes.filter((n) => regionOf(ctx, n) === "side");
    const users = ctx.model.edges.filter((e) => sides.some((n) => n.id === e.to)).map((e) => shape(e.from));
    const span = users.length ? [Math.min(...users.map((u) => u.y)), Math.max(...users.map((u) => u.y + u.h))] : [top, top + 400];
    const height = sides.length * NODE_H + (sides.length - 1) * 40;
    let y = r2((span[0] + span[1]) / 2 - height / 2);
    for (const n of sides) {
      placed.nodes[n.id] = { x: right + 120, y, w: nodeWidth(n), h: NODE_H, label: n.label, region: "side" };
      y += NODE_H + 40;
    }
  }

  // 後付けの線の、辺の上の出入りの点。同じ辺から複数の線が出入りするときは、相手の位置の順に等間隔に並べる
  const postEdges = ctx.model.edges.map((e, k) => ({ e, k })).filter(({ e }) => post && (!ctx.nodeById.has(e.from) || regionOfId(ctx, e.from) !== "top") && (regionOfId(ctx, e.to) === "top" || regionOfId(ctx, e.to) === "side") && ctx.nodeById.has(e.to));
  const portPt = new Map<string, Pt>();
  if (post === "F" || post === "G") {
    const slots = new Map<string, { key: string; along: number }[]>();
    for (const { e, k } of postEdges) {
      const [s, t] = [shape(e.from), shape(e.to)];
      const horizontal = (side: Side) => side === "NORTH" || side === "SOUTH";
      const add = (id: string, side: Side, key: string, other: Rect) => {
        const list = slots.get(`${id}:${side}`) ?? [];
        list.push({ key, along: horizontal(side) ? other.x + other.w / 2 : other.y + other.h / 2 });
        slots.set(`${id}:${side}`, list);
      };
      add(e.from, rs[k].from, `${k}.s`, t);
      add(e.to, rs[k].to, `${k}.t`, s);
    }
    for (const [key, list] of slots) {
      const [id, side] = key.split(":") as [string, Side];
      const r = shape(id);
      list.sort((a, b) => a.along - b.along);
      list.forEach((slot, i) => {
        const f = (i + 1) / (list.length + 1);
        // 案 G の上段のノードの下辺は、呼び出す側の中心の真上に点を置く（まっすぐ引けるように）
        const alongX = post === "G" && side === "SOUTH" && regionOfId(ctx, id) === "top" ? Math.min(Math.max(slot.along, r.x + 8), r.x + r.w - 8) : r.x + r.w * f;
        const pt: Pt =
          side === "NORTH" ? [r2(alongX), r.y]
          : side === "SOUTH" ? [r2(alongX), r.y + r.h]
          : side === "EAST" ? [r.x + r.w, r2(r.y + r.h * f)]
          : [r.x, r2(r.y + r.h * f)];
        portPt.set(slot.key, pt);
      });
    }
  }

  const elkEdges = new Map<string, ElkNode>((laid.edges ?? []).map((e: ElkNode) => [e.id, e]));
  ctx.model.edges.forEach((e, k) => {
    const ee = elkEdges.get(`e${k}`);
    let points: Pt[];
    let routed = false;
    if (ee) {
      const s = ee.sections[0];
      points = [s.startPoint, ...(s.bendPoints ?? []), s.endPoint].map((q: any) => [r2(q.x), r2(q.y)]);
      if (rs[k].style === "reverse") points.reverse();
    } else if (post === "F" || post === "G") {
      const a = portPt.get(`${k}.s`)!;
      const b = portPt.get(`${k}.t`)!;
      const found = route(placed, a, rs[k].from, b, rs[k].to, [e.from, e.to]);
      points = found ?? [a, b];
      routed = !!found;
    } else if (rs[k].style === "external") {
      const c = placed.nodes[e.from];
      const t = placed.nodes[e.to];
      const x = r2(c.x + c.w / 2);
      points = [[x, c.y], [x, t.y + t.h]];
    } else {
      const g = shape(e.from);
      const t = placed.nodes[e.to];
      const ty = r2(t.y + t.h / 2);
      const sy = Math.min(Math.max(ty, g.y + 8), g.y + g.h - 8);
      const mx = r2((g.x + g.w + t.x) / 2);
      points = sy === ty ? [[g.x + g.w, ty], [t.x, ty]] : [[g.x + g.w, sy], [mx, sy], [mx, ty], [t.x, ty]];
    }
    let l = ee?.labels?.[0];
    if (!ee && e.label) {
      // 後付けの線のラベルは、最も長い線分の中点の右に置く
      let [a, b] = [points[0], points[1]];
      for (let i = 1; i < points.length; i++) {
        const len = Math.abs(points[i][0] - points[i - 1][0]) + Math.abs(points[i][1] - points[i - 1][1]);
        if (len > Math.abs(b[0] - a[0]) + Math.abs(b[1] - a[1])) [a, b] = [points[i - 1], points[i]];
      }
      const box = labelBox(e.label);
      l = { text: e.label, x: (a[0] + b[0]) / 2 + 6, y: (a[1] + b[1]) / 2 - box.h / 2, width: box.w, height: box.h };
    }
    placed.edges.push({
      from: e.from,
      to: e.to,
      rule: rs[k],
      points,
      ...(post === "F" || post === "G" ? { routed: ee ? undefined : routed } : {}),
      ...(l ? { label: { text: l.text, x: r2(l.x), y: r2(l.y), w: r2(l.width), h: r2(l.height) } } : {}),
    });
  });
  return normalize(placed);

  function membersOf(g: ModelGroup): string[] {
    return [...g.members, ...(g.groups ?? []).flatMap(membersOf)];
  }
}

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

// --- リンター ---------------------------------------------------------------
// grammar.md の規則1〜7。検証 0001 からの違いは次のとおり。
// - 規則6の範囲を grammar.md に合わせ、通過する本流と下段のノードだけを見る（検証 0001 は上段以外すべてを見ていた）。
//   oldRule6 を true にすると、検証 0001 と同じ範囲で数える。
// - 規則5を3通りに数える。5a は grammar.md のとおり線ごとに同じ列か。5b は上段のノードの中心が、呼び出す側の中心の範囲にあるか。
//   5c は線ごとに、呼び出す側の中心が上段のノードの幅の中にあるか（真上へまっすぐ引けるか）。
// - 文法の規則ではないが、線が両端以外のノードを貫く件数（8）を数える。検証 0001 のリンターは、これを数えていなかった。
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const onSide = (q: Pt, r: Rect, side: string, eps = 0.5) =>
  side === "WEST" ? Math.abs(q[0] - r.x) < eps
  : side === "EAST" ? Math.abs(q[0] - (r.x + r.w)) < eps
  : side === "NORTH" ? Math.abs(q[1] - r.y) < eps
  : Math.abs(q[1] - (r.y + r.h)) < eps;
const cx = (r: Rect) => r.x + r.w / 2;

function borderCrossings(a: Pt, b: Pt, r: Rect): number {
  const inside = (q: Pt) => q[0] > r.x && q[0] < r.x + r.w && q[1] > r.y && q[1] < r.y + r.h;
  if (inside(a) !== inside(b)) return 1;
  if (inside(a)) return 0;
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  if (y1 === y2) return y1 > r.y && y1 < r.y + r.h && x1 < r.x && x2 > r.x + r.w ? 2 : 0;
  return x1 > r.x && x1 < r.x + r.w && y1 < r.y && y2 > r.y + r.h ? 2 : 0;
}

// 軸に平行な線分が、矩形の内側を通るか
function passesThrough(a: Pt, b: Pt, r: Rect): boolean {
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return x1 < r.x + r.w && x2 > r.x && y1 < r.y + r.h && y2 > r.y;
}

const RULES = ["1", "2", "3", "4", "5a", "5b", "5c", "6", "7", "8"] as const;
type Lint = Record<(typeof RULES)[number], string[]>;

function lint(p: Placed, oldRule6 = false): Lint {
  const v = Object.fromEntries(RULES.map((r) => [r, [] as string[]])) as Lint;
  const nodes = Object.entries(p.nodes);
  const labels = p.edges.flatMap((e) => (e.label ? [e.label] : []));
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++)
      if (overlap(nodes[i][1], nodes[j][1])) v["1"].push(`${nodes[i][0]}×${nodes[j][0]}`);
  for (const l of labels) for (const [id, n] of nodes) if (overlap(l, n)) v["1"].push(`「${l.text}」×${id}`);

  const shape = (id: string): Rect => p.nodes[id] ?? p.groups[id];
  for (const e of p.edges) {
    const name = `${e.from}→${e.to}`;
    if (!onSide(e.points[0], shape(e.from), e.rule.from)) v["2"].push(`${name} が ${e.rule.from} から出ていない`);
    if (!onSide(e.points.at(-1)!, shape(e.to), e.rule.to)) v["2"].push(`${name} が ${e.rule.to} に入っていない`);
    if (e.rule.style === "sync" && cx(shape(e.from)) >= cx(shape(e.to))) v["4"].push(name);
    if (e.rule.style === "external") {
      if (Math.abs(cx(shape(e.from)) - cx(shape(e.to))) > 1) v["5a"].push(name);
      const t = shape(e.to);
      if (cx(shape(e.from)) < t.x || cx(shape(e.from)) > t.x + t.w) v["5c"].push(name);
    }
    if (e.rule.style === "reverse") {
      const low = Math.max(...e.points.map((q) => q[1]));
      const span = [Math.min(...e.points.map((q) => q[0])), Math.max(...e.points.map((q) => q[0]))];
      for (const [id, n] of nodes) {
        const inScope = oldRule6 ? n.region !== "top" : n.region === "main" || n.region === "bottom";
        if (inScope && n.x < span[1] && n.x + n.w > span[0] && n.y + n.h > low) v["6"].push(`${name} が ${id} より上を通る`);
      }
    }
    for (const [gid, g] of Object.entries(p.groups)) {
      if (gid === e.from || gid === e.to) continue;
      const inside = (id: string) => g.members.includes(id) || (p.groups[id]?.members.every((m) => g.members.includes(m)) ?? false);
      const expected = inside(e.from) === inside(e.to) ? 0 : 1;
      let n = 0;
      for (let i = 1; i < e.points.length; i++) n += borderCrossings(e.points[i - 1], e.points[i], g);
      if (n !== expected) v["7"].push(`${name} が ${gid} の枠を ${n} 回横切る（期待 ${expected}）`);
    }
    for (const [id, n] of nodes) {
      if (id === e.from || id === e.to) continue;
      for (let i = 1; i < e.points.length; i++)
        if (passesThrough(e.points[i - 1], e.points[i], n)) {
          v["8"].push(`${name} が ${id} を貫く`);
          break;
        }
    }
  }
  // 5b：上段のノードごとに、中心が呼び出す側の中心の範囲にあるか
  for (const [id, n] of nodes.filter(([, n]) => n.region === "top")) {
    const callers = p.edges.filter((e) => e.to === id && e.rule.style === "external").map((e) => cx(shape(e.from)));
    if (callers.length && (cx(n) < Math.min(...callers) - 1 || cx(n) > Math.max(...callers) + 1)) v["5b"].push(id);
  }

  const byRegion = (r: Region) => nodes.filter(([, n]) => n.region === r).map(([, n]) => n);
  const [top, main, bottom, side] = (["top", "main", "bottom", "side"] as Region[]).map(byRegion);
  if (top.length && Math.max(...top.map((n) => n.y + n.h)) > Math.min(...main.map((n) => n.y))) v["3"].push("上段が本流より上にない");
  if (bottom.length && Math.min(...bottom.map((n) => n.y)) < Math.max(...main.map((n) => n.y + n.h))) v["3"].push("下段が本流より下にない");
  const rightOfRest = Math.max(...[...top, ...main, ...bottom, ...Object.values(p.groups)].map((n) => n.x + n.w));
  if (side.length && Math.min(...side.map((n) => n.x)) < rightOfRest) v["3"].push("端の列がほかより右にない");
  return v;
}

// --- 描画（検証 0001 と同じ） -----------------------------------------------
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
async function run(model: Model, grammar: Grammar, v: Variant) {
  const ctx = context(model, grammar);
  const laid = await new ELK().layout(buildElk(ctx, v) as any);
  const placed = flatten(ctx, v, laid);
  return { placed, json: JSON.stringify(placed, null, 1) + "\n" };
}

const summary = (l: Lint) => {
  const by = RULES.filter((r) => l[r].length).map((r) => `${r}:${l[r].length}`);
  return by.length ? by.join(" ") : "なし";
};
const grammarViolations = (l: Lint, rule5: "5a" | "5b" | "5c") =>
  (["1", "2", "3", "4", rule5, "6", "7"] as const).reduce((s, r) => s + l[r].length, 0);

mkdirSync(OUT, { recursive: true });

// 1. 検証 0001 のリンターの訂正：題材1を案 A〜E で配置し、規則6を検証 0001 の範囲と grammar.md の範囲で数える
console.log("## 検証 0001 の規則6の訂正（題材1）\n");
console.log("| 案 | 規則6（検証 0001 の範囲） | 規則6（grammar.md の範囲） | 規則1〜7の違反（grammar.md の範囲、規則5は5a） |");
console.log("| --- | --- | --- | --- |");
for (const v of ["A", "B", "C", "D", "E"] as Variant[]) {
  const { placed } = await run(sample, archGrammar, v);
  const [oldL, newL] = [lint(placed, true), lint(placed)];
  console.log(`| ${v} | ${oldL["6"].length} | ${newL["6"].length} | ${grammarViolations(newL, "5a")} |`);
}

// 2. 後から置く規則の、題材による違い
const subjects: { id: string; model: Model; grammar: Grammar; note: string }[] = [
  { id: "sample", model: sample, grammar: archGrammar, note: "題材1：サンプル構成図" },
  { id: "shared", model: shared, grammar: archGrammar, note: "題材2：上段を2つが共有" },
  { id: "process", model: processModel, grammar: processGrammar, note: "題材3：作業プロセス" },
];
console.log("\n## 後から置く規則（案 E〜G）\n");
console.log("| 題材 | 案 | 違反と件数（規則番号:件数） | 経路探索の失敗 | 2回実行 |");
console.log("| --- | --- | --- | --- | --- |");
for (const s of subjects)
  for (const v of ["E", "F", "G"] as Variant[]) {
    const a = await run(s.model, s.grammar, v);
    const b = await run(s.model, s.grammar, v);
    const l = lint(a.placed);
    const name = `${s.id}-${v}`;
    writeFileSync(join(OUT, `${name}.json`), a.json);
    writeFileSync(join(OUT, `${name}.svg`), svg(a.placed, `${s.note}／案${v}：${variants[v].note}`));
    writeFileSync(join(OUT, `${name}.lint.json`), JSON.stringify(l, null, 1) + "\n");
    const failed = a.placed.edges.filter((e) => e.routed === false).length;
    console.log(`| ${s.note} | ${v} | ${summary(l)} | ${v === "E" ? "—" : failed} | ${a.json === b.json ? "同じ" : "違う"} |`);
  }
