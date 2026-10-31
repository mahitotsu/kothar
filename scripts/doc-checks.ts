// 文書の検査の部品。check-docs.ts（CLI）と test/ が使う。リンクとアンカー、表の幅、読み手の行、埋め残し、図を調べる。
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { generate, lintOf, svgPath } from "./figure.ts";

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
    const m = line.replace(/`[^`]*`/g, "").replace(/<!--.*?-->/g, "").match(/<[^<>\n]*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}][^<>\n]*>/u);
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

/** 文書が参照する図の仕様の、配置の警告（矢印の交差など）。 */
export function figureLayout(f: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { line, no } of proseLines(f)) {
    for (const m of line.replace(/`[^`]*`/g, "").matchAll(/!?\[[^\]]*\]\(([^)\s#]+\.svg)\)/g)) {
      const spec = path.normalize(path.join(path.dirname(f), m[1])).replace(/\.svg$/, ".fig.json");
      if (seen.has(spec) || !existsSync(spec)) continue;
      seen.add(spec);
      out.push(...lintOf(spec).map((w) => `${f}:${no} ${w}`));
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

/** 検査の対象にする本文の行から、記号と、検査の対象外の部分（コード、リンクの行き先、URL、タグ、埋め残し）を除く。 */
function plain(line: string): string {
  return line
    .replace(/`[^`]*`/g, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/<[^<>\n]*[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}][^<>\n]*>/gu, "□")
    .replace(/<\/?[a-z][^>]*>/gi, "")
    .replace(/[*_]{1,2}/g, "")
    .replace(/^\s*(?:[-*]|\d+\.)\s+/, "")
    .trim();
}

/** 見出しの文字から、番号（`1.` `2-1.` `A.`）を除く。 */
const headingText = (h: string) => h.replace(/^(?:\d+(?:-\d+)*|[A-Z])\.\s*/, "").trim();

/** 本文の文（句点で区切る）と、その行番号。frontmatter、`<details>` の中（出典の引用を並べる根拠）、表、見出しは、対象にしない。 */
function sentences(f: string): { sentence: string; no: number }[] {
  const out: { sentence: string; no: number }[] = [];
  const lines = proseLines(f);
  let front = lines[0]?.line === "---";
  let details = false;
  lines.forEach(({ line, no }, i) => {
    if (front) {
      if (i > 0 && line === "---") front = false;
      return;
    }
    if (/<details>/.test(line)) details = true;
    if (/<\/details>/.test(line)) details = false;
    if (details || line.startsWith("|") || line.startsWith("#")) return;
    for (const sentence of plain(line).split(/[。！？]/)) if (sentence.trim()) out.push({ sentence, no });
  });
  return out;
}

/** 長い文（既定は 80 字超）。公用文は、50〜60 字で読みにくくなっていないかを意識するよう述べる。警告は余裕を見る。 */
export function longSentences(f: string, max = 80): string[] {
  const out: string[] = [];
  for (const { sentence, no } of sentences(f)) {
    const n = [...sentence.replace(/\s/g, "")].length;
    if (n > max) out.push(`${f}:${no} 警告 ${n} 字の文がある（目安は ${max} 字以内）: ${sentence.slice(0, 20)}…`);
  }
  return out;
}

/** かぎかっこの中（語を例として挙げる引用）を除く。 */
const unquote = (s: string) => s.replace(/「[^」]*」/g, "「」");

/** 冗長な表現（textlint の ja-no-redundant-expression）。「を行う」「を実施する」は、Kothar の判断で足した。かぎかっこの中は対象にしない。 */
const REDUNDANT = /することができ|することが可能|を行[うい]|を行っ|を実施[すし]/g;
export function redundantPhrases(f: string): string[] {
  const out: string[] = [];
  for (const { sentence, no } of sentences(f)) {
    for (const m of unquote(sentence).matchAll(REDUNDANT)) out.push(`${f}:${no} 警告 冗長な表現「${m[0]}」（動詞で書く。「〜できる」「〜する」）`);
  }
  return out;
}

/** 1 文に 2 つ以上の逆接の「が」（textlint の no-doubled-conjunctive-particle-ga）。形態素解析をしないので、活用語尾か「です」「ます」に続く「が、」だけを数える。 */
const CONJ_GA = /(?:[るたいだすう]|です|ます)が、/g;
export function doubledGa(f: string): string[] {
  const out: string[] = [];
  for (const { sentence, no } of sentences(f)) {
    if ((sentence.match(CONJ_GA) ?? []).length >= 2) out.push(`${f}:${no} 警告 逆接の「が」が 1 文に 2 つある（文を分ける）: ${sentence.slice(0, 20)}…`);
  }
  return out;
}

/** 誇張の語（textlint の ai-writing の no-ai-hype-expressions、no-ai-emphasis-patterns）。かぎかっこの中は対象にしない。 */
const HYPE = /非常に|極めて|圧倒的|革新的|革命的|画期的|劇的|飛躍的|驚くほど|完璧|シームレス/g;
export function hypeWords(f: string): string[] {
  const out: string[] = [];
  for (const { sentence, no } of sentences(f)) {
    for (const m of unquote(sentence).matchAll(HYPE)) out.push(`${f}:${no} 警告 誇張の語「${m[0]}」（数値か事実で書く）`);
  }
  return out;
}

/** 述語で終わり、後ろにブロックが続くコロン（textlint の ai-writing の no-ai-colon-continuation）。「使い方:」のような名詞のコロンは対象にしない。 */
const PREDICATE_COLON = /(?:ます|です|する|した|ない|れる|せる|ください)\s*[:：]$/;
export function englishColon(f: string): string[] {
  const out: string[] = [];
  for (const { line, no } of proseLines(f)) {
    if (line.startsWith("|") || line.startsWith("#")) continue;
    if (PREDICATE_COLON.test(plain(line))) out.push(`${f}:${no} 警告 述語のあとのコロン（英語の構文。「次のとおり。」などで文を閉じる）`);
  }
  return out;
}

/** 曖昧語と逃げ道の語（INCOSE の R7、R8）。「など」「等」は誤検知が多いので対象にしない。 */
const VAGUE = /適切(?:に|な)|適宜|なるべく|できるだけ|可能な限り|必要に応じて|場合によっては|十分(?:に|な)|迅速|柔軟|簡単に|フレンドリ|高速|概ね|おおむね|ある程度/g;
export function vagueWords(f: string): string[] {
  const out: string[] = [];
  for (const { line, no } of proseLines(f)) {
    for (const m of plain(line).matchAll(VAGUE)) out.push(`${f}:${no} 警告 曖昧な語「${m[0]}」（数値か条件に置き換える）`);
  }
  return out;
}

/** 「## 要旨」の箇条書きが、3〜5 項目の外にある。 */
export function summaryLength(f: string, min = 3, max = 5): string[] {
  const lines = proseLines(f);
  const start = lines.findIndex((l) => /^##\s+要旨\s*$/.test(l.line));
  if (start < 0) return [];
  let n = 0;
  for (const { line } of lines.slice(start + 1)) {
    if (/^#{1,6}\s/.test(line)) break;
    if (/^[-*]\s/.test(line)) n++;
  }
  return n > 0 && (n < min || n > max) ? [`${f}:${lines[start].no} 警告 要旨が ${n} 項目（${min}〜${max} 項目にする）`] : [];
}

const VAGUE_HEADINGS = new Set(["概要", "その他", "一般", "範囲", "補足", "備考", "まとめ", "全般", "雑記"]);
/** 言いたいことを書いていない見出し。 */
export function vagueHeadings(f: string): string[] {
  const out: string[] = [];
  for (const { line, no } of proseLines(f)) {
    const m = /^#{1,6}\s+(.*)$/.exec(line);
    if (m && VAGUE_HEADINGS.has(headingText(m[1]))) out.push(`${f}:${no} 警告 見出し「${m[1].trim()}」が曖昧（言いたいことを書く）`);
  }
  return out;
}

/** 一人称や AI の名前を主語にした文。 */
const AI_SUBJECT = /(?:^|[。、\s「（(])(?:私は|私が|わたしは|Claude(?:が|は)|AI(?:が|は)|ユーザー確認済み)/;
export function aiSubject(f: string): string[] {
  const out: string[] = [];
  for (const { line, no } of proseLines(f)) {
    const m = AI_SUBJECT.exec(plain(line));
    if (m) out.push(`${f}:${no} 警告 AI や一人称を主語にしている「${m[0].trim()}」`);
  }
  return out;
}

/** 読み上げ用の説明（desc）がない図、または 10 字未満の図。要点を書く欄なので、短すぎるものは足りない。 */
export function figureWithoutDesc(f: string): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { line, no } of proseLines(f)) {
    for (const m of line.replace(/`[^`]*`/g, "").matchAll(/!?\[[^\]]*\]\(([^)\s#]+\.svg)\)/g)) {
      const svg = path.normalize(path.join(path.dirname(f), m[1]));
      if (seen.has(svg) || !existsSync(svg)) continue;
      seen.add(svg);
      const d = /<desc[^>]*>([^<]*)<\/desc>/.exec(text(svg));
      if (!d) out.push(`${f}:${no} 警告 ${m[1]} に <desc> がない`);
      else if ([...d[1].trim()].length < 10) out.push(`${f}:${no} 警告 ${m[1]} の <desc> が短い（図の要点を書く）`);
    }
  }
  return out;
}

export interface CheckOptions {
  maxCols?: number;
  allowPlaceholders?: boolean;
  /** 長い文の目安（字）。 */
  maxSentence?: number;
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

/** 警告の抑制: `<!-- check-docs: 残す 理由 -->`。単独の行なら次の空でない行、行末なら、その行の警告を抑える。理由がなければ抑えず、警告にする。 */
const SUPPRESS = /<!--\s*check-docs:\s*残す(?:\s+(.*?))?\s*-->/;
export function suppressions(f: string): { lines: Set<number>; problems: string[] } {
  const lines = new Set<number>();
  const problems: string[] = [];
  const prose = proseLines(f);
  prose.forEach(({ line, no }, i) => {
    const m = SUPPRESS.exec(line);
    if (!m) return;
    if (!m[1]?.trim()) {
      problems.push(`${f}:${no} 警告 抑制に理由がない（\`<!-- check-docs: 残す 理由 -->\` の形で書く）`);
      return;
    }
    if (line.replace(SUPPRESS, "").trim()) lines.add(no);
    else {
      const next = prose.slice(i + 1).find((l) => l.line.trim());
      if (next) lines.add(next.no);
    }
  });
  return { lines, problems };
}

/** 警告（規則の目安。誤検知がありうる）を `file:line 警告 内容` で返す。抑制された警告は除き、その件数を添える。 */
export function warnDocsDetailed(files: string[], opt: CheckOptions = {}): { warnings: string[]; suppressed: number } {
  const warnings: string[] = [];
  let suppressed = 0;
  for (const f of files) {
    const found = [...longSentences(f, opt.maxSentence ?? 80), ...vagueWords(f), ...summaryLength(f), ...vagueHeadings(f), ...redundantPhrases(f), ...doubledGa(f), ...hypeWords(f), ...englishColon(f), ...figureWithoutDesc(f), ...figureLayout(f)];
    if (!instructionFile.test(f)) found.push(...aiSubject(f));
    const { lines, problems } = suppressions(f);
    for (const w of found) {
      if (lines.has(Number(w.slice(f.length + 1).split(" ")[0]))) suppressed++;
      else warnings.push(w);
    }
    warnings.push(...problems);
  }
  return { warnings, suppressed };
}

export function warnDocs(files: string[], opt: CheckOptions = {}): string[] {
  return warnDocsDetailed(files, opt).warnings;
}
