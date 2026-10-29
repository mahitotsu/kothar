// 格子の図（構成図、レイヤー構成、コンテキスト図、フローチャート）。節点に row と col を書くと、配置と矢印の経路が自動で決まる。
// 同じ入力なら同じ出力。矢印は直交で、節点を避ける経路を探す。見つからないときは、row と col を見直す。
import { actor, arrow, box, diamond, frame, group, legend, lineLabel, r1, store, terminator, text, textWidth, type BoxClass } from "./svg-parts.ts";
import { need } from "./charts-more.ts";

export type Shape = "box" | "terminator" | "decision" | "actor" | "store";
export interface GridNode {
  id: string;
  row: number;
  col: number;
  /** 横に何列ぶん広げるか（レイヤー構成の帯に使う）。 */
  colSpan?: number;
  lines: string[];
  shape?: Shape;
  cls?: BoxClass;
  /** 比較（compare）で、追加・削除の印を付ける。 */
  diff?: "add" | "remove";
}
export interface GridEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
  /** 点線。破線と形・太さ・濃さで区別する。dashed と同時には使えない。 */
  dotted?: boolean;
  diff?: "add" | "remove";
}
export interface GridGroup {
  label: string;
  nodes: string[];
}
export interface GridParts {
  nodes: GridNode[];
  edges?: GridEdge[];
  groups?: GridGroup[];
}
export interface GridSpec extends GridParts {
  kind: "grid";
  title: string;
  desc: string;
  legend?: { cls: BoxClass; name: string }[];
  note?: string;
  /** 交差を承知で残すときだけ true にする。警告が出なくなる。 */
  allowCrossings?: boolean;
}

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
  cx: number;
  cy: number;
}

const sizeOf = (n: GridNode): { w: number; h: number } => {
  const shape = n.shape ?? "box";
  const lw = Math.max(...n.lines.map((l, i) => textWidth(l, i === 0 ? 12 : 11, i === 0 ? 600 : 400)));
  const lh = n.lines.length;
  if (shape === "decision") return { w: Math.max(132, Math.ceil(lw * 1.7 + 24)), h: Math.max(68, lh * 15 + 36) };
  if (shape === "store") return { w: Math.max(112, Math.ceil(lw + 32)), h: Math.max(56, lh * 16 + 28) };
  if (shape === "actor") return { w: Math.max(124, Math.ceil(lw + 28 + 18)), h: Math.max(48, lh * 16 + 22) };
  if (shape === "terminator") return { w: Math.max(104, Math.ceil(lw + 40)), h: Math.max(40, lh * 16 + 20) };
  return { w: Math.max(112, Math.ceil(lw + 28)), h: Math.max(44, lh * 16 + 20) };
};

