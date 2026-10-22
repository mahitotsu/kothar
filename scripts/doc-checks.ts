// 文書の検査の部品。check-docs.ts（CLI）と test/ が使う。リンクとアンカー、表の幅、読み手の行、埋め残し、図を調べる。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { generate, svgPath } from "./figure.ts";

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

/** 冒頭 n 行に「読み手」（Audience / Reader）があるか（読み手の行）。 */
export function hasReaderLine(f: string, n = 14): boolean {
  return /読み手|audience|reader/i.test(text(f).split("\n").slice(0, n).join("\n"));
}

/** 埋め残しの `<…>`（日本語を含む山かっこ）を返す。コードブロックとインラインコードは対象外。 */
export function placeholders(f: string): string[] {
  const out: string[] = [];
  for (const { line, no } of proseLines(f)) {
    const m = line.replace(/`[^`]*`/g, "").match(/<[^<>\n]*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}][^<>\n]*>/u);
    if (m) out.push(`${f}:${no} 埋め残し ${m[0]}`);
  }
  return out;
}

/** 文書が参照する SVG の問題を返す: title とダーク対応がない、隣の .fig.json の生成物と違う。 */
export function figureProblems(f: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { line, no } of proseLines(f)) {
    for (const m of line.replace(/`[^`]*`/g, "").matchAll(/!?\[[^\]]*\]\(([^)\s#]+\.svg)\)/g)) {
      const svg = path.normalize(path.join(path.dirname(f), m[1]));
      if (seen.has(svg) || !existsSync(svg)) continue;
      seen.add(svg);
      const body = text(svg);
      if (!body.includes("<title")) out.push(`${f}:${no} ${m[1]} に <title> がない`);
      if (!body.includes("prefers-color-scheme: dark")) out.push(`${f}:${no} ${m[1]} がダーク表示に対応していない`);
      const spec = svg.replace(/\.svg$/, ".fig.json");
      if (existsSync(spec) && generate(spec) !== body) out.push(`${f}:${no} ${m[1]} が ${path.basename(spec)} の生成物と違う`);
    }
  }
  return out;
}

/** 指定のファイルとディレクトリ（再帰）から、Markdown を集める。 */
export function collectMarkdown(paths: string[]): string[] {
  const out: string[] = [];
  const walk = (p: string) => {
    if (!existsSync(p)) return;
    if (statSync(p).isDirectory()) {
      for (const e of readdirSync(p).sort()) if (e !== "node_modules" && !e.startsWith(".")) walk(path.join(p, e));
    } else if (p.endsWith(".md")) out.push(p);
  };
  paths.forEach(walk);
  return out;
}

export interface CheckOptions {
  maxCols?: number;
  allowPlaceholders?: boolean;
}

/** CLAUDE.md など、読み手の行を求めない指示書。 */
const instructionFile = /(^|\/)(CLAUDE|AGENTS|SKILL)\.md$/;

/** 文書の組に、すべての検査をかけ、問題を `file:line 内容` で返す。 */
export function checkDocs(files: string[], opt: CheckOptions = {}): string[] {
  const problems: string[] = [];
  for (const f of files) {
    problems.push(...brokenLinks(f), ...wideTables(f, opt.maxCols ?? 5), ...figureProblems(f));
    if (!opt.allowPlaceholders) problems.push(...placeholders(f));
    if (!instructionFile.test(f) && !hasReaderLine(f)) problems.push(`${f}:1 冒頭 14 行に「読み手」がない`);
  }
  return problems;
}

/** 冒頭 n 行に、指定の見出しがあるか。 */
export function headHas(f: string, needle: string, n = 14): boolean {
  return text(f).split("\n").slice(0, n).join("\n").includes(needle);
}
