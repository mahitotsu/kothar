// 検証 0004：同梱するフォントの候補を比べ、図に使う字だけを抜き出したフォント（サブセット）を SVG に埋め込めるかを確かめる。
// 実行: node spikes/font-metrics/measure.ts <フォントを置いたディレクトリ>
// フォントは https://github.com/google/fonts の ofl/ から取る（ファイルはコミットしない）。
//   <ディレクトリ>/notosansjp/NotoSansJP[wght].ttf
//   <ディレクトリ>/bizudpgothic/BIZUDPGothic-Regular.ttf
//   <ディレクトリ>/ibmplexsansjp/IBMPlexSansJP-Regular.ttf

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as fontkit from "fontkit";
import { draw } from "../../packages/core/src/index.ts";
import { textWidth } from "../../packages/core/src/text.ts";

const dir = process.argv[2];
if (!dir) throw new Error("フォントを置いたディレクトリを指定する");
const ROOT = join(import.meta.dirname, "..", "..");

const candidates: { name: string; file: string; weight?: number }[] = [
  { name: "Noto Sans JP（既定の太さ）", file: "notosansjp/NotoSansJP[wght].ttf" },
  { name: "Noto Sans JP（太さ 400）", file: "notosansjp/NotoSansJP[wght].ttf", weight: 400 },
  { name: "BIZ UDPGothic", file: "bizudpgothic/BIZUDPGothic-Regular.ttf" },
  { name: "IBM Plex Sans JP", file: "ibmplexsansjp/IBMPlexSansJP-Regular.ttf" },
];

// JIS X 0208 の字（EUC-JP の2バイトの範囲をすべて読み、読めた字）
function jisX0208(): { kanji1: string[]; kanji2: string[]; other: string[] } {
  const dec = new TextDecoder("euc-jp", { fatal: true });
  const out = { kanji1: [] as string[], kanji2: [] as string[], other: [] as string[] };
  for (let a = 0xa1; a <= 0xfe; a++)
    for (let b = 0xa1; b <= 0xfe; b++) {
      let c: string;
      try {
        c = dec.decode(new Uint8Array([a, b]));
      } catch {
        continue;
      }
      if (c === "�" || c.length !== 1) continue;
      (a >= 0xb0 && a <= 0xcf ? out.kanji1 : a >= 0xd0 && a <= 0xf4 ? out.kanji2 : out.other).push(c);
    }
  return out;
}

// 体験の例とベンチマークの図で使う文字列（ノード、線、グループ、領域の名前）
async function labels(): Promise<{ nodes: string[]; all: string[] }> {
  const models = ["benchmarks/sample-arch/model.yaml", "docs/experience/X02/model.yaml", "docs/experience/X06/model-after.yaml", "docs/experience/X07/model.yaml"];
  const nodes = new Set<string>();
  const all = new Set<string>();
  for (const m of models) {
    const d = await draw(join(ROOT, m));
    for (const n of d.input.model.nodes) (nodes.add(n.label), all.add(n.label));
    for (const e of d.input.model.edges) if (e.label) all.add(e.label);
    for (const g of d.input.model.groups ?? []) all.add(g.label);
    for (const r of d.input.grammar.regions) if (r.label) all.add(r.label);
  }
  return { nodes: [...nodes], all: [...all] };
}

const jis = jisX0208();
const { nodes, all } = await labels();
const usedChars = [...new Set([...all.join("")])].sort().join("");
console.log(`EUC-JP の2バイトの字：第1水準の漢字 ${jis.kanji1.length} 字、第2水準の漢字 ${jis.kanji2.length} 字、それ以外 ${jis.other.length} 字`);
console.log(`例の図で使う字：${[...usedChars].length} 字\n`);

console.log("| フォント | ファイルの大きさ（KB） | SHA-256（先頭12桁） | 字形の数 | 可変軸 | 第1水準 | 第2水準 | それ以外 | ノードのラベルの幅の見積もりとの差の最大（px） | サブセットの大きさ（KB） | 同じプロセスで2回作ったサブセット |");
console.log("| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |");
for (const c of candidates) {
  const buf = readFileSync(join(dir, c.file));
  const file = fontkit.create(buf) as fontkit.Font;
  // 可変フォントは、指定した太さの実体を取り出して測る
  const font = c.weight ? (file.getVariation({ wght: c.weight }) as fontkit.Font) : file;
  const has = (ch: string) => font.hasGlyphForCodePoint(ch.codePointAt(0)!);
  const cover = (list: string[]) => `${list.filter(has).length}/${list.length}`;
  const axes = Object.entries(file.variationAxes ?? {}).map(([k, a]: [string, any]) => `${k}（${a.min}〜${a.max}、既定 ${a.default}）`).join(",") || "なし";
  // 13px で描いたときのノードのラベルの幅と、今の見積もり（全角 1em、半角 0.6em）の差
  const width = (s: string) => (font.layout(s).advanceWidth / font.unitsPerEm) * 13;
  const diff = Math.max(...nodes.map((s) => Math.abs(width(s) - textWidth(s, 13))));
  let subset = "失敗";
  let same = "—";
  try {
    const make = () => {
      const sub = font.createSubset();
      for (const g of font.glyphsForString(usedChars)) sub.includeGlyph(g);
      return Buffer.from(sub.encode());
    };
    const [a, b] = [make(), make()];
    subset = `${(a.length / 1024).toFixed(1)}（SHA-256 ${createHash("sha256").update(a).digest("hex").slice(0, 12)}）`;
    same = a.equals(b) ? "一致" : "不一致";
  } catch (err) {
    subset = `失敗（${(err as Error).message.split("\n")[0]}）`;
  }
  const sha = createHash("sha256").update(buf).digest("hex").slice(0, 12);
  console.log(`| ${c.name} | ${(buf.length / 1024).toFixed(0)} | ${sha} | ${font.numGlyphs} | ${axes} | ${cover(jis.kanji1)} | ${cover(jis.kanji2)} | ${cover(jis.other)} | ${diff.toFixed(1)} | ${subset} | ${same} |`);
}
