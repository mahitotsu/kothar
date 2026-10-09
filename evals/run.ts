#!/usr/bin/env node
// フェーズ3の要件の AI の評価（R-AI-1〜3、5、6、R-PLUGIN-2）を回す。
// 使い方：node evals/run.ts <Claude Code の実行ファイルのパス> [回数（既定 3）]
// 一時ディレクトリに体験の例の入力を写し、Claude Code の非対話のモード（claude -p）にプラグインを読み込ませて依頼する。
// 結果は evals/out/<日時>/ に書く（コミットしない）。API の利用料がかかる。

import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parse } from "yaml";
import { draw, drawInput, loadInput } from "../packages/core/src/index.ts";
import type { Model } from "../packages/core/src/index.ts";

const ROOT = join(import.meta.dirname, "..");
const PLUGIN = join(ROOT, "plugins", "kothar");
const claude = process.argv[2];
const runs = Number(process.argv[3] ?? 3);
if (!claude) throw new Error("Claude Code の実行ファイルのパスを指定する");
const OUT = join(ROOT, "evals", "out", new Date().toISOString().replace(/[:.]/g, "-"));
mkdirSync(OUT, { recursive: true });

const X10_PROMPT = "docs/process.md から、benchmarks/process/ の語彙と文法を使って、作業プロセスのモデルを下書きして。図も描いて。";
const X11_PROMPT = "architecture.yaml の lint の誤りと違反を直して。";
const TOOLS = "Bash(kothar:*),Read,Write,Edit,Glob,Grep";

type Run = { result: string; model: string; cost: number; ok: boolean };

function ask(cwd: string, prompt: string): Run {
  const r = spawnSync(claude, ["-p", prompt, "--plugin-dir", PLUGIN, "--allowedTools", TOOLS, "--output-format", "json"], {
    cwd,
    encoding: "utf8",
    input: "",
    timeout: 20 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  if (r.error) throw new Error(`Claude Code を起動できない：${r.error.message}`);
  try {
    const j = JSON.parse(r.stdout);
    return { result: j.result ?? "", model: Object.keys(j.modelUsage ?? {}).join(","), cost: j.total_cost_usd ?? 0, ok: !j.is_error };
  } catch {
    return { result: r.stdout + r.stderr, model: "", cost: 0, ok: false };
  }
}

// --- X10：設計書からモデルを下書きする -----------------------------------------
function x10Workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "kothar-x10-"));
  mkdirSync(join(dir, "docs"));
  cpSync(join(ROOT, "docs", "process.md"), join(dir, "docs", "process.md"));
  mkdirSync(join(dir, "benchmarks", "process"), { recursive: true });
  for (const f of ["vocabulary.yaml", "grammar.yaml", "grammar.md"])
    cpSync(join(ROOT, "benchmarks", "process", f), join(dir, "benchmarks", "process", f));
  return dir;
}

const f1 = (tp: number, got: number, want: number) => {
  const p = got ? tp / got : 0;
  const r = want ? tp / want : 0;
  return p + r ? (2 * p * r) / (p + r) : 0;
};
const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();

// 手で書いたモデルと比べる（R-AI-3）。ノードとグループはラベルで、線は両端と種類で、属性はキーと値の組で比べる
function compare(got: Model, want: Model) {
  const labelOf = (m: Model) => new Map([...m.nodes, ...(m.groups ?? [])].map((n) => [n.id, norm(n.label)]));
  const [gl, wl] = [labelOf(got), labelOf(want)];
  const wantNodes = new Set(want.nodes.map((n) => norm(n.label)));
  const gotNodes = new Set(got.nodes.map((n) => norm(n.label)));
  const nodeTp = [...gotNodes].filter((l) => wantNodes.has(l)).length;
  const edgeKey = (labels: Map<string, string>) => (e: Model["edges"][number]) => `${labels.get(e.from)}→${labels.get(e.to)}:${e.kind}`;
  const wantEdges = new Set(want.edges.map(edgeKey(wl)));
  const gotEdges = new Set(got.edges.map(edgeKey(gl)));
  const edgeTp = [...gotEdges].filter((k) => wantEdges.has(k)).length;
  let attrTotal = 0;
  let attrOk = 0;
  for (const w of want.nodes) {
    const g = got.nodes.find((n) => norm(n.label) === norm(w.label));
    if (!g) continue;
    for (const [k, v] of Object.entries(w.attrs ?? {})) {
      attrTotal++;
      if (g.attrs?.[k] === v) attrOk++;
    }
  }
  return {
    nodeF1: f1(nodeTp, gotNodes.size, wantNodes.size),
    edgeF1: f1(edgeTp, gotEdges.size, wantEdges.size),
    attrRate: attrTotal ? attrOk / attrTotal : 0,
    missingNodes: [...wantNodes].filter((l) => !gotNodes.has(l)),
    extraNodes: [...gotNodes].filter((l) => !wantNodes.has(l)),
    missingEdges: [...wantEdges].filter((k) => !gotEdges.has(k)),
    extraEdges: [...gotEdges].filter((k) => !wantEdges.has(k)),
  };
}

