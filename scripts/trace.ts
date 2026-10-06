#!/usr/bin/env node
// 約束、シナリオ、要件、仕様の項目、テストの対応表と、対応の抜けを出力する。
// 読むのは、各文書のフロントマターと、PR/FAQ の約束の一覧の ID の列だけである（docs/README.md の原則6）。
// 使い方：node scripts/trace.ts [--stage <段階の番号>]
// --stage を付けると、作業プロセスのその段階までの出る条件に当たる抜けがあれば、終了コード1で終わる。

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";
import { parse } from "yaml";

const root = join(import.meta.dirname, "..");
const read = (path: string) => readFileSync(join(root, path), "utf8");

function files(dir: string, test: (name: string) => boolean): string[] {
  if (!existsSync(join(root, dir))) return [];
  return readdirSync(join(root, dir)).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(join(root, path)).isDirectory()) return files(path, test);
    return test(name) ? [path] : [];
  });
}

type Gap = { stage: number; message: string };
const gaps: Gap[] = [];

function frontmatter(path: string, stage: number): Record<string, unknown> {
  const match = read(path).match(/^---\n([\s\S]*?)\n---\n/);
  if (!match) {
    gaps.push({ stage, message: `${path}：フロントマターがない` });
    return {};
  }
  return parse(match[1]) ?? {};
}

function idList(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

// ファイル名から .md を除いたものが ID になる文書は、フロントマターの id と一致するかを確かめる。
function checkId(path: string, id: unknown, expected: string, stage: number): string {
  if (id !== expected) gaps.push({ stage, message: `${path}：id が ${expected} でない` });
  return expected;
}

// 約束：PR/FAQ の約束の一覧の表の ID の列
const promiseSection = read("docs/prfaq.md").split(/^## 約束の一覧$/m)[1] ?? "";
const promises = [...promiseSection.matchAll(/^\|\s*(P\d+)\s*\|/gm)].map((m) => m[1]);

// このサイクルで扱う約束：最新のゲートの記録のフロントマター
const gates = files("docs/gates", (name) => /^phase-\d+\.md$/.test(name))
  .map((path) => ({ path, fm: frontmatter(path, 1) }))
  .sort((a, b) => Number(a.fm.phase) - Number(b.fm.phase));
const lastGate = gates.at(-1);
const cycle = lastGate ? Number(lastGate.fm.phase) + 1 : 0;
const inScope = lastGate ? idList(lastGate.fm.next_cycle_promises) : promises;

// シナリオ
const scenarios = files("docs/experience", (name) => /^X\d{2}-.+\.md$/.test(name)).map((path) => {
  const fm = frontmatter(path, 2);
  return { id: checkId(path, fm.id, basename(path).slice(0, 3), 2), path, promises: idList(fm.promises) };
});

// 要件
const requirements = files("docs/requirements", (name) => /^R-.+\.md$/.test(name)).map((path) => {
  const fm = frontmatter(path, 3);
  return {
    id: checkId(path, fm.id, basename(path, ".md"), 3),
    sources: idList(fm.sources),
    verification: fm.verification,
    cycle: fm.cycle,
  };
});

// 仕様の項目
const specItems = files("docs/spec", (name) => /^S-.+\.md$/.test(name)).map((path) => {
  const fm = frontmatter(path, 4);
  return { id: checkId(path, fm.id, basename(path, ".md"), 4), status: String(fm.status ?? ""), satisfies: idList(fm.satisfies) };
});

// テスト：テストの名前の先頭に書いた要件の ID
const tests = files("packages", (name) => name.endsWith(".test.ts")).map((path) => ({
  path,
  requirements: [...read(path).matchAll(/\btest\(\s*["'`](R-[A-Z]+-\d+)\b/g)].map((m) => m[1]),
}));

// 対応の抜け。作業プロセスの段階ごとの出る条件に当てる。
const scenarioIds = scenarios.map((s) => s.id);
for (const s of scenarios) {
  if (s.promises.length === 0) gaps.push({ stage: 2, message: `${s.id}：promises がない` });
  for (const p of s.promises.filter((p) => !promises.includes(p)))
    gaps.push({ stage: 2, message: `${s.id}：約束の一覧にない ${p} を参照している` });
}
for (const p of inScope.filter((p) => !scenarios.some((s) => s.promises.includes(p))))
  gaps.push({ stage: 2, message: `${p}：このサイクルで扱うが、シナリオがない` });

const cycleRequirements = requirements.filter((r) => r.cycle === cycle);
for (const r of requirements) {
  if (r.sources.length === 0) gaps.push({ stage: 3, message: `${r.id}：sources がない` });
  for (const id of r.sources.filter((id) => !promises.includes(id) && !scenarioIds.includes(id)))
    gaps.push({ stage: 3, message: `${r.id}：存在しない ${id} を出どころにしている` });
  if (!r.verification) gaps.push({ stage: 3, message: `${r.id}：verification がない` });
}
for (const s of scenarios.filter((s) => s.promises.some((p) => inScope.includes(p))))
  if (!cycleRequirements.some((r) => r.sources.includes(s.id)))
    gaps.push({ stage: 3, message: `${s.id}：このサイクルの要件の出どころになっていない` });

for (const r of cycleRequirements.filter((r) => !specItems.some((s) => s.satisfies.includes(r.id))))
  gaps.push({ stage: 4, message: `${r.id}：仕様の項目がない` });

for (const s of specItems.filter((s) => s.status === "仮説"))
  gaps.push({ stage: 5, message: `${s.id}：状態が仮説のまま` });
for (const r of cycleRequirements.filter((r) => r.verification === "テスト"))
  if (!tests.some((t) => t.requirements.includes(r.id)))
    gaps.push({ stage: 5, message: `${r.id}：要件の ID を名前に書いたテストがない` });

// 出力
const list = (items: string[]) => (items.length ? items.join("、") : "—");
const out = [`# 対応表（フェーズ${cycle}）`, ""];
out.push("| 約束 | このサイクル | シナリオ | 要件 | 仕様の項目 | テスト |", "| --- | --- | --- | --- | --- | --- |");
for (const p of promises) {
  const xs = scenarios.filter((s) => s.promises.includes(p)).map((s) => s.id);
  const rs = requirements.filter((r) => r.sources.some((id) => id === p || xs.includes(id))).map((r) => r.id);
  const ss = specItems.filter((s) => s.satisfies.some((r) => rs.includes(r))).map((s) => `${s.id}（${s.status}）`);
  const ts = tests.filter((t) => t.requirements.some((r) => rs.includes(r))).map((t) => t.path);
  out.push(`| ${p} | ${inScope.includes(p) ? "扱う" : ""} | ${list(xs)} | ${list(rs)} | ${list(ss)} | ${list(ts)} |`);
}
out.push("", "## 対応の抜け", "");
gaps.sort((a, b) => a.stage - b.stage);
out.push(...(gaps.length ? gaps.map((g) => `- 段階${g.stage}：${g.message}`) : ["なし"]));
out.push("", "テストの合否は、この表では分からない。テストを実行して確かめる。");
console.log(out.join("\n"));

const stageArg = process.argv.indexOf("--stage");
if (stageArg >= 0 && gaps.some((g) => g.stage <= Number(process.argv[stageArg + 1]))) process.exit(1);
