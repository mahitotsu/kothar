// 文書の検査の CLI。リンクとアンカーの行き先、表の幅、読み手の行、埋め残しの <…>、図（title、ダーク対応、仕様との一致）を調べる。
// 使い方: node check-docs.ts [--max-cols N] [--max-sentence N] [--allow-placeholders] [--strict] [パス…]   パスは Markdown かディレクトリ。省略時は README.md と docs/
// 誤りは `file:line 内容`、警告（長い文、曖昧語、要旨の長さ、曖昧な見出し、AI を主語にした文、desc のない図）は `file:line 警告 内容` で出す。
// 警告は、直前の行（または行末）に `<!-- check-docs: 残す 理由 -->` を置くと、その行の分を抑えられる。理由は必須。誤りは抑えられない。
// 誤りが 1 件でもあれば exit 1。警告は、--strict のときだけ exit 1。
import { pathToFileURL } from "node:url";
import { checkDocs, collectMarkdown, warnDocsDetailed } from "./doc-checks.ts";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const paths: string[] = [];
  let maxCols = 5;
  let maxSentence = 80;
  let allowPlaceholders = false;
  let strict = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max-cols") maxCols = Number(args[++i]);
    else if (args[i] === "--max-sentence") maxSentence = Number(args[++i]);
    else if (args[i] === "--allow-placeholders") allowPlaceholders = true;
    else if (args[i] === "--strict") strict = true;
    else paths.push(args[i]);
  }
  const files = collectMarkdown(paths.length ? paths : ["README.md", "docs"]);
  if (files.length === 0) {
    console.error("検査する Markdown がない");
    process.exit(2);
  }
  const problems = checkDocs(files, { maxCols, allowPlaceholders });
  const { warnings, suppressed } = warnDocsDetailed(files, { maxSentence });
  for (const p of [...problems, ...warnings]) console.error(p);
  console.log(`${files.length} 文書を検査し、誤りは ${problems.length} 件、警告は ${warnings.length} 件${suppressed ? `（理由つきで抑制 ${suppressed} 件）` : ""}`);
  process.exit(problems.length || (strict && warnings.length) ? 1 : 0);
}
