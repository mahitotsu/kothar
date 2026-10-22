// 図の CLI。仕様（*.fig.json）の隣に、同じ名前の .svg を書く。
// 使い方: node figure.ts <x.fig.json…>        SVG を書く
//         node figure.ts --check <x.fig.json…> 書かずに、隣の .svg が生成物と一致するか調べる（違えば exit 1）
//         node figure.ts --table <x.fig.json>  図のデータを Markdown の表（表の双子）にして標準出力へ。構成図など、表にできない図は exit 1
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { figureTable, renderFigure, type FigureSpec } from "./render-figure.ts";

export const svgPath = (spec: string) => spec.replace(/\.fig\.json$/, ".svg");

const load = (specFile: string) => JSON.parse(readFileSync(specFile, "utf8")) as FigureSpec;

export function generate(specFile: string): string {
  try {
    return renderFigure(load(specFile));
  } catch (e) {
    throw new Error(`${specFile}: ${(e as Error).message}`);
  }
}

/** 表の双子（Markdown）。表にできない図は null。 */
export const tableOf = (specFile: string): string | null => figureTable(load(specFile));

/** 隣の .svg が生成物と違う（またはない）仕様ファイルを返す。 */
export function stale(specFiles: string[]): string[] {
  return specFiles.filter((f) => !existsSync(svgPath(f)) || readFileSync(svgPath(f), "utf8") !== generate(f));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
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
    process.exit(bad.length ? 1 : 0);
  }
  for (const f of files) {
    writeFileSync(svgPath(f), generate(f));
    console.log(`wrote ${svgPath(f)}`);
  }
}
