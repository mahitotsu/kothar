// 図の部品。箱・グループ・矢印・枠（構成図）と、棒・凡例の下地（グラフ）が共有する。出力は決まった入力に対して常に同じ。
// 配色: dataviz のスキルで検証した、カテゴリ色の 1〜5 番（ライトとダーク）。ダークは prefers-color-scheme で切り替える。
// 構成図の箱は、意味のある色（.k1 .k2）を使う。グラフの系列は .s1〜.s5 を使う。

export const W = 720;

export const STYLE = `<style>
  svg { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; }
  .bg { fill: #fcfcfb; } .ink { fill: #0b0b0b; } .ink2 { fill: #52514e; } .grid { stroke: #e6e5e1; stroke-width: 1; } .axis { stroke: #c9c8c3; stroke-width: 1; }
  .box { fill: #ffffff; stroke: #c9c8c3; stroke-width: 1; } .grp { fill: #f4f3f0; stroke: #e6e5e1; stroke-width: 1; }
  .k1 { fill: #e8f0fb; stroke: #2a78d6; stroke-width: 1.5; } .k2 { fill: #fdeee7; stroke: #eb6834; stroke-width: 1.5; }
  .line { stroke: #52514e; stroke-width: 1.5; fill: none; } .dash { stroke: #9a9992; stroke-width: 1; stroke-dasharray: 4 3; fill: none; } .head { fill: #52514e; }
  .s1 { fill: #2a78d6; } .s2 { fill: #eb6834; } .s3 { fill: #1baf7a; } .s4 { fill: #eda100; } .s5 { fill: #e87ba4; } .onfill { fill: #0b0b0b; }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #1a1a19; } .ink { fill: #f0efec; } .ink2 { fill: #c3c2b7; } .grid { stroke: #2e2e2c; } .axis { stroke: #4a4a46; }
    .box { fill: #242422; stroke: #4a4a46; } .grp { fill: #20201f; stroke: #2e2e2c; }
    .k1 { fill: #17263a; stroke: #3987e5; } .k2 { fill: #3a2218; stroke: #d95926; }
    .line { stroke: #c3c2b7; } .dash { stroke: #7a7972; } .head { fill: #c3c2b7; }
    .s1 { fill: #3987e5; } .s2 { fill: #d95926; } .s3 { fill: #199e70; } .s4 { fill: #c98500; } .s5 { fill: #d55181; }
  }
</style>`;

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const r1 = (n: number) => Math.round(n * 10) / 10;

export const text = (x: number, y: number, s: string, cls = "ink", size = 12, anchor = "middle", weight = 400) =>
  `<text x="${r1(x)}" y="${r1(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;

/** 箱。行を中央に並べる（1 行目が太字）。cls は box / k1 / k2。 */
export function box(x: number, y: number, w: number, h: number, lines: string[], cls = "box"): string {
  const lh = 16;
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2 + 4;
  return (
    `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` +
    lines.map((l, i) => text(x + w / 2, y0 + i * lh, l, i === 0 ? "ink" : "ink2", i === 0 ? 12 : 11, "middle", i === 0 ? 600 : 400)).join("")
  );
}

/** 箱をまとめる枠（ラベルは左上）。 */
export const group = (x: number, y: number, w: number, h: number, label: string): string =>
  `<rect class="grp" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>` + text(x + 10, y + 18, label, "ink2", 11, "start", 600);

/** 終点に矢じりのある線。pts は x1,y1,x2,y2,...（折れ線は直交するよう、呼び出し側が点を与える）。 */
export function arrow(pts: number[], dashed = false): string {
  const p: string[] = [];
  for (let i = 0; i < pts.length; i += 2) p.push(`${pts[i]},${pts[i + 1]}`);
  const n = pts.length;
  const [x1, y1, x2, y2] = [pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1]];
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (d: number) => r1(x2 - 8 * Math.cos(a + d));
  const hy = (d: number) => r1(y2 - 8 * Math.sin(a + d));
  return (
    `<polyline class="${dashed ? "dash" : "line"}" points="${p.join(" ")}"/>` +
    `<polygon class="head" points="${x2},${y2} ${hx(0.4)},${hy(0.4)} ${hx(-0.4)},${hy(-0.4)}"/>`
  );
}

/** SVG 全体。title と desc は読み上げ用。 */
export function frame(title: string, desc: string, h: number, body: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${h}" width="${W}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
${STYLE}
<rect class="bg" width="${W}" height="${h}"/>
${body}
</svg>
`;
}