/** 格子の図の中身（SVG の断片）と、大きさを返す。比較（compare）からも使う。 */
export function layoutGrid(p: GridParts, allowCrossings = false): { body: string; w: number; h: number; warnings: string[] } {
  need(p.nodes.length >= 1, "grid: nodes が空");
  const byId = new Map<string, GridNode>();
  for (const n of p.nodes) {
    need(!byId.has(n.id), `grid: 節点の id「${n.id}」が重複`);
    need(Number.isInteger(n.row) && Number.isInteger(n.col) && n.row >= 0 && n.col >= 0, `grid: 節点「${n.id}」の row と col は 0 以上の整数`);
    byId.set(n.id, n);
  }
  for (const e of p.edges ?? []) {
    need(byId.has(e.from) && byId.has(e.to), `grid: 矢印の端「${e.from}」→「${e.to}」が nodes にない`);
    need(!(e.dashed && e.dotted), `grid: 矢印「${e.from}」→「${e.to}」に dashed と dotted の両方がある`);
  }
  for (const g of p.groups ?? []) for (const id of g.nodes) need(byId.has(id), `grid: 枠「${g.label}」の節点「${id}」が nodes にない`);
  const cell = new Set<string>();
  for (const n of p.nodes) for (let c = n.col; c < n.col + (n.colSpan ?? 1); c++) {
    need(!cell.has(`${n.row},${c}`), `grid: 節点「${n.id}」が、ほかの節点と同じセル（row ${n.row}、col ${c}）にある`);
    cell.add(`${n.row},${c}`);
  }
  const ncol = Math.max(...p.nodes.map((n) => n.col + (n.colSpan ?? 1)));
  const nrow = Math.max(...p.nodes.map((n) => n.row)) + 1;
  const hasLabel = (p.edges ?? []).some((e) => e.label);
  const colGap = hasLabel ? 76 : 56;
  const rowGap = (p.groups?.length ? 52 : 44) + (hasLabel ? 6 : 0);
  const colW = Array<number>(ncol).fill(0);
  const rowH = Array<number>(nrow).fill(0);
  for (const n of p.nodes) {
    const s = sizeOf(n);
    rowH[n.row] = Math.max(rowH[n.row], s.h);
    if ((n.colSpan ?? 1) === 1) colW[n.col] = Math.max(colW[n.col], s.w);
  }
  for (let c = 0; c < ncol; c++) if (colW[c] === 0) colW[c] = 112;
  for (const n of p.nodes) {
    const span = n.colSpan ?? 1;
    if (span === 1) continue;
    const have = colW.slice(n.col, n.col + span).reduce((a, b) => a + b, 0) + colGap * (span - 1);
    const need_ = sizeOf(n).w;
    if (need_ > have) colW[n.col + span - 1] += need_ - have;
  }
  const colX: number[] = [];
  let ax = 0;
  for (let c = 0; c < ncol; c++) {
    colX.push(ax);
    ax += colW[c] + colGap;
  }
  const rowY: number[] = [];
  let ay = 0;
  for (let r = 0; r < nrow; r++) {
    rowY.push(ay);
    ay += rowH[r] + rowGap;
  }
  const rects = new Map<string, Rect>();
  for (const n of p.nodes) {
    const s = sizeOf(n);
    const span = n.colSpan ?? 1;
    const w = span === 1 ? s.w : colX[n.col + span - 1] + colW[n.col + span - 1] - colX[n.col];
    const x = span === 1 ? colX[n.col] + (colW[n.col] - w) / 2 : colX[n.col];
    const y = rowY[n.row] + (rowH[n.row] - s.h) / 2;
    rects.set(n.id, { x, y, w, h: s.h, cx: x + w / 2, cy: y + s.h / 2 });
  }
  // 枠
  const PAD = 14, HEAD = 24;
  const boxes = (p.groups ?? []).map((g) => {
    const rs = g.nodes.map((id) => rects.get(id) as Rect);
    const x = Math.min(...rs.map((r) => r.x)) - PAD, y = Math.min(...rs.map((r) => r.y)) - HEAD;
    const x2 = Math.max(...rs.map((r) => r.x + r.w)) + PAD, y2 = Math.max(...rs.map((r) => r.y + r.h)) + PAD;
    for (const n of p.nodes) {
      if (g.nodes.includes(n.id)) continue;
      const r = rects.get(n.id) as Rect;
      need(!(r.x < x2 && r.x + r.w > x && r.y < y2 && r.y + r.h > y), `grid: 枠「${g.label}」が、メンバーでない節点「${n.id}」を含む。row と col を見直す`);
    }
    return { g, x, y, w: x2 - x, h: y2 - y };
  });
  const lw = (p.groups ?? []).map((g) => textWidth(g.label, 11, 600));
  boxes.forEach((b, i) => need(b.w >= lw[i] + 24, `grid: 枠「${b.g.label}」の幅が、ラベルに足りない。節点を足すか、ラベルを短くする`));
  const minX = Math.min(...[...rects.values()].map((r) => r.x), ...boxes.map((b) => b.x));
  const minY = Math.min(...[...rects.values()].map((r) => r.y), ...boxes.map((b) => b.y));
  const maxX = Math.max(...[...rects.values()].map((r) => r.x + r.w), ...boxes.map((b) => b.x + b.w));
  const maxY = Math.max(...[...rects.values()].map((r) => r.y + r.h), ...boxes.map((b) => b.y + b.h));
  const dx = -minX, dy = -minY;
  const shift = (r: Rect): Rect => ({ x: r.x + dx, y: r.y + dy, w: r.w, h: r.h, cx: r.cx + dx, cy: r.cy + dy });
  const R = new Map([...rects].map(([k, v]) => [k, shift(v)]));
  // 経路
  const lanesX = colX.map((x, c) => ({ left: x + dx - colGap / 2, right: x + colW[c] + dx + colGap / 2 }));
  const lanesY = rowY.map((y, r) => ({ top: y + dy - rowGap / 2, bottom: y + rowH[r] + dy + rowGap / 2 }));
  /** 経路が横切る節点の id（端の 2 つを除く）。 */
  const hitIds = (pts: number[], skip: string[]): string[] => {
    const out = new Set<string>();
    for (let i = 0; i + 3 < pts.length; i += 2) {
      const [x1, y1, x2, y2] = [pts[i], pts[i + 1], pts[i + 2], pts[i + 3]];
      const [ax, bx, ay2, by] = [Math.min(x1, x2), Math.max(x1, x2), Math.min(y1, y2), Math.max(y1, y2)];
      for (const [id, r] of R) {
        if (skip.includes(id)) continue;
        if (bx > r.x - 4 && ax < r.x + r.w + 4 && by > r.y - 4 && ay2 < r.y + r.h + 4) out.add(id);
      }
    }
    return [...out];
  };
  const hits = (pts: number[], skip: string[]): boolean => hitIds(pts, skip).length > 0;
  const route = (a: Rect, b: Rect, ida: string, idb: string): number[] => {
    const right = b.cx > a.cx, down = b.cy > a.cy;
    const ap = { r: [a.x + a.w, a.cy], l: [a.x, a.cy], b: [a.cx, a.y + a.h], t: [a.cx, a.y] };
    const bp = { r: [b.x + b.w, b.cy], l: [b.x, b.cy], b: [b.cx, b.y + b.h], t: [b.cx, b.y] };
    const aH = right ? ap.r : ap.l, bH = right ? bp.l : bp.r;
    const aV = down ? ap.b : ap.t, bV = down ? bp.t : bp.b;
    const cands: number[][] = [];
    // 一方が幅の広い節点（帯）のとき: もう一方の中心から、まっすぐ縦に結ぶ
    if (Math.abs(a.cy - b.cy) >= 1) {
      if (a.cx > b.x + 8 && a.cx < b.x + b.w - 8) cands.push([a.cx, down ? a.y + a.h : a.y, a.cx, down ? b.y : b.y + b.h]);
      if (b.cx > a.x + 8 && b.cx < a.x + a.w - 8) cands.push([b.cx, down ? a.y + a.h : a.y, b.cx, down ? b.y : b.y + b.h]);
    }
    if (Math.abs(a.cy - b.cy) < 1) cands.push([...aH, ...bH]);
    if (Math.abs(a.cx - b.cx) < 1) cands.push([...aV, ...bV]);
    if (Math.abs(a.cy - b.cy) >= 1 && Math.abs(a.cx - b.cx) >= 1) {
      cands.push([...aV, aV[0], b.cy, ...bH]); // 縦に出て、横に入る
      cands.push([...aH, b.cx, aH[1], ...bV]); // 横に出て、縦に入る
      for (const lx of [(aH[0] + bH[0]) / 2, ...lanesX.map((l) => (right ? l.right : l.left))]) cands.push([...aH, lx, aH[1], lx, bH[1], ...bH]);
      for (const ly of [(aV[1] + bV[1]) / 2, ...lanesY.map((l) => (down ? l.bottom : l.top))]) cands.push([...aV, aV[0], ly, bV[0], ly, ...bV]);
    } else if (Math.abs(a.cy - b.cy) < 1) {
      // 同じ行で、間に節点がある: 上か下の通路を回る
      const lane = lanesY.find((l) => l.top < a.cy && a.cy < l.bottom);
      if (lane) {
        cands.push([a.cx, a.y, a.cx, lane.top, b.cx, lane.top, b.cx, b.y]);
        cands.push([a.cx, a.y + a.h, a.cx, lane.bottom, b.cx, lane.bottom, b.cx, b.y + b.h]);
      }
    } else {
      // 同じ列で、間に節点がある: 右か左の通路を回る
      const lane = lanesX.find((l) => l.left < a.cx && a.cx < l.right);
      if (lane) {
        cands.push([a.x + a.w, a.cy, lane.right, a.cy, lane.right, b.cy, b.x + b.w, b.cy]);
        cands.push([a.x, a.cy, lane.left, a.cy, lane.left, b.cy, b.x, b.cy]);
      }
    }
    return cands.find((c) => !hits(c, [ida, idb])) ?? cands[0];
  };
  const ordered = (p.edges ?? []).map((e) => ({ e, pts: route(R.get(e.from) as Rect, R.get(e.to) as Rect, e.from, e.to) }));
  const tidy = (pts: number[]) => {
    const out: number[] = [];
    for (let i = 0; i < pts.length; i += 2) {
      const n = out.length;
      if (n >= 2 && out[n - 2] === pts[i] && out[n - 1] === pts[i + 1]) continue;
      out.push(r1(pts[i]), r1(pts[i + 1]));
    }
    return out;
  };
  // 検出: 節点を横切る矢印と、矢印どうしの交差
  const warnings: string[] = [];
  const paths = ordered.map(({ e, pts }) => ({ e, t: tidy(pts) }));
  const nm = (e: GridEdge) => `${e.from}→${e.to}`;
  for (const { e, t } of paths) {
    const ids = hitIds(t, [e.from, e.to]);
    if (ids.length) warnings.push(`grid: 矢印「${nm(e)}」が、節点「${ids.join("」「")}」を横切る。row と col を見直し、間に節点がない配置にする`);
  }
  const segsOf = (t: number[]) => {
    const out: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i + 3 < t.length; i += 2) out.push({ x1: t[i], y1: t[i + 1], x2: t[i + 2], y2: t[i + 3] });
    return out;
  };
  const inside = (v: number, a: number, b: number) => v > Math.min(a, b) + 0.5 && v < Math.max(a, b) - 0.5;
  if (!allowCrossings)
    for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) {
      const [a, b] = [paths[i], paths[j]];
      if (a.e.from === b.e.from || a.e.to === b.e.to || a.e.from === b.e.to || a.e.to === b.e.from) continue;
      let crossed = false;
      for (const s1 of segsOf(a.t)) for (const s2 of segsOf(b.t)) {
        const h1 = s1.y1 === s1.y2, h2 = s2.y1 === s2.y2;
        if (h1 === h2) {
          // 同じ通路を共有して、重なる（X 字に見える）
          const [lo1, hi1, lo2, hi2] = h1 ? [Math.min(s1.x1, s1.x2), Math.max(s1.x1, s1.x2), Math.min(s2.x1, s2.x2), Math.max(s2.x1, s2.x2)] : [Math.min(s1.y1, s1.y2), Math.max(s1.y1, s1.y2), Math.min(s2.y1, s2.y2), Math.max(s2.y1, s2.y2)];
          const same = h1 ? Math.abs(s1.y1 - s2.y1) < 0.5 : Math.abs(s1.x1 - s2.x1) < 0.5;
          if (same && Math.min(hi1, hi2) - Math.max(lo1, lo2) > 2) crossed = true;
          continue;
        }
        const [hs, vs] = h1 ? [s1, s2] : [s2, s1];
        if (inside(vs.x1, hs.x1, hs.x2) && inside(hs.y1, vs.y1, vs.y2)) crossed = true;
      }
      if (crossed) warnings.push(`grid: 矢印「${nm(a.e)}」と「${nm(b.e)}」が交差する（または同じ通路で重なる）。節点の row と col を入れ替えるか、figure.ts --arrange で自動調整する`);
    }
  let body = "";
  for (const b of boxes) body += group(r1(b.x + dx), r1(b.y + dy), r1(b.w), r1(b.h), b.g.label);
  for (const { e, pts } of ordered) {
    const t = tidy(pts);
    body += e.diff === "add" ? arrow(t, false, "ladd", "hadd") : e.diff === "remove" ? arrow(t, true, "lrem", "hrem") : arrow(t, e.dashed, e.dotted ? "dot" : "");
  }
  for (const n of p.nodes) {
    const r = R.get(n.id) as Rect;
    const cls: BoxClass = n.diff === "add" ? "kadd" : n.diff === "remove" ? "krem" : (n.cls ?? "box");
    const shape = n.shape ?? "box";
    body += shape === "decision" ? diamond(r.cx, r.cy, r.w, r.h, n.lines, cls) : shape === "terminator" ? terminator(r.x, r.y, r.w, r.h, n.lines, cls) : shape === "store" ? store(r.x, r.y, r.w, r.h, n.lines, cls) : shape === "actor" ? actor(r.x, r.y, r.w, r.h, n.lines, cls) : box(r.x, r.y, r.w, r.h, n.lines, cls);
    if (n.diff) body += badge(r.x + r.w - 2, r.y + 2, n.diff);
  }
  for (const { e, pts } of ordered) {
    if (!e.label) continue;
    const t = tidy(pts);
    const need_ = textWidth(e.label, 11) + 14;
    const segs = [];
    for (let i = 0; i + 3 < t.length; i += 2) segs.push({ x1: t[i], y1: t[i + 1], x2: t[i + 2], y2: t[i + 3], len: Math.abs(t[i + 2] - t[i]) + Math.abs(t[i + 3] - t[i + 1]) });
    const seg = segs[0].len >= need_ + 8 ? segs[0] : [...segs].sort((a, b) => b.len - a.len)[0];
    body += lineLabel((seg.x1 + seg.x2) / 2, (seg.y1 + seg.y2) / 2, e.label);
  }
  return { body, w: r1(maxX + dx), h: r1(maxY + dy), warnings };
}

