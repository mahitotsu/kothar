// グラフの部品（棒、積み上げ）。出力は SVG。同じ入力なら同じ出力。仕様（JSON）からの作り方は render-figure.ts。
// 配色の使い方: 系列には s1〜s5 を順に使う。系列の数は 3 つまで（凡例なしで区別できる限度）。傾向・差・例外を主張する図に使う。
import { W, frame, r1, text } from "./svg-parts.ts";

/** 下が四角で、データ側の端が 4px の丸い棒。 */
function column(x: number, base: number, h: number, w: number, cls: string): string {
  if (!(h > 0)) return "";
  const r = Math.min(4, h / 2, w / 2);
  const y = base - h;
  return `<path class="${cls}" d="M${r1(x)},${r1(base)} L${r1(x)},${r1(y + r)} A${r},${r} 0 0 1 ${r1(x + r)},${r1(y)} L${r1(x + w - r)},${r1(y)} A${r},${r} 0 0 1 ${r1(x + w)},${r1(y + r)} L${r1(x + w)},${r1(base)} Z"/>`;
}

export interface ColumnSeries {
  name: string;
  cls: "s1" | "s2" | "s3";
  /** 群ごとの値。その群に棒がない系列は null（残りの棒は中央に寄る）。 */
  values: (number | null)[];
}
export interface ColumnChart {
  title: string;
  desc: string;
  yLabel: string;
  /** 群のラベル。1 群あたり複数行にできる。 */
  groups: string[][];
  series: ColumnSeries[];
  yMax: number;
  ticks: number[];
  fmt: (n: number) => string;
  note?: string;
}

/** 群ごとの棒。群が分類、棒が系列。値は棒の先に書き、凡例はグラフの上に置く。 */
export function groupedColumns(c: ColumnChart): string {
  const H = 400;
  const left = 64, right = 24, top = 64, bottom = 78;
  const base = H - bottom;
  const slot = (W - left - right) / c.groups.length;
  const bw = 24, gap = 8;
  const y = (v: number) => base - (v / c.yMax) * (base - top);
  let body = "";
  for (const t of c.ticks) body += `<line class="grid" x1="${left}" x2="${W - right}" y1="${r1(y(t))}" y2="${r1(y(t))}"/>` + text(left - 8, y(t) + 4, c.fmt(t), "ink2", 11, "end");
  body += `<line class="axis" x1="${left}" x2="${W - right}" y1="${base}" y2="${base}"/>`;
  body += text(left, 22, c.yLabel, "ink2", 12, "start");
  let lx = left;
  for (const s of c.series) {
    body += `<rect class="${s.cls}" x="${lx}" y="34" width="10" height="10" rx="2"/>` + text(lx + 16, 43, s.name, "ink", 12, "start");
    lx += 16 + s.name.length * 13 + 24;
  }
  c.groups.forEach((lines, gi) => {
    const cx = left + slot * gi + slot / 2;
    const present = c.series.filter((s) => s.values[gi] !== null);
    const total = present.length * bw + (present.length - 1) * gap;
    present.forEach((s, si) => {
      const x = cx - total / 2 + si * (bw + gap);
      const v = s.values[gi] as number;
      body += column(x, base, (v / c.yMax) * (base - top), bw, s.cls);
      body += text(x + bw / 2, y(v) - 6, c.fmt(v), "ink", 11, "middle", 600);
    });
    lines.forEach((l, li) => (body += text(cx, base + 20 + li * 16, l, "ink2", 12)));
  });
  if (c.note) body += text(left, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export interface StackSegment {
  name: string;
  cls: "s3" | "s4" | "s5";
  value: number;
}
export interface StackChart {
  title: string;
  desc: string;
  /** 図の上に書く、何の内訳かの説明（単位を含める）。 */
  axisLabel: string;
  unit: string;
  bars: { label: string; segments: StackSegment[] }[];
  xMax: number;
  note?: string;
}

/** 横向きの積み上げ棒。1 本が 1 つの全体で、部分の間に 2px のすき間を空ける。幅が足りない部分は値を書かない。 */
export function stackedBars(c: StackChart): string {
  const H = 90 + c.bars.length * 56 + (c.note ? 24 : 0);
  const left = 96, right = 64, top = 64;
  const perUnit = (W - left - right) / c.xMax;
  let body = text(left, 22, c.axisLabel, "ink2", 12, "start");
  let lx = left;
  const names = [...new Map(c.bars.flatMap((b) => b.segments).map((s) => [s.name, s.cls])).entries()];
  for (const [name, cls] of names) {
    body += `<rect class="${cls}" x="${lx}" y="34" width="10" height="10" rx="2"/>` + text(lx + 16, 43, name, "ink", 12, "start");
    lx += 16 + name.length * 13 + 24;
  }
  c.bars.forEach((b, bi) => {
    const y = top + bi * 56;
    body += text(left - 10, y + 17, b.label, "ink", 13, "end", 600);
    let x = left;
    b.segments.forEach((s, si) => {
      const w = Math.max(s.value * perUnit - 2, 0);
      if (w > 0) {
        const last = si === b.segments.length - 1;
        body += last
          ? `<path class="${s.cls}" d="M${r1(x)},${y} L${r1(x + w - 4)},${y} A4,4 0 0 1 ${r1(x + w)},${y + 4} L${r1(x + w)},${y + 20} A4,4 0 0 1 ${r1(x + w - 4)},${y + 24} L${r1(x)},${y + 24} Z"/>`
          : `<rect class="${s.cls}" x="${r1(x)}" y="${y}" width="${r1(w)}" height="24"/>`;
        if (w > 44) body += text(x + w / 2, y + 16, s.value.toFixed(1), "onfill", 12, "middle", 600);
      }
      x += s.value * perUnit;
    });
    body += text(x + 6, y + 17, `${b.segments.reduce((n, s) => n + s.value, 0).toFixed(1)} ${c.unit}`, "ink", 12, "start", 600);
  });
  body += `<line class="axis" x1="${left}" x2="${left}" y1="${top - 6}" y2="${top + c.bars.length * 56 - 12}"/>`;
  if (c.note) body += text(left, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}
