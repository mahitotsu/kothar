// 図の部品。箱・グループ・矢印・枠（構成図）と、棒・凡例の下地（グラフ）が共有する。出力は決まった入力に対して常に同じ。
// 配色: dataviz のスキルで検証した、カテゴリ色の 1〜5 番（ライトとダーク）。ダークは prefers-color-scheme で切り替える。
// 構成図の箱は、意味のある色（.k1 .k2、差分の .kadd .krem）を使う。グラフの系列は .s1〜.s5（面）と .l1〜.l3（線）を使う。
// 強調するグラフは、1 つに .s1 を付け、残りを .gray にする。ヒートマップは、青の単色階調 .h1〜.h5 と、その上の文字 .t1〜.t5。
// 状態は .ok .warn .bad で、記号と文字を必ず併記する（色だけで伝えない）。値は dataviz の palette.md のもの。

export const W = 720;

export const STYLE = `<style>
  svg { font-family: system-ui, -apple-system, "Hiragino Sans", "Noto Sans JP", sans-serif; }
  .bg { fill: #fcfcfb; } .ink { fill: #0b0b0b; } .ink2 { fill: #52514e; } .ink3 { fill: #898781; } .grid { stroke: #e1e0d9; stroke-width: 1; } .axis { stroke: #c3c2b7; stroke-width: 1; }
  .box { fill: #ffffff; stroke: #c3c2b7; stroke-width: 1; } .grp { fill: #f4f3f0; stroke: #e1e0d9; stroke-width: 1; } .track { fill: #e1e0d9; }
  .k1 { fill: #e8f0fb; stroke: #2a78d6; stroke-width: 1.5; } .k2 { fill: #fdeee7; stroke: #eb6834; stroke-width: 1.5; }
  .kadd { fill: #e6f6ef; stroke: #1baf7a; stroke-width: 1.5; } .krem { fill: #fdeceb; stroke: #e34948; stroke-width: 1.5; stroke-dasharray: 5 3; }
  .line { stroke: #52514e; stroke-width: 1.5; fill: none; } .dash { stroke: #9a9992; stroke-width: 1; stroke-dasharray: 4 3; fill: none; } .head { fill: #52514e; }
  .ladd { stroke: #1baf7a; stroke-width: 2; fill: none; } .lrem { stroke: #e34948; stroke-width: 1.5; stroke-dasharray: 5 3; fill: none; } .hadd { fill: #1baf7a; } .hrem { fill: #e34948; }
  .l1, .l2, .l3, .lg { stroke-width: 2; fill: none; stroke-linejoin: round; stroke-linecap: round; } .l1 { stroke: #2a78d6; } .l2 { stroke: #eb6834; } .l3 { stroke: #1baf7a; } .lg { stroke: #898781; }
  .link { stroke: #c3c2b7; stroke-width: 3; stroke-linecap: round; } .ring { stroke: #fcfcfb; stroke-width: 2; } .mark { stroke: #0b0b0b; stroke-width: 1.5; } .today { stroke: #0b0b0b; stroke-width: 1.5; }
  .s1 { fill: #2a78d6; } .s2 { fill: #eb6834; } .s3 { fill: #1baf7a; } .s4 { fill: #eda100; } .s5 { fill: #e87ba4; } .gray { fill: #898781; } .onfill { fill: #0b0b0b; }
  .h1 { fill: #cde2fb; } .h2 { fill: #86b6ef; } .h3 { fill: #3987e5; } .h4 { fill: #1c5cab; } .h5 { fill: #0d366b; }
  .t1, .t2, .t3 { fill: #0b0b0b; } .t4, .t5 { fill: #ffffff; }
  .ok { fill: #0ca30c; } .warn { fill: #fab219; } .bad { fill: #d03b3b; } .glyph { stroke: #ffffff; stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  @media (prefers-color-scheme: dark) {
    .bg { fill: #1a1a19; } .ink { fill: #f0efec; } .ink2 { fill: #c3c2b7; } .ink3 { fill: #898781; } .grid { stroke: #2c2c2a; } .axis { stroke: #383835; }
    .box { fill: #242422; stroke: #4a4a46; } .grp { fill: #20201f; stroke: #2c2c2a; } .track { fill: #2c2c2a; }
    .k1 { fill: #17263a; stroke: #3987e5; } .k2 { fill: #3a2218; stroke: #d95926; }
    .kadd { fill: #12281f; stroke: #199e70; } .krem { fill: #3a1c1c; stroke: #e66767; }
    .line { stroke: #c3c2b7; } .dash { stroke: #7a7972; } .head { fill: #c3c2b7; }
    .ladd { stroke: #199e70; } .lrem { stroke: #e66767; } .hadd { fill: #199e70; } .hrem { fill: #e66767; }
    .l1 { stroke: #3987e5; } .l2 { stroke: #d95926; } .l3 { stroke: #199e70; }
    .link { stroke: #5a5a55; } .ring { stroke: #1a1a19; } .mark { stroke: #f0efec; } .today { stroke: #f0efec; }
    .s1 { fill: #3987e5; } .s2 { fill: #d95926; } .s3 { fill: #199e70; } .s4 { fill: #c98500; } .s5 { fill: #d55181; }
    .h1 { fill: #0d366b; } .h2 { fill: #184f95; } .h3 { fill: #256abf; } .h4 { fill: #3987e5; } .h5 { fill: #9ec5f4; }
    .t1, .t2, .t3 { fill: #f0efec; } .t4, .t5 { fill: #0b0b0b; }
  }
</style>`;

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const r1 = (n: number) => Math.round(n * 10) / 10;

