// フェーズ2の要件の受け入れテスト（同じモデルを別の文法で描く）。テストの名前の先頭は、検証する要件の ID である。

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { test } from "node:test";
import { draw, type Drawing } from "../src/index.ts";
import { ROOT, X01_MODEL } from "./helpers.ts";

const TRUST = join(ROOT, "benchmarks/sample-arch/trust.yaml");
const FLOW = join(ROOT, "benchmarks/sample-arch/request-flow.yaml");
const VOCAB = join(ROOT, "benchmarks/sample-arch/vocabulary.yaml");
const drawX08 = () => draw(X01_MODEL, undefined, TRUST);
const drawX09 = () => draw(X01_MODEL, undefined, FLOW);

const nodeIds = (d: Drawing) => d.layout.nodes.map((n) => n.id).sort();
const edgeNames = (d: Drawing) => d.layout.edges.map((e) => `${e.from}→${e.to}`).sort();
const json = (d: Drawing) => JSON.parse(d.json);
const cx = (d: Drawing, id: string) => {
  const r = d.layout.nodes.find((n) => n.id === id)!.rect;
  return r.x + r.w / 2;
};

test("R-VIEW-1: 別の文法を指定すると、その文法で描き、モデルと語彙のファイルは変わらない", async () => {
  const before = [readFileSync(X01_MODEL), readFileSync(VOCAB)];
  const [x08, x09] = [await drawX08(), await drawX09()];
  assert.deepEqual(nodeIds(x08), ["apigw", "cdn", "idp", "order", "orderdb", "psp", "queue", "stock", "stockdb", "user", "worker"]);
  assert.deepEqual(nodeIds(x09), ["apigw", "cdn", "idp", "order", "orderdb", "psp", "stock", "stockdb", "user"]);
  assert.ok(readFileSync(X01_MODEL).equals(before[0]));
  assert.ok(readFileSync(VOCAB).equals(before[1]));
});

test("R-VIEW-2: X08 で、ノードが割り当てた列にあり、列が左から右へ並ぶ", async () => {
  const d = await drawX08();
  const columns = [["user", "cdn"], ["apigw", "order", "stock", "orderdb", "stockdb", "queue", "worker"], ["idp", "psp"]];
  for (let i = 0; i < columns.length - 1; i++)
    for (const left of columns[i])
      for (const right of columns[i + 1]) assert.ok(cx(d, left) < cx(d, right), `${left} が ${right} より左にない`);
});

test("R-VIEW-3: 文法が出さないと決めたノードと線は、SVG にも JSON にもない", async () => {
  const x08 = await drawX08();
  const x09 = await drawX09();
  for (const [d, hiddenNodes, hiddenLabels] of [
    [x08, ["log", "mon", "kms"], ["ログ基盤", "監視", "鍵管理"]],
    [x09, ["queue", "worker", "log", "mon", "kms"], ["イベントキュー", "通知ワーカー", "ログ基盤", "監視", "鍵管理", "在庫変動", "プッシュ通知"]],
  ] as const) {
    const j = json(d);
    for (const id of hiddenNodes) assert.ok(!j.nodes.some((n: any) => n.id === id), `JSON にノード ${id} がある`);
    for (const text of hiddenLabels) assert.ok(!d.svg.includes(`>${text}<`), `SVG に「${text}」がある`);
  }
  assert.ok(!json(x08).edges.some((e: any) => e.kind === "uses"), "X08 に uses の線がある");
  assert.ok(json(x09).edges.every((e: any) => e.kind === "call"), "X09 に call 以外の線がある");
  assert.equal(json(x09).edges.length, 8);
});

test("R-VIEW-4: X08 で、信頼境界をまたぐ線とまたがない線が、それぞれのスタイルで描かれる", async () => {
  const d = await drawX08();
  const crossing = ["apigw→idp", "cdn→apigw", "order→psp", "worker→user"];
  for (const e of json(d).edges) {
    const name = `${e.from}→${e.to}`;
    if (crossing.includes(name)) assert.equal(e.style, "crossing", name);
    else assert.notEqual(e.style, "crossing", name);
  }
  assert.deepEqual(edgeNames(d).filter((n) => crossing.includes(n)), crossing);
});

test("R-VIEW-5: X08 と X09 の配置で、lint の違反が0件", async () => {
  for (const d of [await drawX08(), await drawX09()]) assert.deepEqual(d.violations, []);
});
