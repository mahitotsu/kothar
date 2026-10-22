// タイムライン（ロードマップ、ガント）。横軸は日付。期間は棒、節目はひし形。今日は縦線。同じ入力なら同じ出力（実行日に依存しない）。
import { fit, frame, r1, text, textWidth, W } from "./svg-parts.ts";
import { need } from "./charts-more.ts";

export type TimelineItem =
  | { label: string; start: string; end: string; cls?: "s1" | "s2" | "s3" | "gray" }
  | { label: string; date: string; milestone: true };
export interface TimelineSpec {
  kind: "timeline";
  title: string;
  desc: string;
  start: string;
  end: string;
  lanes: { name: string; items: TimelineItem[] }[];
  /** 今日の線。実行日ではなく、図に書く日付。 */
  today?: string;
  note?: string;
}

const DAY = 86400000;
const day = (s: string): number => {
  need(/^\d{4}-\d{2}-\d{2}$/.test(s), `timeline: 日付「${s}」は YYYY-MM-DD で書く`);
  return Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / DAY;
};
const ymd = (d: number) => new Date(d * DAY);

/** 軸の目盛り: 期間の長さで、週・月・四半期を選ぶ。 */
function ticks(d0: number, d1: number): { d: number; label: string }[] {
  const out: { d: number; label: string }[] = [];
  const span = d1 - d0;
  if (span <= 120) {
    for (let d = d0; d <= d1; d += 7) out.push({ d, label: `${ymd(d).getUTCMonth() + 1}/${ymd(d).getUTCDate()}` });
    return out;
  }
  const step = span <= 800 ? 1 : 3;
  const s = ymd(d0);
  let y = s.getUTCFullYear(), m = s.getUTCMonth();
  if (Date.UTC(y, m, 1) / DAY < d0) m++;
  for (; ; m += step) {
    const d = Date.UTC(y, m, 1) / DAY;
    if (d > d1) break;
    const mm = ymd(d).getUTCMonth() + 1;
    out.push({ d, label: out.length === 0 || mm === 1 ? `${ymd(d).getUTCFullYear()}/${mm}` : `${mm}月` });
  }
  return out;
}

const dataOf = (c: TimelineSpec) => c.lanes.flatMap((l) => l.items.map((i) => ({ lane: l.name, ...i })));

