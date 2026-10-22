// 図の CLI。仕様（*.fig.json）の隣に、同じ名前の .svg を書く。
// 使い方: node figure.ts <x.fig.json…>        SVG を書く
//         node figure.ts --check <x.fig.json…> 書かずに、隣の .svg が生成物と一致するか調べる（違えば exit 1）
//         SVG を書くとき、矢印の交差などの警告を標準エラーに出す。--check は、警告があっても exit 1 にする。
//         node figure.ts --arrange <x.fig.json> 格子の図（grid）の row と col を、交差が減るよう自動で入れ替えて、仕様を書き換える
//         node figure.ts --table <x.fig.json>  図のデータを Markdown の表（表の双子）にして標準出力へ。構成図など、表にできない図は exit 1
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { arrange } from "./arrange.ts";
import { figureTable, lintFigure, renderFigure, type FigureSpec } from "./render-figure.ts";

export const svgPath = (spec: string) => spec.replace(/\.fig\.json$/, ".svg");

const load = (specFile: string) => JSON.parse(readFileSync(specFile, "utf8")) as FigureSpec;

export function generate(specFile: string): string {
  try {
    return renderFigure(load(specFile));
  } catch (e) {
    throw new Error(`${specFile}: ${(e as Error).message}`);
  }
}

/** 配置の警告（矢印の交差など）。仕様の row と col を直して、0 件にする。 */
export const lintOf = (specFile: string): string[] => lintFigure(load(specFile)).map((w) => `${specFile}: 警告 ${w}`);

/** 表の双子（Markdown）。表にできない図は null。 */
export const tableOf = (specFile: string): string | null => figureTable(load(specFile));

/** 隣の .svg が生成物と違う（またはない）仕様ファイルを返す。 */
export function stale(specFiles: string[]): string[] {
  return specFiles.filter((f) => !existsSync(svgPath(f)) || readFileSync(svgPath(f), "utf8") !== generate(f));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args[0] === "--arrange") {
    const spec = load(args[1]);
    if (spec.kind !== "grid") {
      console.error(`${args[1]}: --arrange は、kind が grid の図だけ`);
      process.exit(2);
    }
    const r = arrange(spec);
    writeFileSync(args[1], JSON.stringify(r.spec, null, 2) + "\n");
    console.log(`${args[1]}: 警告 ${r.before} 件 → ${r.after} 件`);
    for (const w of lintOf(args[1])) console.error(w);
    process.exit(r.after ? 1 : 0);
  }
  if (args[0] === "--table") {
    const t = tableOf(args[1]);
    if (t === null) {
      console.error(`${args[1]} は表にできない図（構成図、流れの図など）。図の要点を、文章で書く`);
      process.exit(1);
    }
    console.log(t);
    process.exit(0);
  }
  const check = args[0] === "--check";
  const files = check ? args.slice(1) : args;
  if (files.length === 0) {
    console.error("使い方: figure.ts [--check] <x.fig.json…>");
    process.exit(2);
  }
  if (check) {
    const bad = stale(files);
    for (const f of bad) console.error(`${svgPath(f)} が ${f} の生成物と違う（npm run figures で作り直す）`);
    const warnings = files.flatMap(lintOf);
    for (const w of warnings) console.error(w);
    process.exit(bad.length || warnings.length ? 1 : 0);
  }
  for (const f of files) {
    writeFileSync(svgPath(f), generate(f));
    console.log(`wrote ${svgPath(f)}`);
    for (const w of lintOf(f)) console.error(w);
  }
}
