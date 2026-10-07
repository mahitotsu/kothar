// ELK の外で置いた線の、直交の経路探索（S-LAYOUT-1、検証 0003 の案 H）。
// 格子の上で、ノードを通らず、ノードのまわりの余白、折れ曲がり、グループの枠の横切り、
// すでにある線や枠線に沿って走ることの少ない経路を、ダイクストラ法で探す。

import type { Point, Rect, Side } from "./types.ts";

const STEP = 5;
const PAD = 10; // ノードのまわりの余白。通れるが、1歩ごとに MARGIN の費用がかかる
const MARGIN = 4;
const BEND = 12; // 折れ曲がり1回の費用（格子の歩数で数える）
const CROSS = 60; // グループの枠を1回横切る費用
const ALONG = 40; // すでにある線やグループの枠線に沿って1歩進む費用
const AROUND = 2; // 線の両側の何格子分を「沿って走る」とみなすか

const DIRS: Point[] = [[1, 0], [0, 1], [-1, 0], [0, -1]];
const OUTWARD: Record<Side, number> = { east: 0, south: 1, west: 2, north: 3 };

export type Obstacles = {
  nodes: Rect[];
  /** 横切ると費用がかかるグループの枠（両端を含むグループは除く） */
  groups: Rect[];
  /** 沿って走ると費用がかかる線（グループの枠線を含む） */
  lines: Point[][];
};

export function route(from: Point, fromSide: Side, to: Point, toSide: Side, obs: Obstacles): Point[] | undefined {
  const rects = [...obs.nodes, ...obs.groups];
  const xs = [...rects.flatMap((r) => [r.x, r.x + r.w]), from[0], to[0]];
  const ys = [...rects.flatMap((r) => [r.y, r.y + r.h]), from[1], to[1]];
  const x0 = Math.min(...xs) - 200;
  const y0 = Math.min(...ys) - 200;
  const W = Math.ceil((Math.max(...xs) + 200 - x0) / STEP);
  const H = Math.ceil((Math.max(...ys) + 200 - y0) / STEP);
  const at = (i: number, j: number) => j * W + i;

  // 1：余白、2：ノードの中
  const blocked = new Uint8Array(W * H);
  for (const n of obs.nodes)
    for (const [pad, mark] of [[PAD, 1], [1, 2]] as const) {
      const [a, b] = [Math.floor((n.x - pad - x0) / STEP), Math.ceil((n.x + n.w + pad - x0) / STEP)];
      const [c, d] = [Math.floor((n.y - pad - y0) / STEP), Math.ceil((n.y + n.h + pad - y0) / STEP)];
      for (let i = Math.max(0, a); i <= Math.min(W - 1, b); i++)
        for (let j = Math.max(0, c); j <= Math.min(H - 1, d); j++) blocked[at(i, j)] = Math.max(blocked[at(i, j)], mark);
    }

  // すでにある線の両側に、横向きと縦向きの印をつける
  const hMask = new Uint8Array(W * H);
  const vMask = new Uint8Array(W * H);
  for (const pts of obs.lines)
    for (let k = 1; k < pts.length; k++) {
      const [a, b] = [pts[k - 1], pts[k]];
      const horizontal = a[1] === b[1];
      const mask = horizontal ? hMask : vMask;
      const [i1, i2] = [Math.round((Math.min(a[0], b[0]) - x0) / STEP), Math.round((Math.max(a[0], b[0]) - x0) / STEP)];
      const [j1, j2] = [Math.round((Math.min(a[1], b[1]) - y0) / STEP), Math.round((Math.max(a[1], b[1]) - y0) / STEP)];
      const [di, dj] = horizontal ? [0, AROUND] : [AROUND, 0];
      for (let i = Math.max(0, i1 - di); i <= Math.min(W - 1, i2 + di); i++)
        for (let j = Math.max(0, j1 - dj); j <= Math.min(H - 1, j2 + dj); j++) mask[at(i, j)] = 1;
    }

  const inside = (r: Rect, i: number, j: number) => {
    const [x, y] = [x0 + i * STEP, y0 + j * STEP];
    return x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;
  };
  // 出る点と入る点から、辺の外へ2格子出た格子点
  const off = (q: Point, side: Side): [number, number] => {
    const [dx, dy] = DIRS[OUTWARD[side]];
    return [Math.round((q[0] + dx * 2 * STEP - x0) / STEP), Math.round((q[1] + dy * 2 * STEP - y0) / STEP)];
  };
  const [si, sj] = off(from, fromSide);
  const [ti, tj] = off(to, toSide);
  if (si < 0 || sj < 0 || ti < 0 || tj < 0 || si >= W || ti >= W || sj >= H || tj >= H) return undefined;
  const startDir = OUTWARD[fromSide];
  const endDir = (OUTWARD[toSide] + 2) % 4; // 入る辺に向かって進む向き
  blocked[at(si, sj)] = 0;
  blocked[at(ti, tj)] = 0;

  const N = W * H * 4;
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const heap = new Heap();
  const start = at(si, sj) * 4 + startDir;
  dist[start] = 0;
  heap.push(0, start);
  let goal = -1;
  while (heap.size) {
    const [c, s] = heap.pop();
    if (c > dist[s]) continue;
    const cell = s >> 2;
    const dir = s & 3;
    const [i, j] = [cell % W, Math.floor(cell / W)];
    if (i === ti && j === tj) {
      if (dir === endDir) {
        goal = s;
        break;
      }
      // 終点では、向きだけを変えられる（入る辺に向かうための最後の折れ曲がり）
      const ns = cell * 4 + endDir;
      if (c + BEND < dist[ns]) {
        dist[ns] = c + BEND;
        prev[ns] = s;
        heap.push(c + BEND, ns);
      }
    }
    for (let nd = 0; nd < 4; nd++) {
      if (nd === (dir + 2) % 4) continue;
      const [ni, nj] = [i + DIRS[nd][0], j + DIRS[nd][1]];
      if (ni < 0 || nj < 0 || ni >= W || nj >= H || blocked[at(ni, nj)] === 2) continue;
      let cost = c + 1 + (nd === dir ? 0 : BEND) + (blocked[at(ni, nj)] ? MARGIN : 0);
      if ((nd % 2 === 0 ? hMask : vMask)[at(ni, nj)]) cost += ALONG;
      for (const g of obs.groups) if (inside(g, i, j) !== inside(g, ni, nj)) cost += CROSS;
      const ns = at(ni, nj) * 4 + nd;
      if (cost < dist[ns]) {
        dist[ns] = cost;
        prev[ns] = s;
        heap.push(cost, ns);
      }
    }
  }
  if (goal < 0) return undefined;

  const cells: Point[] = [];
  for (let s = goal; s >= 0; s = prev[s]) {
    const cell = s >> 2;
    const pt: Point = [x0 + (cell % W) * STEP, y0 + Math.floor(cell / W) * STEP];
    const last = cells.at(-1);
    if (!last || last[0] !== pt[0] || last[1] !== pt[1]) cells.push(pt);
  }
  cells.reverse();
  // 辺の上の点を格子に合わせてずらし（5px 未満）、格子の点と辺に垂直な線分でつなぐ
  const vertical = (side: Side) => side === "north" || side === "south";
  const a: Point = vertical(fromSide) ? [cells[0][0], from[1]] : [from[0], cells[0][1]];
  const b: Point = vertical(toSide) ? [cells.at(-1)![0], to[1]] : [to[0], cells.at(-1)![1]];
  return simplify([a, ...cells, b]);
}