/** 追加（＋）・削除（−）の印。円の中に、記号を線で描く。色だけに頼らない。 */
export function badge(x: number, y: number, kind: "add" | "remove"): string {
  const cls = kind === "add" ? "hadd" : "hrem";
  const bar = `<polyline class="glyph" points="${r1(x - 4)},${r1(y)} ${r1(x + 4)},${r1(y)}"/>`;
  const stem = kind === "add" ? `<polyline class="glyph" points="${r1(x)},${r1(y - 4)} ${r1(x)},${r1(y + 4)}"/>` : "";
  return `<circle class="${cls} ring" cx="${r1(x)}" cy="${r1(y)}" r="9"/>${bar}${stem}`;
}

export function grid(c: GridSpec): string {
  const m = 20;
  const { body, w, h } = layoutGrid(c, c.allowCrossings);
  const W2 = Math.max(720, Math.ceil(w + m * 2));
  need(W2 <= 960, `grid: 図が広すぎる（${W2}px）。列を減らす`);
  let out = `<g transform="translate(${r1((W2 - w) / 2)},${m})">${body}</g>`;
  let H = h + m * 2;
  if (c.legend?.length) {
    out += legend(m, H - 6, c.legend.map((l) => ({ cls: l.cls, name: l.name })));
    H += 22;
  }
  if (c.note) {
    out += text(m, H, c.note, "ink2", 11, "start");
    H += 18;
  }
  return frame(c.title, c.desc, Math.ceil(H), out, W2);
}
