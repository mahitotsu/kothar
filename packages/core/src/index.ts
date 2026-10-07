// 文法のコンパイラ、レイアウト、レンダラー、リンター。

import { compile } from "./compile.ts";
import { loadInput } from "./input.ts";
import { layout } from "./layout.ts";
import { lint, type Violation } from "./lint.ts";
import { toJson, toSvg } from "./output.ts";
import type { Input, Layout } from "./types.ts";

export { InputError } from "./input.ts";
export { RULES, type Violation } from "./lint.ts";
export type * from "./types.ts";
export { compile, layout, lint, loadInput, toJson, toSvg };

export type Drawing = { input: Input; layout: Layout; svg: string; json: string; violations: Violation[] };

/** モデルのファイルから、配置、SVG、JSON、検査の結果を作る */
export async function draw(modelPath: string, cwd?: string): Promise<Drawing> {
  return drawInput(loadInput(modelPath, cwd));
}

/** 読み込んだ入力から、配置、SVG、JSON、検査の結果を作る */
export async function drawInput(input: Input): Promise<Drawing> {
  const c = compile(input);
  const l = await layout(c);
  return { input, layout: l, svg: toSvg(c, l), json: toJson(l), violations: lint(c, l) };
}
