// フェーズ1の要件の受け入れテスト（CLI）。テストの名前の先頭は、検証する要件の ID である。

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { stringify } from "yaml";
import { loadInput } from "@kothar/core";
import { X01_MODEL, X07_MODEL, x03Pin, x04Pin } from "../../core/test/helpers.ts";

const CLI = join(import.meta.dirname, "..", "src", "index.ts");
const tmp = () => mkdtempSync(join(tmpdir(), "kothar-"));
const kothar = (args: string[], prefix: string[] = []) => {
  const [cmd, ...rest] = [...prefix, process.execPath, CLI, ...args];
  return spawnSync(cmd, rest, { encoding: "utf8" });
};

// X01 のモデルの queue にピン留めを加えたモデルのファイルを、一時ディレクトリに書く。語彙と文法は絶対パスで参照する
function pinnedModel(pin: { x: number; y: number }): string {
  const input = loadInput(X01_MODEL);
  const dir = join(X01_MODEL, "..");
  const model = {
    ...input.model,
    vocabulary: join(dir, input.model.vocabulary),
    grammar: join(dir, input.model.grammar),
    nodes: input.model.nodes.map((n) => (n.id === "queue" ? { ...n, pin } : n)),
  };
  const path = join(tmp(), "model.yaml");
  writeFileSync(path, stringify(model));
  return path;
}

test("R-PIN-2: render が、ピン留めの数とノードをコマンドの出力に出す", async () => {
  const out = join(tmp(), "x03.svg");
  const r = kothar(["render", pinnedModel(await x03Pin()), "--out", out]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /ピン留め：1件（queue）/);
  const r0 = kothar(["render", X01_MODEL, "--out", join(tmp(), "x01.svg")]);
  assert.match(r0.stdout, /ピン留め：0件/);
});

test("R-LINT-1: X04 で、lint が違反を報告し、失敗の終了コードで終わる", async () => {
  const r = kothar(["lint", pinnedModel(await x04Pin())]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /規則1（ノードとラベルの重なり）：stockdb と queue が重なっている（ピン留めしたノードを含む）/);
  assert.match(r.stdout, /規則3（領域）：queue は下段なのに、本流より下にない（ピン留めしたノードを含む）/);
});

test("R-LINT-2: X03 と X07 で、lint が違反0件を報告し、成功の終了コードで終わる", async () => {
  for (const model of [pinnedModel(await x03Pin()), X07_MODEL]) {
    const r = kothar(["lint", model]);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.match(r.stdout, /違反は0件です。/);
  }
});

test("R-CHECK-1: 渡された SVG がモデルから描いた図と違うとき、check が描き直しを示して失敗する", () => {
  const svg = join(tmp(), "architecture.svg");
  assert.equal(kothar(["render", X01_MODEL, "--out", svg]).status, 0);
  const r = kothar(["check", X07_MODEL, svg]);
  assert.notEqual(r.status, 0);
  assert.match(r.stdout, /一致しません。次のコマンドで描き直してください。/);
  assert.ok(r.stdout.includes(`kothar render ${X07_MODEL} --out ${svg}`));
});

test("R-CHECK-2: 渡された SVG がモデルから描いた図と同じとき、check が成功する", () => {
  const svg = join(tmp(), "architecture.svg");
  assert.equal(kothar(["render", X07_MODEL, "--out", svg]).status, 0);
  const r = kothar(["check", X07_MODEL, svg]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
});

test("R-CHECK-3: ネットワークを遮断しても、render、lint、check が動く", (t) => {
  if (process.platform !== "linux" || spawnSync("unshare", ["-rn", "true"]).status !== 0) {
    t.skip("ネットワークを遮断できる環境（Linux の unshare）でだけ確かめる");
    return;
  }
  const offline = ["unshare", "-rn"];
  const svg = join(tmp(), "architecture.svg");
  const render = kothar(["render", X07_MODEL, "--out", svg], offline);
  assert.equal(render.status, 0, render.stderr);
  assert.ok(readFileSync(svg, "utf8").startsWith("<svg"));
  assert.equal(kothar(["lint", X07_MODEL], offline).status, 0);
  assert.equal(kothar(["check", X07_MODEL, svg], offline).status, 0);
});

test("R-VIEW-1: render、lint、check が --grammar で指定した文法で描き、検査する", () => {
  const trust = join(X01_MODEL, "..", "trust.yaml");
  const svg = join(tmp(), "trust.svg");
  assert.equal(kothar(["render", X01_MODEL, "--grammar", trust, "--out", svg]).status, 0);
  assert.ok(!readFileSync(svg, "utf8").includes(">ログ基盤<"), "信頼境界の図に、出さないはずのノードがある");
  assert.equal(kothar(["lint", X01_MODEL, "--grammar", trust]).status, 0);
  assert.equal(kothar(["check", X01_MODEL, svg, "--grammar", trust]).status, 0);
  // 文法を指定しないと、モデルが参照する文法（構成図）で描くので、信頼境界の図とは一致しない
  assert.notEqual(kothar(["check", X01_MODEL, svg]).status, 0);
});
