// 語彙、文法、モデルのファイルを読み込み、JSON Schema と語彙に照らして検査する（S-INPUT-1、S-INPUT-2）。

import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { Ajv2020, type ErrorObject, type ValidateFunction } from "ajv/dist/2020.js";
import { parse } from "yaml";
import type { Grammar, Input, Model, Vocabulary } from "./types.ts";

/** 入力の誤り。1つの例外に、見つけた誤りをすべて持つ */
export class InputError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(problems.join("\n"));
    this.problems = problems;
  }
}

const schemaDir = join(import.meta.dirname, "..", "schema");
// if と then の中で required を使うので、strictRequired だけを緩める
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false });
const validators = new Map<string, ValidateFunction>();
function validator(name: "vocabulary" | "grammar" | "model"): ValidateFunction {
  let v = validators.get(name);
  if (!v) {
    v = ajv.compile(JSON.parse(readFileSync(join(schemaDir, `${name}.schema.json`), "utf8")));
    validators.set(name, v);
  }
  return v;
}

function describe(file: string, e: ErrorObject): string {
  const where = e.instancePath || "/";
  if (e.keyword === "additionalProperties") return `${file}: ${where}: 知らないキー「${e.params.additionalProperty}」がある`;
  if (e.keyword === "required") return `${file}: ${where}: キー「${e.params.missingProperty}」がない`;
  if (e.keyword === "enum") return `${file}: ${where}: 値は ${(e.params.allowedValues as string[]).join("、")} のどれか`;
  return `${file}: ${where}: ${e.message}`;
}

function readYaml(path: string, name: "vocabulary" | "grammar" | "model", shown: string): unknown {
  let text: string;
  try {
    text = readFileSync(path, "utf8");
  } catch {
    throw new InputError([`${shown}: ファイルを読めない`]);
  }
  let data: unknown;
  try {
    data = parse(text);
  } catch (err) {
    throw new InputError([`${shown}: YAML として読めない（${(err as Error).message.split("\n")[0]}）`]);
  }
  const v = validator(name);
  if (!v(data)) throw new InputError((v.errors ?? []).map((e) => describe(shown, e)));
  return data;
}

const list = (values: string[]) => values.map((v) => `「${v}」`).join("、");

/**
 * モデルのファイルを読み、参照する語彙と文法とあわせて検査する。
 * grammarPath を指定したときは、モデルが参照する文法の代わりに、その文法を使う（S-CLI-4）
 */
export function loadInput(modelPath: string, cwd = process.cwd(), grammarPath?: string): Input {
  const show = (p: string) => relative(cwd, p) || p;
  const modelFile = resolve(cwd, modelPath);
  const model = readYaml(modelFile, "model", show(modelFile)) as Model;
  const vocabFile = resolve(dirname(modelFile), model.vocabulary);
  const grammarFile = grammarPath ? resolve(cwd, grammarPath) : resolve(dirname(modelFile), model.grammar);
  const vocabulary = readYaml(vocabFile, "vocabulary", show(vocabFile)) as Vocabulary;
  const grammar = readYaml(grammarFile, "grammar", show(grammarFile)) as Grammar;

  const problems: string[] = [];
  const m = show(modelFile);
  const g = show(grammarFile);
  if (resolve(dirname(grammarFile), grammar.vocabulary) !== vocabFile)
    problems.push(`${g}: 文法の語彙（${grammar.vocabulary}）が、モデルの語彙（${model.vocabulary}）と同じファイルでない`);

  const checkAttrs = (file: string, where: string, attrs: Record<string, unknown> | undefined) => {
    for (const [key, value] of Object.entries(attrs ?? {})) {
      if (typeof value !== "string") continue;
      const values = vocabulary.attributes[key];
      if (!values) problems.push(`${file}: ${where}: 属性「${key}」は語彙にない。語彙にある属性は ${list(Object.keys(vocabulary.attributes))}`);
      else if (!values.includes(value)) problems.push(`${file}: ${where}: 属性「${key}」の値「${value}」は語彙にない。語彙にある値は ${list(values)}`);
    }
  };
  const checkKind = (file: string, where: string, kind: string) => {
    if (!vocabulary.edgeKinds.includes(kind)) problems.push(`${file}: ${where}: 線の種類「${kind}」は語彙にない。語彙にある種類は ${list(vocabulary.edgeKinds)}`);
  };

  // 文法
  const regionNames = grammar.regions.map((r) => r.name);
  grammar.regions.forEach((r, i) => {
    checkAttrs(g, `/regions/${i}/when`, r.when);
    checkAttrs(g, `/regions/${i}/when/inGroup`, r.when?.inGroup);
    if (regionNames.indexOf(r.name) !== i) problems.push(`${g}: /regions/${i}: 領域の名前「${r.name}」が重複している`);
  });
  if (!grammar.regions.some((r) => !r.when)) problems.push(`${g}: /regions: 条件（when）のない領域がない`);
  // 列（column）は、ほかの置き方（hidden を除く）と混ぜない
  const places = new Set(grammar.regions.map((r) => r.place).filter((p) => p !== "hidden"));
  if (places.has("column") && places.size > 1) problems.push(`${g}: /regions: 列（column）の領域と、ほかの置き方の領域を混ぜている`);
  grammar.edges.forEach((e, i) => {
    checkKind(g, `/edges/${i}`, e.kind);
    checkAttrs(g, `/edges/${i}/crosses`, e.crosses);
    for (const end of [e.from, e.to]) if (end && !regionNames.includes(end)) problems.push(`${g}: /edges/${i}: 領域「${end}」は文法にない`);
    if (!e.hidden && !grammar.styles[e.style]) problems.push(`${g}: /edges/${i}: スタイル「${e.style}」は文法にない`);
  });

  // モデル
  const ids = new Map<string, string>();
  const claim = (id: string, where: string) => {
    if (ids.has(id)) problems.push(`${m}: ${where}: ID「${id}」が ${ids.get(id)} と重複している`);
    else ids.set(id, where);
  };
  model.nodes.forEach((n, i) => {
    claim(n.id, `/nodes/${i}`);
    checkAttrs(m, `/nodes/${i}/attrs`, n.attrs);
  });
  const groups = model.groups ?? [];
  groups.forEach((gr, i) => {
    claim(gr.id, `/groups/${i}`);
    checkAttrs(m, `/groups/${i}/attrs`, gr.attrs);
  });
  const parent = new Map<string, string>();
  groups.forEach((gr, i) =>
    gr.members.forEach((id, j) => {
      if (!ids.has(id)) problems.push(`${m}: /groups/${i}/members/${j}: 「${id}」はノードにもグループにもない`);
      else if (parent.has(id)) problems.push(`${m}: /groups/${i}/members/${j}: 「${id}」は、グループ「${parent.get(id)}」にも入っている`);
      else parent.set(id, gr.id);
    }),
  );
  for (const gr of groups) {
    // グループの入れ子が輪になっていないか
    const seen = new Set<string>();
    for (let id: string | undefined = gr.id; id; id = parent.get(id)) {
      if (seen.has(id)) {
        problems.push(`${m}: /groups: グループ「${gr.id}」の入れ子が輪になっている`);
        break;
      }
      seen.add(id);
    }
  }
  model.edges.forEach((e, i) => {
    for (const end of [e.from, e.to]) if (!ids.has(end)) problems.push(`${m}: /edges/${i}: 「${end}」はノードにもグループにもない`);
    checkKind(m, `/edges/${i}`, e.kind);
  });

  if (problems.length) throw new InputError(problems);
  return { model: { ...model, groups }, grammar, vocabulary };
}
