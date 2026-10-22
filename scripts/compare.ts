// 比較図（Before/After）。2 つの格子の図を並べる。追加は緑（＋の印）、削除は赤の破線（−の印）。色だけに頼らない。
import { frame, r1, text, W } from "./svg-parts.ts";
import { need } from "./charts-more.ts";
import { layoutGrid, type GridParts } from "./grid.ts";
import { legendRow } from "./compare-legend.ts";

export interface CompareSpec {
  kind: "compare";
  title: string;
  desc: string;
  before: GridParts & { label?: string };
  after: GridParts & { label?: string };
  note?: string;
}

/** 配置の警告（矢印の交差、節点の横切り）。 */
export const compareWarnings = (c: CompareSpec): string[] => [...layoutGrid(c.before).warnings.map((w) => `変更前の図: ${w}`), ...layoutGrid(c.after).warnings.map((w) => `変更後の図: ${w}`)];

export function compare(c: CompareSpec): string {
  const [b, a] = [layoutGrid(c.before), layoutGrid(c.after)];
  const gap = 48, m = 20, head = 28;
  const total = b.w + a.w + gap;
  const s = Math.min(1, (W - m * 2) / total);
  need(s >= 0.72, `compare: 2 つの図が大きすぎる（縮尺 ${r1(s)}。文字が小さくなる）。節点を減らすか、列を詰める`);
  const h = Math.max(b.h, a.h) * s;
  const x1 = m, x2 = m + (b.w + gap) * s;
  let body = text(x1, m + 10, c.before.label ?? "変更前", "ink", 13, "start", 600) + text(x2, m + 10, c.after.label ?? "変更後", "ink", 13, "start", 600);
  body += `<line class="axis" x1="${r1(x2 - (gap / 2) * s)}" x2="${r1(x2 - (gap / 2) * s)}" y1="${m}" y2="${r1(m + head + h)}"/>`;
  body += `<g transform="translate(${r1(x1)},${m + head}) scale(${r1(s)})">${b.body}</g><g transform="translate(${r1(x2)},${m + head}) scale(${r1(s)})">${a.body}</g>`;
  let H = m + head + h + m;
  body += legendRow(m, H - 2);
  H += 28;
  if (c.note) {
    body += text(m, H, c.note, "ink2", 11, "start");
    H += 18;
  }
  return frame(c.title, c.desc, Math.ceil(H), body);
}
