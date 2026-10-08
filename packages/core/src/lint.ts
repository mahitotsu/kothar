// リンター（S-LINT-1）。配置の結果を、文法から導く規則と、文法によらない規則で検査する。
// 規則の番号は benchmarks/sample-arch/grammar.md の「期待する不変条件」の番号とする。

import type { Compiled } from "./compile.ts";
import type { Layout, Point, Rect } from "./types.ts";

export type Violation = {
  rule: number;
  /** 対象のノード、グループ、線の ID。線は「出る ID→入る ID」で表す */
  targets: string[];
  /** 対象のノードのどれかがピン留めされているか */
  pinned: boolean;
  message: string;
};

export const RULES: Record<number, string> = {
  1: "ノードとラベルの重なり",
  2: "線の出入りの辺",
  3: "領域",
  4: "流れの向き",
  5: "上段の位置",
  6: "外周を回る線",
  7: "グループの枠の横切り",
  8: "ノードを通る線",
  9: "線の重なり",
  10: "列",
};

/** 平行に走る2本の線の間隔がこれ未満なら、重なっているとみなす（検証 0003） */
const CLEAR = 8;
const EPS = 0.5;

const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const cx = (r: Rect) => r.x + r.w / 2;
const segs = (pts: Point[]) => pts.slice(1).map((q, i) => [pts[i], q] as [Point, Point]);
const frame = (g: Rect): Point[] => [[g.x, g.y], [g.x + g.w, g.y], [g.x + g.w, g.y + g.h], [g.x, g.y + g.h], [g.x, g.y]];

function onSide(p: Point, r: Rect, side: string): boolean {
  const within = (v: number, lo: number, hi: number) => v >= lo - EPS && v <= hi + EPS;
  if (side === "west") return Math.abs(p[0] - r.x) < EPS && within(p[1], r.y, r.y + r.h);
  if (side === "east") return Math.abs(p[0] - (r.x + r.w)) < EPS && within(p[1], r.y, r.y + r.h);
  if (side === "north") return Math.abs(p[1] - r.y) < EPS && within(p[0], r.x, r.x + r.w);
  return Math.abs(p[1] - (r.y + r.h)) < EPS && within(p[0], r.x, r.x + r.w);
}

// 軸に平行な線分が、矩形の枠を横切る回数
function borderCrossings(a: Point, b: Point, r: Rect): number {
  const inside = (q: Point) => q[0] > r.x && q[0] < r.x + r.w && q[1] > r.y && q[1] < r.y + r.h;
  if (inside(a) !== inside(b)) return 1;
  if (inside(a)) return 0;
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  if (y1 === y2) return y1 > r.y && y1 < r.y + r.h && x1 < r.x && x2 > r.x + r.w ? 2 : 0;
  return x1 > r.x && x1 < r.x + r.w && y1 < r.y && y2 > r.y + r.h ? 2 : 0;
}

// 軸に平行な線分が、矩形の内側を通るか
function passesThrough(a: Point, b: Point, r: Rect): boolean {
  const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
  const [y1, y2] = [Math.min(a[1], b[1]), Math.max(a[1], b[1])];
  return x1 < r.x + r.w - EPS && x2 > r.x + EPS && y1 < r.y + r.h - EPS && y2 > r.y + EPS;
}

// 軸に平行な2つの線分が、CLEAR 未満の間隔で、長さ CLEAR を超えて並んで走るか（交差と端の接触は数えない）
function runsAlong(a: Point, b: Point, c: Point, d: Point): boolean {
  const horizontal = (p: Point, q: Point) => Math.abs(p[1] - q[1]) < EPS;
  const vertical = (p: Point, q: Point) => Math.abs(p[0] - q[0]) < EPS;
  const along = (k: 0 | 1) =>
    Math.min(Math.max(a[k], b[k]), Math.max(c[k], d[k])) - Math.max(Math.min(a[k], b[k]), Math.min(c[k], d[k]));
  if (horizontal(a, b) && horizontal(c, d) && Math.abs(a[1] - c[1]) < CLEAR) return along(0) > CLEAR;
  if (vertical(a, b) && vertical(c, d) && Math.abs(a[0] - c[0]) < CLEAR) return along(1) > CLEAR;
  return false;
}

