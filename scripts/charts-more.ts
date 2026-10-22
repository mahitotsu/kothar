// グラフの部品（横棒、折れ線、ダンベル、ヒートマップ、KPI タイル、メーター）。入力は仕様（JSON）、出力は SVG。同じ入力なら同じ出力。
// 規則: 棒は 0 から始める。色で区別する系列は 3 つまで（強調 highlight なら、残りは灰色にして増やせる）。値は文字でも書く。
// ラベルが収まらないときは、描かずにエラーにする。表の双子は、各 kind の ...Table() が Markdown で返す。
import { W, dot, fit, frame, legend, r1, statusIcon, text, textWidth } from "./svg-parts.ts";

export function need(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}
const num = (n: number, d?: number) => (d === undefined ? String(n) : n.toFixed(d));

/** 区切りのよい目盛り。min〜max を含み、間隔は 1、2、5 の倍数にする。 */
export function niceTicks(min: number, max: number, count = 4): { ticks: number[]; min: number; max: number } {
  const range = max - min || Math.abs(max) || 1;
  const rough = range / count;
  const mag = 10 ** Math.floor(Math.log10(rough));
  const norm = rough / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const lo = Math.floor(min / step + 1e-9) * step;
  const hi = Math.ceil(max / step - 1e-9) * step;
  const ticks: number[] = [];
  for (let t = lo; t <= hi + step / 2; t += step) ticks.push(Math.round(t * 1e9) / 1e9);
  return { ticks, min: lo, max: hi };
}

/** 左は四角、右（データ側）の端が 4px の丸い横棒。 */
function hbar(x: number, y: number, w: number, h: number, cls: string): string {
  if (!(w > 0)) return "";
  const r = Math.min(4, h / 2, w / 2);
  return `<path class="${cls}" d="M${r1(x)},${r1(y)} L${r1(x + w - r)},${r1(y)} A${r},${r} 0 0 1 ${r1(x + w)},${r1(y + r)} L${r1(x + w)},${r1(y + h - r)} A${r},${r} 0 0 1 ${r1(x + w - r)},${r1(y + h)} L${r1(x)},${r1(y + h)} Z"/>`;
}

const mdTable = (head: string[], rows: string[][]) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");

// ---- 横棒（順位、長いラベル、強調） ----
export interface BarsSpec {
  kind: "bars";
  title: string;
  desc: string;
  /** 図の上に書く、何の値かの説明（単位を含める）。 */
  axisLabel: string;
  unit?: string;
  decimals?: number;
  items: { label: string; value: number }[];
  /** desc（降順）、asc、none（入力の順）。既定は降順。 */
  sort?: "desc" | "asc" | "none";
  /** 色を付けるラベル。指定すると、残りは灰色になる。 */
  highlight?: string[];
  note?: string;
}

const sortedBars = (c: BarsSpec) => {
  const items = [...c.items];
  if ((c.sort ?? "desc") === "desc") items.sort((a, b) => b.value - a.value);
  else if (c.sort === "asc") items.sort((a, b) => a.value - b.value);
  return items;
};

