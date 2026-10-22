// 2x2 マトリクス。軸の名前と向き、4 象限の名前、点（0〜1 の座標）を書く。点のラベルが重ならないよう、右・左・上・下の順に置く。
import { dot, frame, r1, text, textWidth, W } from "./svg-parts.ts";
import { need } from "./charts-more.ts";

export interface MatrixSpec {
  kind: "matrix";
  title: string;
  desc: string;
  /** 横軸と縦軸。low と high は、軸の両端の意味（例: 労力が小さい、大きい）。 */
  xAxis: { name: string; low: string; high: string };
  yAxis: { name: string; low: string; high: string };
  /** 左上、右上、左下、右下の名前。 */
  quadrants?: [string, string, string, string];
  points: { label: string; x: number; y: number; highlight?: boolean }[];
  note?: string;
}

export function matrix(c: MatrixSpec): string {
  need(c.points.length >= 1, "matrix: points が空");
  for (const p of c.points) need(p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1, `matrix: 点「${p.label}」の座標は 0〜1`);
  const px = 96, py = 52, pw = W - px - 40, ph = 300;
  const X = (v: number) => px + v * pw, Y = (v: number) => py + (1 - v) * ph;
  let body = text(px, 22, `縦軸: ${c.yAxis.name}`, "ink", 12, "start", 600);
  body += `<rect class="grp" x="${px}" y="${py}" width="${pw}" height="${ph}" rx="4"/>`;
  body += `<line class="axis" x1="${px + pw / 2}" x2="${px + pw / 2}" y1="${py}" y2="${py + ph}"/><line class="axis" x1="${px}" x2="${px + pw}" y1="${py + ph / 2}" y2="${py + ph / 2}"/>`;
  if (c.quadrants) {
    const [tl, tr, bl, br] = c.quadrants;
    body += text(px + 10, py + 20, tl, "ink3", 12, "start", 600) + text(px + pw - 10, py + 20, tr, "ink3", 12, "end", 600);
    body += text(px + 10, py + ph - 10, bl, "ink3", 12, "start", 600) + text(px + pw - 10, py + ph - 10, br, "ink3", 12, "end", 600);
  }
  body += text(px - 10, py + 12, c.yAxis.high, "ink2", 11, "end") + text(px - 10, py + ph, c.yAxis.low, "ink2", 11, "end");
  body += text(px, py + ph + 18, c.xAxis.low, "ink2", 11, "start") + text(px + pw, py + ph + 18, c.xAxis.high, "ink2", 11, "end");
  body += text(px + pw / 2, py + ph + 18, `横軸: ${c.xAxis.name}`, "ink", 12, "middle", 600);
  const taken: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const overlaps = (r: { x1: number; y1: number; x2: number; y2: number }) => taken.some((t) => r.x1 < t.x2 + 2 && r.x2 > t.x1 - 2 && r.y1 < t.y2 + 2 && r.y2 > t.y1 - 2);
  for (const p of c.points) taken.push({ x1: X(p.x) - 7, y1: Y(p.y) - 7, x2: X(p.x) + 7, y2: Y(p.y) + 7 });
  for (const p of c.points) {
    const [cx, cy, w] = [X(p.x), Y(p.y), textWidth(p.label, 12, p.highlight ? 600 : 400)];
    const opts = [
      { x: cx + 12, a: "start", r: { x1: cx + 10, y1: cy - 9, x2: cx + 14 + w, y2: cy + 9 } },
      { x: cx - 12, a: "end", r: { x1: cx - 14 - w, y1: cy - 9, x2: cx - 10, y2: cy + 9 } },
      { x: cx, a: "middle", r: { x1: cx - w / 2, y1: cy - 26, x2: cx + w / 2, y2: cy - 10 }, dy: -14 },
      { x: cx, a: "middle", r: { x1: cx - w / 2, y1: cy + 10, x2: cx + w / 2, y2: cy + 26 }, dy: 18 },
    ];
    const ok = opts.find((o) => o.r.x1 >= px && o.r.x2 <= px + pw && o.r.y1 >= py && o.r.y2 <= py + ph && !overlaps(o.r));
    need(ok, `matrix: 点「${p.label}」のラベルを、重ならずに置けない。座標を離すか、ラベルを短くする`);
    taken.push(ok.r);
    body += dot(cx, cy, p.highlight || !c.points.some((q) => q.highlight) ? "s1" : "gray", 6);
    body += text(ok.x, cy + 4 + (ok.dy ?? 0), p.label, "ink", 12, ok.a, p.highlight ? 600 : 400);
  }
  const H = py + ph + 40 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

const mdTable = (head: string[], rows: string[][]) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
export const matrixTable = (c: MatrixSpec) => mdTable(["項目", c.xAxis.name, c.yAxis.name], c.points.map((p) => [p.label, String(p.x), String(p.y)]));
