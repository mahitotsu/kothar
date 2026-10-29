// 構成図の仕様（JSON）から SVG を作る。部品は svg-parts.ts。配置は仕様に手で書く。同じ入力なら同じ出力。
import { arrow, box, frame, group, text } from "./svg-parts.ts";

export type Part =
  | { box: [number, number, number, number]; lines: string[]; cls?: "box" | "k1" | "k2" }
  | { group: [number, number, number, number]; label: string }
  | { arrow: number[]; dashed?: boolean; dotted?: boolean }
  | { text: [number, number]; value: string; cls?: string; size?: number; anchor?: "start" | "middle" | "end" };

export interface DiagramSpec {
  kind: "diagram";
  title: string;
  desc: string;
  height: number;
  parts: Part[];
}

function part(p: Part): string {
  if ("box" in p) return box(...p.box, p.lines, p.cls);
  if ("group" in p) return group(...p.group, p.label);
  if ("arrow" in p) {
    if (p.dashed && p.dotted) throw new Error(`矢印に dashed と dotted の両方がある: ${JSON.stringify(p.arrow)}`);
    return arrow(p.arrow, p.dashed, p.dotted ? "dot" : "");
  }
  if ("text" in p) return text(p.text[0], p.text[1], p.value, p.cls ?? "ink2", p.size ?? 11, p.anchor ?? "start");
  throw new Error(`知らない部品: ${JSON.stringify(p)}`);
}

export const diagram = (s: DiagramSpec): string => frame(s.title, s.desc, s.height, s.parts.map(part).join(""));