export function bars(c: BarsSpec): string {
  need(c.items.length >= 1, "bars: items が空");
  need(c.items.every((i) => i.value >= 0), "bars: 棒は 0 から始める。負の値は、dumbbell か lines で描く");
  for (const h of c.highlight ?? []) need(c.items.some((i) => i.label === h), `bars: highlight「${h}」が items にない`);
  const items = sortedBars(c);
  const maxLabel = Math.max(...items.map((i) => textWidth(i.label, 13, 600)));
  need(maxLabel <= 260, `bars: ラベルが長すぎる（見積もり ${maxLabel}px。260px 以内にする）`);
  const x0 = 24 + maxLabel + 14;
  const fmtv = (v: number) => num(v, c.decimals) + (c.unit ? ` ${c.unit}` : "");
  const valueW = Math.max(...items.map((i) => textWidth(fmtv(i.value), 12, 600))) + 8;
  const barMax = W - 24 - x0 - valueW;
  need(barMax >= 120, "bars: 棒の領域が狭すぎる。ラベルか単位を短くする");
  const vmax = Math.max(...items.map((i) => i.value)) || 1;
  const top = 48, pitch = 32, th = 20;
  let body = text(24, 22, c.axisLabel, "ink2", 12, "start");
  items.forEach((it, i) => {
    const y = top + i * pitch;
    const w = (it.value / vmax) * barMax;
    const hi = !c.highlight || c.highlight.includes(it.label);
    body += text(x0 - 14, y + th / 2 + 5, it.label, "ink", 13, "end", 600);
    body += hbar(x0, y, w, th, hi ? "s1" : "gray");
    body += text(x0 + w + 8, y + th / 2 + 4, fmtv(it.value), "ink", 12, "start", c.highlight && hi ? 700 : 400);
  });
  const H = top + items.length * pitch + (c.note ? 36 : 12);
  body += `<line class="axis" x1="${x0}" x2="${x0}" y1="${top - 6}" y2="${top + items.length * pitch - 6}"/>`;
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const barsTable = (c: BarsSpec) => mdTable(["項目", c.unit ? `値（${c.unit}）` : "値"], sortedBars(c).map((i) => [i.label, num(i.value, c.decimals)]));

// ---- 折れ線（推移） ----
export interface LinesSpec {
  kind: "lines";
  title: string;
  desc: string;
  axisLabel: string;
  xLabels: string[];
  series: { name: string; values: (number | null)[] }[];
  /** 指定すると、その系列だけ色を付け、残りは灰色にする。 */
  highlight?: string;
  yMin?: number;
  yMax?: number;
  decimals?: number;
  unit?: string;
  note?: string;
}

const LINE_FILL: Record<string, string> = { l1: "s1", l2: "s2", l3: "s3", lg: "gray" };

export function lines(c: LinesSpec): string {
  need(c.xLabels.length >= 2 && c.series.length >= 1, "lines: xLabels は 2 個以上、series は 1 個以上");
  need(c.highlight || c.series.length <= 3, "lines: 色で区別する系列は 3 つまで。highlight で 1 つを強調するか、図を分ける");
  for (const s of c.series) need(s.values.length === c.xLabels.length, `lines: 系列「${s.name}」の値の数が xLabels と違う`);
  if (c.highlight) need(c.series.some((s) => s.name === c.highlight), `lines: highlight「${c.highlight}」が series にない`);
  const clsOf = (s: { name: string }, i: number) => (c.highlight ? (s.name === c.highlight ? "l1" : "lg") : (["l1", "l2", "l3"][i] as string));
  const vals = c.series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  const sc = niceTicks(c.yMin ?? Math.min(0, ...vals), c.yMax ?? Math.max(...vals), 4);
  const fmtv = (v: number) => num(v, c.decimals) + (c.unit ?? "");
  const tickW = Math.max(...sc.ticks.map((t) => textWidth(num(t, c.decimals), 11)));
  const left = 24 + tickW + 10, top = 70, plotH = 230, base = top + plotH;
  const yOf = (v: number) => base - ((v - sc.min) / (sc.max - sc.min)) * plotH;
  const lastOf = (s: { values: (number | null)[] }) => {
    for (let i = s.values.length - 1; i >= 0; i--) if (s.values[i] !== null) return i;
    return -1;
  };
  const ends = c.series.map((s) => ({ s, i: lastOf(s), y: yOf(s.values[lastOf(s)] as number) })).sort((a, b) => a.y - b.y);
  const collide = ends.some((e, k) => k > 0 && e.y - ends[k - 1].y < 15);
  const endLabel = (s: { name: string; values: (number | null)[] }) => `${s.name} ${fmtv(s.values[lastOf(s)] as number)}`;
  const right = collide ? 32 : 24 + Math.max(...c.series.map((s) => textWidth(endLabel(s), 12, 600))) + 14;
  const plotW = W - left - right;
  need(plotW >= 240, "lines: 描画の領域が狭すぎる。系列名を短くする");
  const n = c.xLabels.length;
  const xOf = (i: number) => left + (plotW * i) / (n - 1);
  let body = text(24, 22, c.axisLabel, "ink2", 12, "start");
  const items = c.highlight ? [{ cls: "s1", name: c.highlight }, ...(c.series.length > 1 ? [{ cls: "gray", name: "その他" }] : [])] : c.series.map((s, i) => ({ cls: LINE_FILL[clsOf(s, i)], name: s.name }));
  if (items.length >= 2) body += legend(24, 34, items);
  for (const t of sc.ticks) body += `<line class="grid" x1="${left}" x2="${W - right}" y1="${r1(yOf(t))}" y2="${r1(yOf(t))}"/>` + text(left - 8, yOf(t) + 4, num(t, c.decimals), "ink2", 11, "end");
  body += `<line class="axis" x1="${left}" x2="${W - right}" y1="${base}" y2="${base}"/>`;
  const maxX = Math.max(...c.xLabels.map((l) => textWidth(l, 11)));
  const k = Math.max(1, Math.ceil((maxX + 10) / (plotW / (n - 1))));
  c.xLabels.forEach((l, i) => {
    if (i % k === 0) body += text(xOf(i), base + 18, l, "ink2", 11);
  });
  const order = c.series.map((s, i) => ({ s, i })).sort((a, b) => Number(clsOf(b.s, b.i) === "lg") - Number(clsOf(a.s, a.i) === "lg"));
  for (const { s, i } of order) {
    let d = "";
    let pen = false;
    s.values.forEach((v, j) => {
      if (v === null) pen = false;
      else {
        d += `${pen ? "L" : "M"}${r1(xOf(j))},${r1(yOf(v))} `;
        pen = true;
      }
    });
    body += `<path class="${clsOf(s, i)}" d="${d.trim()}"/>`;
  }
  for (const { s, i } of order) {
    const li = lastOf(s);
    body += dot(xOf(li), yOf(s.values[li] as number), LINE_FILL[clsOf(s, i)]);
  }
  if (!collide) for (const e of ends) body += text(xOf(e.i) + 12, e.y + 4, endLabel(e.s), "ink", 12, "start", 600);
  else if (c.series.length === 1) body += "";
  const H = base + 40 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const linesTable = (c: LinesSpec) => mdTable(["", ...c.series.map((s) => s.name)], c.xLabels.map((l, i) => [l, ...c.series.map((s) => (s.values[i] === null ? "–" : num(s.values[i] as number, c.decimals)))]));

// ---- ダンベル（前後の比較） ----
export interface DumbbellSpec {
  kind: "dumbbell";
  title: string;
  desc: string;
  axisLabel: string;
  beforeName: string;
  afterName: string;
  items: { label: string; before: number; after: number }[];
  /** diff（差の大きい順、既定）または none。 */
  sort?: "diff" | "none";
  /** 軸の範囲。省略すると 0 から。点だけの図なので、0 でなくてよい。 */
  xMin?: number;
  xMax?: number;
  decimals?: number;
  unit?: string;
  note?: string;
}

const sortedDumbbell = (c: DumbbellSpec) => ((c.sort ?? "diff") === "diff" ? [...c.items].sort((a, b) => Math.abs(b.after - b.before) - Math.abs(a.after - a.before)) : c.items);

export function dumbbell(c: DumbbellSpec): string {
  need(c.items.length >= 1, "dumbbell: items が空");
  const items = sortedDumbbell(c);
  const all = items.flatMap((i) => [i.before, i.after]);
  const sc = niceTicks(c.xMin ?? Math.min(0, ...all), c.xMax ?? Math.max(...all), 4);
  const maxLabel = Math.max(...items.map((i) => textWidth(i.label, 13, 600)));
  need(maxLabel <= 240, `dumbbell: ラベルが長すぎる（見積もり ${maxLabel}px。240px 以内にする）`);
  const fmtv = (v: number) => num(v, c.decimals) + (c.unit ? ` ${c.unit}` : "");
  const pad = Math.max(...all.map((v) => textWidth(fmtv(v), 11))) + 14;
  const left = 24 + maxLabel + 14 + pad, right = 24 + pad;
  const xOf = (v: number) => left + ((v - sc.min) / (sc.max - sc.min)) * (W - left - right);
  const top = 64, pitch = 34;
  const base = top + items.length * pitch;
  let body = text(24, 22, c.axisLabel, "ink2", 12, "start") + legend(24, 34, [{ cls: "gray", name: c.beforeName }, { cls: "s1", name: c.afterName }]);
  for (const t of sc.ticks) body += `<line class="grid" x1="${r1(xOf(t))}" x2="${r1(xOf(t))}" y1="${top - 8}" y2="${base - 8}"/>` + text(xOf(t), base + 10, num(t, c.decimals), "ink2", 11);
  body += `<line class="axis" x1="${left - pad + 14}" x2="${W - right + pad - 14}" y1="${base - 8}" y2="${base - 8}"/>`;
  items.forEach((it, i) => {
    const y = top + i * pitch + 8;
    const [lo, hi] = it.before <= it.after ? [it.before, it.after] : [it.after, it.before];
    body += text(24 + maxLabel, y + 5, it.label, "ink", 13, "end", 600);
    body += `<line class="link" x1="${r1(xOf(lo))}" x2="${r1(xOf(hi))}" y1="${y}" y2="${y}"/>`;
    body += dot(xOf(it.before), y, "gray") + dot(xOf(it.after), y, "s1");
    const emph = (isAfter: boolean) => (isAfter ? "ink" : "ink2");
    body += text(xOf(lo) - 10, y + 4, fmtv(lo), emph(it.after <= it.before), 11, "end", it.after <= it.before ? 600 : 400);
    body += text(xOf(hi) + 10, y + 4, fmtv(hi), emph(it.after > it.before), 11, "start", it.after > it.before ? 600 : 400);
  });
  const H = base + 30 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const dumbbellTable = (c: DumbbellSpec) => mdTable(["項目", c.beforeName, c.afterName, "差"], sortedDumbbell(c).map((i) => [i.label, num(i.before, c.decimals), num(i.after, c.decimals), num(i.after - i.before, c.decimals)]));

// ---- ヒートマップ ----
export interface HeatmapSpec {
  kind: "heatmap";
  title: string;
  desc: string;
  rows: string[];
  cols: string[];
  /** rows × cols。測っていないセルは null。 */
  values: (number | null)[][];
  min?: number;
  max?: number;
  decimals?: number;
  /** 階調の意味（凡例の左に書く）。例: 合格率（%）。 */
  legendName: string;
  note?: string;
}

export function heatmap(c: HeatmapSpec): string {
  need(c.values.length === c.rows.length && c.values.every((r) => r.length === c.cols.length), "heatmap: values の形が rows × cols と違う");
  const flat = c.values.flat().filter((v): v is number => v !== null);
  need(flat.length > 0, "heatmap: 値がない");
  const min = c.min ?? Math.min(...flat), max = c.max ?? Math.max(...flat);
  const level = (v: number) => Math.min(4, Math.max(0, Math.floor(((v - min) / (max - min || 1)) * 5)));
  const rowW = Math.max(...c.rows.map((r) => textWidth(r, 12, 600)));
  need(rowW <= 220, `heatmap: 行のラベルが長すぎる（見積もり ${rowW}px。220px 以内にする）`);
  const left = 24 + rowW + 12, gap = 2, ch = 30;
  const cw = Math.min(96, Math.floor((W - left - 24 - gap * (c.cols.length - 1)) / c.cols.length));
  need(cw >= 40, "heatmap: 列が多すぎる");
  const top = 52;
  let body = "";
  c.cols.forEach((l, j) => (body += text(left + j * (cw + gap) + cw / 2, top - 10, fit(l, 11, 400, cw, "列見出し"), "ink2", 11)));
  c.rows.forEach((r, i) => {
    const y = top + i * (ch + gap);
    body += text(left - 12, y + ch / 2 + 4, r, "ink", 12, "end", 600);
    c.values[i].forEach((v, j) => {
      const x = left + j * (cw + gap);
      if (v === null) {
        body += `<rect class="grid bg" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="3" stroke-width="1"/>` + text(x + cw / 2, y + ch / 2 + 4, "–", "ink3", 12);
      } else {
        const lv = level(v);
        body += `<rect class="h${lv + 1}" x="${x}" y="${y}" width="${cw}" height="${ch}" rx="3"/>` + text(x + cw / 2, y + ch / 2 + 4, fit(num(v, c.decimals), 12, 600, cw - 8, "セル"), `t${lv + 1}`, 12, "middle", 600);
      }
    });
  });
  const ly = top + c.rows.length * (ch + gap) + 14;
  const sw = 28;
  body += text(left, ly + 9, c.legendName, "ink2", 11, "start");
  const lx = left + textWidth(c.legendName, 11) + 16;
  body += text(lx, ly + 9, num(min, c.decimals), "ink2", 11, "start");
  const sx = lx + textWidth(num(min, c.decimals), 11) + 8;
  for (let k = 0; k < 5; k++) body += `<rect class="h${k + 1}" x="${sx + k * (sw + 2)}" y="${ly}" width="${sw}" height="10" rx="2"/>`;
  body += text(sx + 5 * (sw + 2) + 6, ly + 9, num(max, c.decimals), "ink2", 11, "start");
  const H = ly + 28 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const heatmapTable = (c: HeatmapSpec) => mdTable(["", ...c.cols], c.rows.map((r, i) => [r, ...c.values[i].map((v) => (v === null ? "–" : num(v, c.decimals)))]));

// ---- KPI タイル ----
export interface Tile {
  label: string;
  value: string;
  /** 符号つきの変化。例: +8 %。 */
  delta?: string;
  deltaDir?: "up" | "down" | "flat";
  /** 上向きが良いか。省略すると、良し悪しを色で示さない。 */
  deltaGood?: boolean;
  /** 比べる期間。例: 前週比。 */
  compare?: string;
  status?: "ok" | "warn" | "bad";
  statusText?: string;
  spark?: number[];
}
export interface TilesSpec {
  kind: "tiles";
  title: string;
  desc: string;
  tiles: Tile[];
  note?: string;
}

export function tiles(c: TilesSpec): string {
  need(c.tiles.length >= 1 && c.tiles.length <= 8, "tiles: タイルは 1〜8 個");
  const per = Math.min(4, c.tiles.length), gap = 16;
  const tw = Math.floor((W - 48 - gap * (per - 1)) / per), th = 108;
  let body = "";
  c.tiles.forEach((t, i) => {
    const x = 24 + (i % per) * (tw + gap), y = 16 + Math.floor(i / per) * (th + gap);
    if (t.status) need(t.statusText, `tiles: 状態のタイル「${t.label}」には statusText が要る（色と記号だけで伝えない）`);
    body += `<rect class="box" x="${x}" y="${y}" width="${tw}" height="${th}" rx="8"/>`;
    const labelMax = tw - 24 - (t.status ? textWidth(t.statusText as string, 11) + 30 : 0);
    body += text(x + 12, y + 24, fit(t.label, 12, 400, labelMax, "タイルのラベル"), "ink2", 12, "start");
    if (t.status) body += statusIcon(t.status, x + tw - 20, y + 20) + text(x + tw - 34, y + 24, t.statusText as string, "ink", 11, "end");
    body += text(x + 12, y + 62, fit(t.value, 28, 600, tw - 24, "タイルの値"), "ink", 28, "start", 600);
    if (t.delta) {
      const up = t.deltaDir === "up", down = t.deltaDir === "down";
      const cls = t.deltaGood === undefined ? "gray" : (t.deltaGood ? "ok" : "bad");
      const tx = x + 12, ty = y + 88;
      if (up) body += `<polygon class="${cls}" points="${tx},${ty + 3} ${tx + 10},${ty + 3} ${tx + 5},${ty - 6}"/>`;
      else if (down) body += `<polygon class="${cls}" points="${tx},${ty - 6} ${tx + 10},${ty - 6} ${tx + 5},${ty + 3}"/>`;
      else body += `<rect class="${cls}" x="${tx}" y="${ty - 2}" width="10" height="2"/>`;
      body += text(tx + 16, ty + 3, fit(t.delta + (t.compare ? ` ${t.compare}` : ""), 12, 400, tw - 24 - 16 - (t.spark ? 70 : 0), "タイルの変化"), "ink", 12, "start");
    }
    if (t.spark && t.spark.length >= 2) {
      const sw = 60, sh = 22, sx = x + tw - 12 - sw, sy = y + th - 14 - sh;
      const lo = Math.min(...t.spark), hi = Math.max(...t.spark);
      const pts = t.spark.map((v, k) => `${r1(sx + (sw * k) / (t.spark!.length - 1))},${r1(sy + sh - ((v - lo) / (hi - lo || 1)) * sh)}`);
      body += `<polyline class="lg" points="${pts.join(" ")}"/>` + dot(sx + sw, Number(pts[pts.length - 1].split(",")[1]), "s1", 4);
    }
  });
  const rows = Math.ceil(c.tiles.length / per);
  const H = 16 + rows * (th + gap) - gap + 16 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const tilesTable = (c: TilesSpec) => mdTable(["指標", "値", "変化", "状態"], c.tiles.map((t) => [t.label, t.value, t.delta ? `${t.delta}${t.compare ? `（${t.compare}）` : ""}` : "–", t.statusText ?? "–"]));

// ---- メーター ----
export interface MeterSpec {
  kind: "meter";
  title: string;
  desc: string;
  meters: { label: string; value: number; max: number; unit?: string; warnAt?: number; badAt?: number }[];
  decimals?: number;
  note?: string;
}

const severity = (m: MeterSpec["meters"][number]) => (m.badAt !== undefined && m.value >= m.badAt ? "bad" : m.warnAt !== undefined && m.value >= m.warnAt ? "warn" : "ok");

export function meter(c: MeterSpec): string {
  need(c.meters.length >= 1, "meter: meters が空");
  let body = "";
  c.meters.forEach((m, i) => {
    need(m.max > 0 && m.value >= 0 && m.value <= m.max, `meter: 「${m.label}」の値は 0 以上、max 以下にする`);
    const y = 16 + i * 52;
    const sev = severity(m);
    const vt = `${num(m.value, c.decimals)} / ${num(m.max, c.decimals)}${m.unit ? ` ${m.unit}` : ""}`;
    body += text(24, y + 14, m.label, "ink", 13, "start", 600) + text(W - 24 - (sev === "ok" ? 0 : 66), y + 14, vt, "ink", 12, "end");
    if (sev !== "ok") body += statusIcon(sev, W - 24 - 56, y + 10) + text(W - 24, y + 14, sev === "bad" ? "危険" : "注意", "ink", 12, "end", 600);
    body += `<rect class="track" x="24" y="${y + 24}" width="${W - 48}" height="10" rx="5"/>`;
    const w = ((W - 48) * m.value) / m.max;
    body += `<rect class="${sev === "ok" ? "s1" : sev}" x="24" y="${y + 24}" width="${r1(Math.max(w, 10))}" height="10" rx="5"/>`;
  });
  const H = 16 + c.meters.length * 52 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

export const meterTable = (c: MeterSpec) => mdTable(["項目", "値", "上限", "状態"], c.meters.map((m) => [m.label, num(m.value, c.decimals), num(m.max, c.decimals), { ok: "正常", warn: "注意", bad: "危険" }[severity(m)]]));