async function judgeX10(dir: string) {
  const path = join(dir, "benchmarks", "process", "model.yaml");
  const judged: Record<string, unknown> = { modelFile: existsSync(path) };
  if (!existsSync(path)) return { ...judged, ai1: false, ai2: false, ai3: undefined, ai5: false };
  let input;
  try {
    input = loadInput(path);
  } catch (err) {
    return { ...judged, inputError: String((err as Error).message), ai1: false, ai2: false, ai3: undefined, ai5: false };
  }
  const raw = parse(readFileSync(path, "utf8")) as Model;
  const noPins = raw.nodes.every((n) => !("pin" in n));
  const d = await drawInput(input);
  const svgPath = join(dir, "benchmarks", "process", "model.svg");
  const ai5 = existsSync(svgPath) && readFileSync(svgPath, "utf8") === d.svg;
  const want = parse(readFileSync(join(ROOT, "benchmarks", "process", "model.yaml"), "utf8")) as Model;
  return { ...judged, ai1: noPins, ai2: d.violations.length === 0, violations: d.violations.map((v) => v.message), ai3: compare(raw, want), ai5 };
}

// --- X11：誤りと違反を直す ---------------------------------------------------
function x11Workspace(): string {
  const dir = mkdtempSync(join(tmpdir(), "kothar-x11-"));
  mkdirSync(join(dir, "benchmarks", "sample-arch"), { recursive: true });
  for (const f of ["vocabulary.yaml", "grammar.yaml", "grammar.md"])
    cpSync(join(ROOT, "benchmarks", "sample-arch", f), join(dir, "benchmarks", "sample-arch", f));
  const broken = readFileSync(join(ROOT, "docs", "experience", "X11", "model-broken.yaml"), "utf8").replaceAll("../../../benchmarks/", "benchmarks/");
  writeFileSync(join(dir, "architecture.yaml"), broken);
  return dir;
}

async function judgeX11(dir: string) {
  const unchanged = ["vocabulary.yaml", "grammar.yaml"].every((f) =>
    readFileSync(join(dir, "benchmarks", "sample-arch", f)).equals(readFileSync(join(ROOT, "benchmarks", "sample-arch", f))),
  );
  let lintOk = false;
  let violations: string[] = [];
  try {
    const d = await draw(join(dir, "architecture.yaml"));
    lintOk = d.violations.length === 0;
    violations = d.violations.map((v) => v.message);
  } catch (err) {
    violations = [String((err as Error).message)];
  }
  const strip = (m: Model) => ({ nodes: m.nodes, groups: m.groups, edges: m.edges });
  const got = strip(parse(readFileSync(join(dir, "architecture.yaml"), "utf8")) as Model);
  const want = strip(parse(readFileSync(join(ROOT, "benchmarks", "sample-arch", "model.yaml"), "utf8")) as Model);
  const same = JSON.stringify(got) === JSON.stringify(want);
  return { ai6: unchanged && lintOk && same, unchanged, lintOk, sameAsBenchmark: same, violations };
}

// --- 実行 -------------------------------------------------------------------
const results: Record<string, unknown>[] = [];
for (let i = 1; i <= runs; i++) {
  const dir = x10Workspace();
  const run = ask(dir, X10_PROMPT);
  const judged = await judgeX10(dir);
  results.push({ scenario: "X10", run: i, dir, model: run.model, cost: run.cost, ...judged });
  writeFileSync(join(OUT, `X10-${i}.md`), run.result);
  if (existsSync(join(dir, "benchmarks", "process", "model.yaml"))) cpSync(join(dir, "benchmarks", "process", "model.yaml"), join(OUT, `X10-${i}.model.yaml`));
  console.log(JSON.stringify(results.at(-1)));
}
for (let i = 1; i <= runs; i++) {
  const dir = x11Workspace();
  const run = ask(dir, X11_PROMPT);
  const judged = await judgeX11(dir);
  results.push({ scenario: "X11", run: i, dir, model: run.model, cost: run.cost, ...judged });
  writeFileSync(join(OUT, `X11-${i}.md`), run.result);
  cpSync(join(dir, "architecture.yaml"), join(OUT, `X11-${i}.model.yaml`));
  console.log(JSON.stringify(results.at(-1)));
}
// X12：Agent SDK から1回（R-PLUGIN-2）
{
  const dir = x10Workspace();
  const r = spawnSync(process.execPath, [join(ROOT, "examples", "agent-sdk", "draft-model.mjs"), X10_PROMPT], {
    cwd: dir,
    encoding: "utf8",
    env: { ...process.env, CLAUDE_CODE_EXECUTABLE: claude },
    timeout: 20 * 60 * 1000,
    maxBuffer: 64 * 1024 * 1024,
  });
  const judged = await judgeX10(dir);
  results.push({ scenario: "X12", run: 1, dir, ...judged });
  writeFileSync(join(OUT, "X12-1.md"), r.stdout + r.stderr);
  console.log(JSON.stringify(results.at(-1)));
}
writeFileSync(join(OUT, "results.json"), JSON.stringify(results, null, 2) + "\n");
console.log(`結果：${OUT}`);
