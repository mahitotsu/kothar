// シーケンス図。参加者が横、時間が上から下。呼び出しは実線と塗りの矢じり、戻りは破線と開いた矢じり。同じ入力なら同じ出力。
import { arrow, box, frame, lineLabel, openArrow, r1, text, textWidth, type BoxClass } from "./svg-parts.ts";
import { need } from "./charts-more.ts";

export interface SeqParticipant {
  id: string;
  name: string;
  /** 名前の下の補足（技術、役割）。 */
  sub?: string;
  cls?: BoxClass;
}
export type SeqItem =
  | { from: string; to: string; label: string; type?: "call" | "return" | "self" }
  | { note: { over: string[]; text: string } };
export interface SequenceSpec {
  kind: "sequence";
  title: string;
  desc: string;
  participants: SeqParticipant[];
  items: SeqItem[];
  note?: string;
}

export function sequence(c: SequenceSpec): string {
  need(c.participants.length >= 2, "sequence: participants は 2 つ以上");
  const idx = new Map(c.participants.map((p, i) => [p.id, i]));
  need(idx.size === c.participants.length, "sequence: 参加者の id が重複");
  const ref = (id: string) => {
    need(idx.has(id), `sequence: 参加者「${id}」が participants にない`);
    return idx.get(id) as number;
  };
  const n = c.participants.length;
  const headW = c.participants.map((p) => Math.max(104, textWidth(p.name, 12, 600) + 28, p.sub ? textWidth(p.sub, 11) + 28 : 0));
  // 隣り合う参加者の間隔: 見出しの幅と、メッセージのラベルの幅から決める
  const gap = headW.slice(0, -1).map((w, i) => w / 2 + headW[i + 1] / 2 + 16);
  const msgs = c.items.filter((i): i is Extract<SeqItem, { from: string }> => "from" in i);
  for (const m of msgs) {
    const [a, b] = [ref(m.from), ref(m.to)];
    if (m.type === "self" || a === b) continue;
    const [lo, hi] = [Math.min(a, b), Math.max(a, b)];
    const needW = textWidth(m.label, 12) + 32;
    const have = gap.slice(lo, hi).reduce((s, g) => s + g, 0);
    if (have < needW) gap[hi - 1] += needW - have;
  }
  const xs = [24 + headW[0] / 2];
  gap.forEach((g) => xs.push(xs[xs.length - 1] + g));
  const selfW = Math.max(0, ...msgs.filter((m) => m.type === "self" || m.from === m.to).map((m) => 36 + 8 + textWidth(m.label, 12)));
  const right = Math.max(xs[n - 1] + headW[n - 1] / 2 + 24, xs[n - 1] + selfW + 24);
  const W2 = Math.max(720, Math.ceil(right));
  need(W2 <= 960, `sequence: 図が広すぎる（${W2}px）。参加者かラベルを減らす`);
  const top = 16, headH = 44, step = 40;
  const y0 = top + headH + 30;
  let body = "";
  const rows = c.items.length;
  const bottom = y0 + rows * step + 8;
  c.participants.forEach((p, i) => (body += `<line class="dash" x1="${r1(xs[i])}" x2="${r1(xs[i])}" y1="${top + headH}" y2="${bottom}"/>`));
  c.participants.forEach((p, i) => (body += box(r1(xs[i] - headW[i] / 2), top, headW[i], headH, p.sub ? [p.name, p.sub] : [p.name], p.cls ?? "box")));
  c.items.forEach((it, k) => {
    const y = y0 + k * step;
    if ("note" in it) {
      const ids = it.note.over.map(ref);
      const x1 = xs[Math.min(...ids)] - 8, x2 = xs[Math.max(...ids)] + 8;
      const w = Math.max(x2 - x1, textWidth(it.note.text, 11) + 20);
      const cx = (x1 + x2) / 2;
      need(w <= W2 - 48, `sequence: 注記「${it.note.text}」が広すぎる`);
      body += `<rect class="grp" x="${r1(cx - w / 2)}" y="${y - 14}" width="${r1(w)}" height="26" rx="4"/>` + text(cx, y + 4, it.note.text, "ink2", 11);
      return;
    }
    const [a, b] = [ref(it.from), ref(it.to)];
    const type = it.type ?? (a === b ? "self" : "call");
    if (type === "self" || a === b) {
      const x = xs[a];
      body += arrow([x, y - 6, x + 36, y - 6, x + 36, y + 10, x, y + 10]) + text(x + 44, y + 8, it.label, "ink", 12, "start");
      return;
    }
    const [x1, x2] = [xs[a], xs[b]];
    const [s1, s2] = x2 > x1 ? [x1 + 2, x2 - 2] : [x1 - 2, x2 + 2];
    body += type === "return" ? openArrow([s1, y, s2, y], true) : arrow([s1, y, s2, y]);
    body += text((x1 + x2) / 2, y - 7, it.label, "ink", 12);
  });
  const H = bottom + 16 + (c.note ? 22 : 0);
  if (c.note) body += text(24, H - 10, c.note, "ink2", 11, "start");
  return frame(c.title, c.desc, Math.ceil(H), body, W2);
}