export function timeline(c: TimelineSpec): string {
  const [d0, d1] = [day(c.start), day(c.end)];
  need(d1 > d0, "timeline: end は start より後");
  need(c.lanes.length >= 1, "timeline: lanes が空");
  const laneW = Math.min(200, Math.max(...c.lanes.map((l) => textWidth(l.name, 12, 600))) + 16);
  need(Math.max(...c.lanes.map((l) => textWidth(l.name, 12, 600))) <= 200, "timeline: レーンの名前が長すぎる（200px 以内）");
  const x0 = 24 + laneW + 8, x1 = W - 24;
  const xOf = (d: number) => x0 + ((d - d0) / (d1 - d0)) * (x1 - x0);
  const inRange = (s: string) => {
    const d = day(s);
    need(d >= d0 && d <= d1, `timeline: 日付「${s}」が、軸の範囲（${c.start}〜${c.end}）の外`);
    return d;
  };
  if (c.today) inRange(c.today);
  const top = 44, sub = 28;
  // 各レーンで、重なる項目を別の段に積む
  const placed = c.lanes.map((lane) => {
    const rows: { x2: number }[] = [];
    const items = lane.items.map((it) => {
      if ("milestone" in it) {
        const x = xOf(inRange(it.date));
        const lw = textWidth(it.label, 11);
        const fitsRight = x + 10 + lw <= x1;
        const left = fitsRight ? x - 7 : x - 10 - lw, right = fitsRight ? x + 10 + lw : x + 7;
        return { it, x, left, right, inside: false, rightLabel: fitsRight };
      }
      const a = xOf(inRange(it.start)), b = xOf(inRange(it.end));
      need(b >= a, `timeline: 「${it.label}」の end が start より前`);
      const lw = textWidth(it.label, 11);
      const inside = b - a >= lw + 12;
      const outsideRight = !inside && b + 8 + lw <= x1;
      need(inside || outsideRight || a - 8 - lw >= x0, `timeline: 「${it.label}」の名前が、棒にも、棒の脇にも収まらない`);
      const left = inside || outsideRight ? a : a - 8 - lw, right = inside ? b : outsideRight ? b + 8 + lw : b;
      return { it, x: a, x2: b, left, right, inside, rightLabel: outsideRight };
    });
    const order = items.map((p, i) => ({ p, i })).sort((u, v) => u.p.left - v.p.left || u.i - v.i);
    const rowOf = new Map<number, number>();
    for (const { p, i } of order) {
      let r = rows.findIndex((row) => row.x2 + 6 <= p.left);
      if (r < 0) {
        rows.push({ x2: 0 });
        r = rows.length - 1;
      }
      rows[r].x2 = p.right;
      rowOf.set(i, r);
    }
    return { lane, items, rows: rows.length, rowOf };
  });
  const laneH = placed.map((p) => p.rows * sub + 12);
  const bottom = top + laneH.reduce((a, b) => a + b, 0);
  let body = "";
  for (const t of ticks(d0, d1)) {
    const x = xOf(t.d);
    body += `<line class="grid" x1="${r1(x)}" x2="${r1(x)}" y1="${top - 6}" y2="${bottom}"/>` + text(x, top - 12, t.label, "ink2", 11);
  }
  if (c.today) {
    const x = xOf(day(c.today));
    body += `<line class="today" x1="${r1(x)}" x2="${r1(x)}" y1="${top - 6}" y2="${bottom}"/><rect class="bg" x="${r1(x - 16)}" y="${bottom + 4}" width="32" height="16"/>` + text(x, bottom + 16, "今日", "ink", 11, "middle", 600);
  }
  let y = top;
  placed.forEach((p, li) => {
    body += `<line class="axis" x1="24" x2="${x1}" y1="${y}" y2="${y}"/>` + text(24, y + laneH[li] / 2 + 4, p.lane.name, "ink", 12, "start", 600);
    p.items.forEach((q, i) => {
      const cy = y + 6 + p.rowOf.get(i)! * sub + sub / 2;
      if ("milestone" in q.it) {
        body += `<polygon class="ink ring" points="${r1(q.x)},${r1(cy - 8)} ${r1(q.x + 8)},${r1(cy)} ${r1(q.x)},${r1(cy + 8)} ${r1(q.x - 8)},${r1(cy)}"/>`;
        body += q.rightLabel ? text(q.x + 14, cy + 4, q.it.label, "ink", 11, "start") : text(q.x - 14, cy + 4, q.it.label, "ink", 11, "end");
      } else {
        const w = Math.max((q.x2 as number) - q.x, 4);
        body += `<rect class="${q.it.cls ?? "s1"}" x="${r1(q.x)}" y="${r1(cy - 9)}" width="${r1(w)}" height="18" rx="4"/>`;
        if (q.inside) body += text(q.x + w / 2, cy + 4, fit(q.it.label, 11, 400, w - 8, "棒"), "onfill", 11);
        else if (q.rightLabel) body += text((q.x2 as number) + 8, cy + 4, q.it.label, "ink", 11, "start");
        else body += text(q.x - 8, cy + 4, q.it.label, "ink", 11, "end");
      }
    });
    y += laneH[li];
  });
  body += `<line class="axis" x1="24" x2="${x1}" y1="${bottom}" y2="${bottom}"/>`;
  const H = bottom + 34 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, H, body);
}

const mdTable = (head: string[], rows: string[][]) => [`| ${head.join(" | ")} |`, `|${head.map(() => "---").join("|")}|`, ...rows.map((r) => `| ${r.join(" | ")} |`)].join("\n");
export const timelineTable = (c: TimelineSpec) =>
  mdTable(["レーン", "項目", "開始", "終了"], dataOf(c).map((i) => ("milestone" in i ? [i.lane, `${i.label}（節目）`, i.date, i.date] : [i.lane, i.label, i.start, i.end])));
