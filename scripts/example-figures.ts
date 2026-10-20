// 構成図の例（docs/figures/example-*.svg）。題材は、小さな Web API の 2 つの実装（A と B）を比べる検証。
// 配置は手で書く。出力は決まっているので、生成し直して差分を検査できる。
// 使い方: npm run figures   /   node scripts/example-figures.ts [出力先]
// 図を足す手順は CLAUDE.md の「図を足す」を参照。
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { arrow, box, frame, group, text } from "./svg-parts.ts";

/** 全体の構成: 負荷生成 → 実装 A と B → 共通の DB。箱・グループ・矢印の使い方の例。 */
export function overview(): string {
  const body = [
    group(16, 56, 188, 128, "負荷生成"),
    box(32, 84, 156, 76, ["負荷生成ツール", "同じ要求を A と B に送る"]),
    group(252, 20, 224, 100, "実装 A"),
    box(268, 44, 192, 62, ["API A", "要求ごとに DB を引く"], "k1"),
    group(252, 128, 224, 100, "実装 B"),
    box(268, 152, 192, 62, ["API B", "結果をキャッシュする"], "k2"),
    group(520, 56, 184, 128, "共通"),
    box(536, 84, 152, 76, ["データベース", "A と B で同じもの"]),
    arrow([188, 112, 220, 112, 220, 75, 268, 75]),
    arrow([188, 132, 220, 132, 220, 183, 268, 183]),
    arrow([460, 75, 492, 75, 492, 112, 536, 112]),
    arrow([460, 183, 492, 183, 492, 132, 536, 132]),
    text(16, 262, "矢印は、要求の向き。A と B は同じ DB を引く。", "ink2", 11, "start"),
  ].join("");
  return frame("全体の構成（例）", "負荷生成ツールが API A と API B に同じ要求を送り、両方が同じデータベースを引く。", 276, body);
}

/** 処理の流れ: 左から右への段と、補足の注記。矢印の上のラベルの使い方の例。 */
export function pipeline(): string {
  const body = [
    box(24, 76, 168, 56, ["src/app.ts", "共通のアプリ"]),
    box(264, 24, 192, 56, ["src/entry-a.ts", "実装 A の入口"], "k1"),
    box(264, 128, 192, 56, ["src/entry-b.ts", "実装 B の入口"], "k2"),
    box(528, 24, 168, 56, ["dist/a", "A の成果物"], "k1"),
    box(528, 128, 168, 56, ["dist/b", "B の成果物"], "k2"),
    arrow([192, 96, 228, 96, 228, 52, 264, 52]),
    arrow([192, 112, 228, 112, 228, 156, 264, 156]),
    arrow([456, 52, 528, 52]),
    arrow([456, 156, 528, 156]),
    text(492, 44, "bundle", "ink2", 11),
    text(492, 148, "bundle", "ink2", 11),
    text(24, 214, "両方を同じ設定でまとめる。版（コミット）は、このときに埋め込む。", "ink2", 11, "start"),
  ].join("");
  return frame("成果物のビルド（例）", "共通のアプリを、A 用と B 用の入口からまとめ、dist/a と dist/b を作る。", 232, body);
}

export const figures = (): Record<string, string> => ({
  "example-overview.svg": overview(),
  "example-pipeline.svg": pipeline(),
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = process.argv[2] ?? "docs/figures";
  mkdirSync(outDir, { recursive: true });
  for (const [name, svg] of Object.entries(figures())) {
    writeFileSync(path.join(outDir, name), svg);
    console.log(`wrote ${path.join(outDir, name)}`);
  }
}