/** 文字列の幅の見積もり（px）。全角はサイズと同じ、半角は約 0.58 倍、空白は約 0.32 倍。フォントを測らないので、少し大きめに見積もる。 */
export function textWidth(s: string, size = 12, weight = 400): number {
  let w = 0;
  for (const ch of s) {
    const c = ch.codePointAt(0) as number;
    const wide = (c >= 0x2e80 && c <= 0x9fff) || (c >= 0xf900 && c <= 0xfaff) || (c >= 0xff00 && c <= 0xffef) || (c >= 0x2010 && c <= 0x2027 && c !== 0x2022);
    w += wide ? 1 : ch === " " ? 0.32 : weight >= 600 ? 0.62 : 0.58;
  }
  return r1(w * size);
}

/** ラベルが幅に収まらないとき、エラーにする（クリップしない）。収まるときは、そのまま返す。 */
export function fit(s: string, size: number, weight: number, available: number, where: string): string {
  const w = textWidth(s, size, weight);
  if (w > available) throw new Error(`「${s}」が${where}に収まらない（見積もり ${w}px、使える幅 ${r1(available)}px）。短くするか、幅を広げる`);
  return s;
}

export const text = (x: number, y: number, s: string, cls = "ink", size = 12, anchor = "middle", weight = 400) =>
  `<text x="${r1(x)}" y="${r1(y)}" class="${cls}" font-size="${size}" text-anchor="${anchor}" font-weight="${weight}">${esc(s)}</text>`;

export type BoxClass = "box" | "k1" | "k2" | "kadd" | "krem";

/** 箱。行を中央に並べる（1 行目が太字）。cls は box / k1 / k2 / kadd / krem。行が幅に収まらなければエラー。 */
export function box(x: number, y: number, w: number, h: number, lines: string[], cls: BoxClass = "box"): string {
  const lh = 16;
  const y0 = y + h / 2 - ((lines.length - 1) * lh) / 2 + 4;
  lines.forEach((l, i) => fit(l, i === 0 ? 12 : 11, i === 0 ? 600 : 400, w - 16, "箱"));
  return (
    `<rect class="${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>` +
    lines.map((l, i) => text(x + w / 2, y0 + i * lh, l, i === 0 ? "ink" : "ink2", i === 0 ? 12 : 11, "middle", i === 0 ? 600 : 400)).join("")
  );
}

