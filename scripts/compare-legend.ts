// 比較図の凡例: ＋追加、−削除、変更なし。記号と色を併記する。
import { r1, text } from "./svg-parts.ts";
import { badge } from "./grid.ts";

export function legendRow(x: number, y: number): string {
  return (
    badge(x + 8, y + 5, "add") + text(x + 24, y + 9, "追加", "ink", 12, "start") +
    badge(x + 84, y + 5, "remove") + text(x + 100, y + 9, "削除（破線）", "ink", 12, "start") +
    `<rect class="box" x="${r1(x + 200)}" y="${y - 1}" width="16" height="12" rx="3"/>` + text(x + 222, y + 9, "変更なし", "ink", 12, "start")
  );
}