export function lint(c: Compiled, l: Layout): Violation[] {
  const out: Violation[] = [];
  const node = new Map(l.nodes.map((n) => [n.id, n]));
  const shape = (id: string): Rect => node.get(id)?.rect ?? l.groups.find((g) => g.id === id)!.rect;
  const pinnedAny = (ids: string[]) => ids.some((id) => node.get(id)?.pinned ?? false);
  const add = (rule: number, targets: string[], message: string) => out.push({ rule, targets, pinned: pinnedAny(targets), message });
  const edgeName = (e: Layout["edges"][number]) => `${e.from}→${e.to}`;

  // 1：ノード同士、ノードとラベルが重ならない
  for (let i = 0; i < l.nodes.length; i++)
    for (let j = i + 1; j < l.nodes.length; j++)
      if (overlap(l.nodes[i].rect, l.nodes[j].rect))
        add(1, [l.nodes[i].id, l.nodes[j].id], `${l.nodes[i].id} と ${l.nodes[j].id} が重なっている`);
  for (const e of l.edges)
    if (e.label) for (const n of l.nodes) if (overlap(e.label.rect, n.rect)) add(1, [edgeName(e), n.id], `線 ${edgeName(e)} のラベル「${e.label.text}」が ${n.id} に重なっている`);

  for (const e of l.edges) {
    const name = edgeName(e);
    const [from, to] = [shape(e.from), shape(e.to)];
    // 2：決めた辺から出て、決めた辺に入る
    if (!onSide(e.points[0], from, e.rule.exit)) add(2, [name, e.from], `線 ${name} が ${e.from} の ${e.rule.exit} の辺から出ていない`);
    if (!onSide(e.points.at(-1)!, to, e.rule.enter)) add(2, [name, e.to], `線 ${name} が ${e.to} の ${e.rule.enter} の辺に入っていない`);
    // 4：流れに沿う線は、出るノードが入るノードより左にある
    if (e.rule.flow && cx(from) >= cx(to)) add(4, [name, e.from, e.to], `線 ${name} が流れの向き（左から右）に沿っていない`);
    // 5：上段のノードは、呼び出す側の真上にある
    if (node.get(e.to)?.region.place === "above-caller" && (cx(from) < to.x || cx(from) > to.x + to.w))
      add(5, [name, e.from, e.to], `${e.to} が、呼び出す側 ${e.from} の真上にない`);
    // 6：外周を回る線は、通過する本流と下段のノードより下を通る。横に走る線分ごとに、その真上か真下にあるノードを見る
    if (e.rule.route === "around") {
      const above = new Set<string>();
      for (const [a, b] of segs(e.points)) {
        if (Math.abs(a[1] - b[1]) >= EPS) continue;
        const [x1, x2] = [Math.min(a[0], b[0]), Math.max(a[0], b[0])];
        for (const n of l.nodes)
          if (["main", "below-main", "column"].includes(n.region.place) && n.rect.x < x2 && n.rect.x + n.rect.w > x1 && n.rect.y + n.rect.h > a[1])
            above.add(n.id);
      }
      for (const id of above) add(6, [name, id], `線 ${name} が ${id} より上を通っている`);
    }
    // 7：両端を含まないグループの枠を横切らない
    for (const g of l.groups) {
      if (g.id === e.from || g.id === e.to) continue;
      const inside = (id: string) => g.members.includes(id);
      const expected = inside(e.from) === inside(e.to) ? 0 : 1;
      let n = 0;
      for (const [a, b] of segs(e.points)) n += borderCrossings(a, b, g.rect);
      if (n !== expected) add(7, [name, g.id], `線 ${name} が ${g.id} の枠を ${n} 回横切っている（${expected} 回であるべき）`);
    }
    // 8：両端以外のノードを通らない
    for (const n of l.nodes) {
      if (n.id === e.from || n.id === e.to) continue;
      if (segs(e.points).some(([a, b]) => passesThrough(a, b, n.rect))) add(8, [name, n.id], `線 ${name} が ${n.id} を通っている`);
    }
  }

  // 9：ほかの線やグループの枠線と重ならない
  for (let i = 0; i < l.edges.length; i++) {
    const e = l.edges[i];
    for (let j = i + 1; j < l.edges.length; j++) {
      const f = l.edges[j];
      if (segs(e.points).some(([a, b]) => segs(f.points).some(([p, q]) => runsAlong(a, b, p, q))))
        add(9, [edgeName(e), edgeName(f)], `線 ${edgeName(e)} と線 ${edgeName(f)} が重なっている`);
    }
    for (const g of l.groups)
      if (segs(e.points).some(([a, b]) => segs(frame(g.rect)).some(([p, q]) => runsAlong(a, b, p, q))))
        add(9, [edgeName(e), g.id], `線 ${edgeName(e)} が ${g.id} の枠線に重なっている`);
  }

  // 3：ノードは、割り当てた領域の中にある
  const byPlace = (place: string) => l.nodes.filter((n) => n.region.place === place);
  const [main, top, bottom, side] = ["main", "above-caller", "below-main", "side-column"].map(byPlace);
  const mainTop = Math.min(...main.map((n) => n.rect.y));
  const mainBottom = Math.max(...main.map((n) => n.rect.y + n.rect.h));
  for (const n of top) if (main.length && n.rect.y + n.rect.h > mainTop) add(3, [n.id], `${n.id} は上段なのに、本流より上にない`);
  for (const n of bottom) if (main.length && n.rect.y < mainBottom) add(3, [n.id], `${n.id} は下段なのに、本流より下にない`);
  const rest = [...main, ...top, ...bottom].map((n) => n.rect).concat(l.groups.map((g) => g.rect));
  const rightOfRest = rest.length ? Math.max(...rest.map((r) => r.x + r.w)) : -Infinity;
  for (const n of side) if (n.rect.x < rightOfRest) add(3, [n.id], `${n.id} は端の列なのに、ほかのすべてより右にない`);

  // 10：ノードは割り当てた列にある。ある列のノードの中心は、それより左の列のどのノードの中心よりも右にある
  const cols = l.nodes.filter((n) => n.region.place === "column");
  for (const n of cols)
    for (const m of cols)
      if ((n.region.column ?? 0) < (m.region.column ?? 0) && cx(n.rect) >= cx(m.rect))
        add(10, [n.id, m.id], `${m.id}（列 ${m.region.column}）が、${n.id}（列 ${n.region.column}）より右にない`);

  return out.sort((a, b) => a.rule - b.rule);
}