/** 重なる点と、一直線に並ぶ途中の点を除く */
export function simplify(pts: Point[]): Point[] {
  const out: Point[] = [];
  for (const q of pts) {
    const last = out.at(-1);
    if (last && last[0] === q[0] && last[1] === q[1]) continue;
    if (out.length >= 2) {
      const [a, b] = [out.at(-2)!, out.at(-1)!];
      if ((a[0] === b[0] && b[0] === q[0]) || (a[1] === b[1] && b[1] === q[1])) out.pop();
    }
    out.push(q);
  }
  return out;
}

// 費用の小さい順に取り出す二分ヒープ。費用が同じときは入れた順に取り出す（決定性のため）
class Heap {
  private items: [number, number, number][] = [];
  private seq = 0;
  get size() {
    return this.items.length;
  }
  private less(a: number, b: number) {
    const [x, y] = [this.items[a], this.items[b]];
    return x[0] < y[0] || (x[0] === y[0] && x[1] < y[1]);
  }
  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
  }
  push(cost: number, state: number) {
    this.items.push([cost, this.seq++, state]);
    for (let i = this.items.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (!this.less(i, p)) break;
      this.swap(i, p);
      i = p;
    }
  }
  pop(): [number, number] {
    const top = this.items[0];
    const last = this.items.pop()!;
    if (this.items.length) {
      this.items[0] = last;
      for (let i = 0; ; ) {
        const [l, r] = [2 * i + 1, 2 * i + 2];
        let m = i;
        if (l < this.items.length && this.less(l, m)) m = l;
        if (r < this.items.length && this.less(r, m)) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return [top[0], top[2]];
  }
}