/** 端子（開始・終了）。角が半円の箱。 */
export function terminator(x: number, y: number, w: number, h: number, lines: string[], cls: BoxClass = "box"): string {
  return box(x, y, w, h, lines, cls).replace(/rx="6"/, `rx="${h / 2}"`);
}

/** 判断（ひし形）。中央に文字。 */
export function diamond(cx: number, cy: number, w: number, h: number, lines: string[], cls: BoxClass = "box"): string {
  const lh = 15;
  const y0 = cy - ((lines.length - 1) * lh) / 2 + 4;
  lines.forEach((l) => fit(l, 12, 600, w * 0.62, "判断"));
  const pts = `${r1(cx)},${r1(cy - h / 2)} ${r1(cx + w / 2)},${r1(cy)} ${r1(cx)},${r1(cy + h / 2)} ${r1(cx - w / 2)},${r1(cy)}`;
  return `<polygon class="${cls}" points="${pts}"/>` + lines.map((l, i) => text(cx, y0 + i * lh, l, "ink", 12, "middle", 600)).join("");
}

/** 蓄積（データベースなど）。円筒の形。 */
export function store(x: number, y: number, w: number, h: number, lines: string[], cls: BoxClass = "box"): string {
  const e = 7;
  lines.forEach((l, i) => fit(l, i === 0 ? 12 : 11, i === 0 ? 600 : 400, w - 16, "蓄積"));
  const lh = 16;
  const y0 = y + h / 2 + e / 2 - ((lines.length - 1) * lh) / 2 + 4;
  return (
    `<path class="${cls}" d="M${x},${y + e} A${w / 2},${e} 0 0 1 ${x + w},${y + e} L${x + w},${y + h - e} A${w / 2},${e} 0 0 1 ${x},${y + h - e} Z"/>` +
    `<path class="${cls}" d="M${x},${y + e} A${w / 2},${e} 0 0 0 ${x + w},${y + e}" fill="none"/>` +
    lines.map((l, i) => text(x + w / 2, y0 + i * lh, l, i === 0 ? "ink" : "ink2", i === 0 ? 12 : 11, "middle", i === 0 ? 600 : 400)).join("")
  );
}

/** 利用者・外部の人（頭と肩の印つきの箱）。 */
export function actor(x: number, y: number, w: number, h: number, lines: string[], cls: BoxClass = "box"): string {
  const cx = x + 18, cy = y + h / 2;
  return (
    box(x + 12, y, w - 12, h, lines, cls).replace(/<text x="([\d.]+)"/g, (_m, tx) => `<text x="${r1(Number(tx) + 6)}"`) +
    `<circle class="ink2" cx="${cx - 12}" cy="${cy - 6}" r="4.5"/><path class="ink2" d="M${cx - 21},${cy + 10} Q${cx - 21},${cy + 1} ${cx - 12},${cy + 1} Q${cx - 3},${cy + 1} ${cx - 3},${cy + 10} Z"/>`
  );
}

/** 箱をまとめる枠（ラベルは左上）。 */
export const group = (x: number, y: number, w: number, h: number, label: string): string =>
  `<rect class="grp" x="${x}" y="${y}" width="${w}" height="${h}" rx="8"/>` + text(x + 10, y + 18, label, "ink2", 11, "start", 600);

/** 終点に矢じりのある線。pts は x1,y1,x2,y2,...（折れ線は直交するよう、呼び出し側が点を与える）。 */
export function arrow(pts: number[], dashed = false, lineCls = "", headCls = "head"): string {
  const p: string[] = [];
  for (let i = 0; i < pts.length; i += 2) p.push(`${pts[i]},${pts[i + 1]}`);
  const n = pts.length;
  const [x1, y1, x2, y2] = [pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1]];
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (d: number) => r1(x2 - 8 * Math.cos(a + d));
  const hy = (d: number) => r1(y2 - 8 * Math.sin(a + d));
  return (
    `<polyline class="${lineCls || (dashed ? "dash" : "line")}" points="${p.join(" ")}"/>` +
    `<polygon class="${headCls}" points="${x2},${y2} ${hx(0.4)},${hy(0.4)} ${hx(-0.4)},${hy(-0.4)}"/>`
  );
}

