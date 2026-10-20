// 文書の検査の部品。test/docs.test.ts が使う。リンクとアンカー、表の幅、読み手の行を調べる。
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const text = (f: string) => readFileSync(f, "utf8");

/** GitHub が見出しから作るアンカー: 小文字にし、記号を除き、空白をハイフンにする。 */
export function slug(heading: string): string {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");
}

/** コードブロックの外の行だけを、行番号つきで返す。 */
function proseLines(f: string): { line: string; no: number }[] {
  const out: { line: string; no: number }[] = [];
  let fence = false;
  text(f).split("\n").forEach((line, i) => {
    if (line.startsWith("```")) fence = !fence;
    else if (!fence) out.push({ line, no: i + 1 });
  });
  return out;
}

export function anchors(f: string): Set<string> {
  const out = new Set<string>();
  for (const { line } of proseLines(f)) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (m) out.add(slug(m[1]));
  }
  return out;
}

/** 相対リンクとアンカーのうち、行き先がないものを返す。 */
export function brokenLinks(f: string): string[] {
  const broken: string[] = [];
  for (const { line, no } of proseLines(f)) {
    for (const m of line.replace(/`[^`]*`/g, "").matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)) {
      const target = m[1];
      if (/^(https?:|mailto:)/.test(target)) continue;
      const [rel, anchor] = target.split("#");
      const dest = rel ? path.normalize(path.join(path.dirname(f), rel)) : f;
      if (!existsSync(dest)) broken.push(`${f}:${no} -> ${target} (ファイルがない)`);
      else if (anchor && dest.endsWith(".md") && !anchors(dest).has(decodeURIComponent(anchor))) broken.push(`${f}:${no} -> ${target} (見出しがない)`);
    }
  }
  return broken;
}

/** 列が max を超える表の行を返す。 */
export function wideTables(f: string, max = 5): string[] {
  const wide: string[] = [];
  for (const { line, no } of proseLines(f)) {
    if (!line.startsWith("|")) continue;
    const cols = line.replace(/\\\|/g, "").split("|").length - 2;
    if (cols > max) wide.push(`${f}:${no} は ${cols} 列`);
  }
  return wide;
}

/** 冒頭 n 行に「読み手」があるか（読み手の行）。 */
export function hasReaderLine(f: string, n = 14): boolean {
  return text(f).split("\n").slice(0, n).join("\n").includes("読み手");
}

/** 冒頭 n 行に、指定の見出しがあるか。 */
export function headHas(f: string, needle: string, n = 14): boolean {
  return text(f).split("\n").slice(0, n).join("\n").includes(needle);
}
