// 文書の検査の CLI。リンクとアンカーの行き先、表の幅、読み手の行、埋め残しの <…>、図（title、ダーク対応、仕様との一致）を調べる。
// 使い方: node check-docs.ts [--max-cols N] [--allow-placeholders] [パス…]   パスは Markdown かディレクトリ。省略時は README.md と docs/
// 問題は `file:line 内容` で出す。1 件でもあれば exit 1。
import { pathToFileURL } from "node:url";
import { checkDocs, collectMarkdown } from "./doc-checks.ts";

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  const paths: string[] = [];
  let maxCols = 5;
  let allowPlaceholders = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--max-cols") maxCols = Number(args[++i]);
    else if (args[i] === "--allow-placeholders") allowPlaceholders = true;
    else paths.push(args[i]);
  }
  const files = collectMarkdown(paths.length ? paths : ["README.md", "docs"]);
  if (files.length === 0) {
    console.error("検査する Markdown がない");
    process.exit(2);
  }
  const problems = checkDocs(files, { maxCols, allowPlaceholders });
  for (const p of problems) console.error(p);
  console.log(`${files.length} 文書を検査し、問題は ${problems.length} 件`);
  process.exit(problems.length ? 1 : 0);
}
