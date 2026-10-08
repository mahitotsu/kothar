#!/usr/bin/env node
// kothar render / lint / check（S-CLI-1、S-CLI-2）。
// 終了コード：0 は成功、1 は検査の違反か図の食い違い、2 は使い方か入力の誤り。

import { readFileSync, writeFileSync } from "node:fs";
import { InputError, RULES, draw, type Violation } from "@kothar/core";

const USAGE = `使い方:
  kothar render <モデル> --out <SVG のパス>   図を描き、SVG と配置の結果の JSON を書く
  kothar lint <モデル>                         配置を作り、文法の規則で検査する
  kothar check <モデル> <SVG のパス>           SVG が、モデルから描いた図と同じかを確かめる

  どのコマンドにも --grammar <文法のパス> を付けられる。モデルが参照する文法の代わりに、その文法で描く`;

// --name <値> の形の引数を取り出し、残りの引数とあわせて返す
function option(args: string[], name: string): [string | undefined, string[]] {
  const at = args.indexOf(name);
  if (at < 0) return [undefined, args];
  return [args[at + 1], args.filter((_, i) => i !== at && i !== at + 1)];
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

const jsonPathOf = (svgPath: string) => (svgPath.endsWith(".svg") ? svgPath.slice(0, -4) : svgPath) + ".json";

function report(violations: Violation[]): string {
  if (!violations.length) return "違反は0件です。";
  const lines = violations.map((v) => `- 規則${v.rule}（${RULES[v.rule]}）：${v.message}${v.pinned ? "（ピン留めしたノードを含む）" : ""}`);
  return `違反が${violations.length}件あります。\n${lines.join("\n")}`;
}

async function main(args: string[]): Promise<number> {
  const [command, ...given] = args;
  const [grammar, rest0] = option(given, "--grammar");
  if (given.includes("--grammar") && !grammar) fail(USAGE);
  if (command === "render") {
    const [out, rest] = option(rest0, "--out");
    const model = rest[0];
    if (!model || !out) fail(USAGE);
    const d = await draw(model, undefined, grammar);
    writeFileSync(out, d.svg);
    writeFileSync(jsonPathOf(out), d.json);
    const pinned = d.layout.nodes.filter((n) => n.pinned).map((n) => n.id);
    console.log(`${out} と ${jsonPathOf(out)} を書きました。`);
    console.log(`ピン留め：${pinned.length}件${pinned.length ? `（${pinned.join("、")}）` : ""}`);
    return 0;
  }
  if (command === "lint") {
    const [model] = rest0;
    if (!model) fail(USAGE);
    const d = await draw(model, undefined, grammar);
    console.log(report(d.violations));
    return d.violations.length ? 1 : 0;
  }
  if (command === "check") {
    const [model, svgPath] = rest0;
    if (!model || !svgPath) fail(USAGE);
    let committed: string;
    try {
      committed = readFileSync(svgPath, "utf8");
    } catch {
      fail(`${svgPath}: ファイルを読めません。`);
    }
    const d = await draw(model, undefined, grammar);
    if (committed === d.svg) {
      console.log(`${svgPath} は、モデルから描いた図と一致しています。`);
      return 0;
    }
    console.log(`${svgPath} は、モデルから描いた図と一致しません。次のコマンドで描き直してください。\n  kothar render ${model}${grammar ? ` --grammar ${grammar}` : ""} --out ${svgPath}`);
    return 1;
  }
  fail(USAGE);
}

try {
  process.exitCode = await main(process.argv.slice(2));
} catch (err) {
  if (err instanceof InputError) {
    console.error(`入力に誤りがあります。\n${err.problems.map((p) => `- ${p}`).join("\n")}`);
    process.exitCode = 2;
  } else throw err;
}