/** 開いた矢じりの線（戻りのメッセージ）。 */
export function openArrow(pts: number[], dashed = true): string {
  const n = pts.length;
  const [x1, y1, x2, y2] = [pts[n - 4], pts[n - 3], pts[n - 2], pts[n - 1]];
  const a = Math.atan2(y2 - y1, x2 - x1);
  const hx = (d: number) => r1(x2 - 8 * Math.cos(a + d));
  const hy = (d: number) => r1(y2 - 8 * Math.sin(a + d));
  const p = pts.reduce<string[]>((acc, v, i) => (i % 2 ? acc : [...acc, `${v},${pts[i + 1]}`]), []);
  return `<polyline class="${dashed ? "dash" : "line"}" points="${p.join(" ")}"/><polyline class="line" points="${hx(0.45)},${hy(0.45)} ${x2},${y2} ${hx(-0.45)},${hy(-0.45)}"/>`;
}

/** 線の上に置くラベル。背景の色で線を切り、文字が読めるようにする。中心の座標を与える。 */
export function lineLabel(cx: number, cy: number, s: string, size = 11): string {
  const w = textWidth(s, size) + 8;
  return `<rect class="bg" x="${r1(cx - w / 2)}" y="${r1(cy - size / 2 - 3)}" width="${r1(w)}" height="${size + 6}"/>` + text(cx, cy + size / 2 - 2, s, "ink2", size);
}

/** 円の印（点）。表面の色の輪を付け、線や他の点と重なっても読める。 */
export const dot = (x: number, y: number, cls: string, r = 5): string => `<circle class="${cls} ring" cx="${r1(x)}" cy="${r1(y)}" r="${r}"/>`;

/** 状態の記号（形と色を併用する）: ok = 丸にチェック、warn = 三角、bad = 四角に ×。中心の座標を与える。 */
export function statusIcon(kind: "ok" | "warn" | "bad", cx: number, cy: number): string {
  if (kind === "ok") return `<circle class="ok" cx="${cx}" cy="${cy}" r="8"/><polyline class="glyph" points="${cx - 3.5},${cy} ${cx - 1},${cy + 3} ${cx + 4},${cy - 3}"/>`;
  if (kind === "warn") return `<polygon class="warn" points="${cx},${cy - 8} ${cx + 9},${cy + 7} ${cx - 9},${cy + 7}"/>` + `<text x="${cx}" y="${cy + 5}" class="onfill" font-size="11" font-weight="700" text-anchor="middle">!</text>`;
  return `<rect class="bad" x="${cx - 8}" y="${cy - 8}" width="16" height="16" rx="3"/><polyline class="glyph" points="${cx - 3.5},${cy - 3.5} ${cx + 3.5},${cy + 3.5}"/><polyline class="glyph" points="${cx + 3.5},${cy - 3.5} ${cx - 3.5},${cy + 3.5}"/>`;
}

/** 凡例（横並び）。items は { cls: 色の面クラス, name }。幅は、文字幅の見積もりから決める。 */
export function legend(x: number, y: number, items: { cls: string; name: string }[]): string {
  let lx = x;
  let out = "";
  for (const it of items) {
    out += `<rect class="${it.cls}" x="${r1(lx)}" y="${y}" width="10" height="10" rx="2"/>` + text(lx + 16, y + 9, it.name, "ink", 12, "start");
    lx += 16 + textWidth(it.name, 12) + 24;
  }
  return out;
}

/** SVG 全体。title と desc は読み上げ用。 */
export function frame(title: string, desc: string, h: number, body: string, w = W): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
${STYLE}
<rect class="bg" width="${w}" height="${h}"/>
${body}
</svg>
`;
}
