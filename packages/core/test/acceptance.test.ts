// フェーズ1の要件の受け入れテスト（エンジン）。テストの名前の先頭は、検証する要件の ID である。

import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
import { compile, draw, lint, type Drawing, type Layout, type Point } from "../src/index.ts";
import {
  X01_MODEL, X02_MODEL, X06_AFTER, X07_MODEL, center, drawX01, drawX03, drawX04, nodeRect, x03Pin,
} from "./helpers.ts";

const rulesOf = (d: Drawing) => d.violations.map((v) => v.rule);
const LAYOUT_INPUTS = { X01: X01_MODEL, "X06 の変更後": X06_AFTER, X07: X07_MODEL };

// SVG の要素の開きと閉じが対応しているかを確かめる（属性の値の中に < と > は書かない前提）
function wellFormed(svg: string): boolean {
  const stack: string[] = [];
  for (const m of svg.matchAll(/<(\/?)([A-Za-z][\w:-]*)[^>]*?(\/?)>/g)) {
    const [, close, name, self] = m;
    if (self) continue;
    if (close) {
      if (stack.pop() !== name) return false;
    } else stack.push(name);
  }
  return stack.length === 0 && /^<svg[\s>]/.test(svg);
}

test("R-RENDER-1: X01 の SVG が、SVG の文書として読み込める", async () => {
  const d = await drawX01();
  assert.ok(wellFormed(d.svg));
  assert.match(d.svg, /^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});

test("R-RENDER-2: 配置の結果の JSON に、すべてのノード、線、グループの値がある", async () => {
  for (const path of [X01_MODEL, X06_AFTER]) {
    const d = await draw(path);
    const json = JSON.parse(d.json);
    const { model } = d.input;
    assert.deepEqual(json.nodes.map((n: any) => n.id), model.nodes.map((n) => n.id));
    for (const n of json.nodes) for (const key of ["x", "y", "width", "height"]) assert.equal(typeof n[key], "number", `${n.id}.${key}`);
    assert.equal(json.edges.length, model.edges.length);
    json.edges.forEach((e: any, i: number) => {
      assert.equal(e.from, model.edges[i].from);
      assert.equal(e.to, model.edges[i].to);
      assert.ok(e.points.length >= 2);
    });
    assert.deepEqual(json.groups.map((g: any) => g.id), (model.groups ?? []).map((g) => g.id));
    for (const g of json.groups) for (const key of ["x", "y", "width", "height"]) assert.equal(typeof g[key], "number", `${g.id}.${key}`);
  }
});

async function noViolations(rules: number[]) {
  for (const [name, path] of Object.entries(LAYOUT_INPUTS)) {
    const found = (await draw(path)).violations.filter((v) => rules.includes(v.rule));
    assert.deepEqual(found, [], `${name}: ${found.map((v) => v.message).join(" / ")}`);
  }
}
test("R-LAYOUT-1: X01、X06 の変更後、X07 の配置で、規則2〜6の違反が0件", () => noViolations([2, 3, 4, 5, 6]));
test("R-LAYOUT-2: X01、X06 の変更後、X07 の配置で、規則1の違反が0件", () => noViolations([1]));
test("R-LAYOUT-3: X01、X06 の変更後、X07 の配置で、規則7の違反が0件", () => noViolations([7]));
test("R-LAYOUT-6: X01、X06 の変更後、X07 の配置で、規則8の違反が0件", () => noViolations([8]));
test("R-LAYOUT-7: X01、X06 の変更後、X07 の配置で、規則9の違反が0件", () => noViolations([9]));

test("R-LAYOUT-4: X01 と同じ文法で、X02 を違反0件、ピン留め0件で描ける", async () => {
  const [x01, x02] = [await drawX01(), await draw(X02_MODEL)];
  assert.deepEqual(x02.input.grammar, x01.input.grammar);
  assert.deepEqual(x02.violations, []);
  assert.equal(JSON.parse(x02.json).pins.count, 0);
});

test("R-PIN-1: X03 で、ピン留めした queue が指定した座標にある", async () => {
  const d = await drawX03();
  assert.deepEqual(center(nodeRect(d, "queue")), await x03Pin());
});

test("R-PIN-2: 配置の結果の JSON に、ピン留めの数とノードがある", async () => {
  assert.deepEqual(JSON.parse((await drawX03()).json).pins, { count: 1, nodes: ["queue"] });
  assert.deepEqual(JSON.parse((await drawX01()).json).pins, { count: 0, nodes: [] });
});

test("R-PIN-3: X03 で、ピン留めしていないノードが規則を満たし、違反が0件", async () => {
  assert.deepEqual((await drawX03()).violations, []);
});

test("R-LINT-1: X04 で、規則1（queue、stockdb）と規則3（queue）の違反が、ピン留めとあわせて報告される", async () => {
  const v = (await drawX04()).violations;
  assert.ok(v.some((x) => x.rule === 1 && x.targets.includes("queue") && x.targets.includes("stockdb") && x.pinned), "規則1");
  assert.ok(v.some((x) => x.rule === 3 && x.targets.includes("queue") && x.pinned), "規則3");
});

test("R-LINT-2: X03 と X07 で、違反が0件と報告される", async () => {
  assert.deepEqual((await drawX03()).violations, []);
  assert.deepEqual((await draw(X07_MODEL)).violations, []);
});

// 規則ごとに、X01 の配置をその規則を破るように書き換えて検査する
test("R-LINT-3: 規則1〜9のそれぞれについて、違反を検出する", async () => {
  const base = await drawX01();
  const c = compile(base.input);
  const clone = (): Layout => structuredClone(base.layout);
  const node = (l: Layout, id: string) => l.nodes.find((n) => n.id === id)!;
  const edge = (l: Layout, from: string, to: string) => l.edges.find((e) => e.from === from && e.to === to)!;
  const breakers: Record<number, (l: Layout) => void> = {
    1: (l) => (node(l, "cdn").rect = { ...node(l, "user").rect }),
    2: (l) => {
      const e = edge(l, "user", "cdn");
      e.points[0] = [e.points[0][0] - 10, e.points[0][1]];
    },
    3: (l) => (node(l, "idp").rect.y = node(l, "apigw").rect.y),
    4: (l) => (node(l, "cdn").rect.x = node(l, "user").rect.x - 200),
    5: (l) => (node(l, "idp").rect.x += 1000),
    6: (l) => {
      const e = edge(l, "worker", "user");
      const [w, u] = [node(l, "worker").rect, node(l, "user").rect];
      const y = u.y - 20;
      e.points = [[w.x + w.w / 2, w.y + w.h], [w.x + w.w / 2, y], [u.x + u.w / 2, y], [u.x + u.w / 2, u.y + u.h]];
    },
    7: (l) => {
      const e = edge(l, "user", "cdn");
      const vpc = l.groups.find((g) => g.id === "vpc")!.rect;
      const [a, b] = [e.points[0], e.points.at(-1)!];
      const y = a[1];
      e.points = [a, [vpc.x + 30, y], [vpc.x + 30, y + 4], [b[0], y + 4], b] as Point[];
    },
    8: (l) => {
      const e = edge(l, "user", "cdn");
      const [a, b] = [e.points[0], e.points.at(-1)!];
      const r = node(l, "idp").rect;
      node(l, "idp").rect = { ...r, x: (a[0] + b[0]) / 2 - r.w / 2, y: a[1] - r.h / 2 };
    },
    9: (l) => (edge(l, "cdn", "apigw").points = structuredClone(edge(l, "user", "cdn").points)),
  };
  for (const [rule, breakIt] of Object.entries(breakers)) {
    const l = clone();
    breakIt(l);
    const rules = lint(c, l).map((v) => v.rule);
    assert.ok(rules.includes(Number(rule)), `規則${rule}の違反を検出しなかった（検出した規則：${rules.join("、")}）`);
  }
  assert.deepEqual(rulesOf(base), []);
});

test("R-DET-1: 同じ入力から、同じプロセスでも別のプロセスでも、バイト単位で同じ SVG と JSON が出る", async () => {
  const [a, b] = [await draw(X01_MODEL), await draw(X01_MODEL)];
  assert.equal(a.svg, b.svg);
  assert.equal(a.json, b.json);
  const script = `import("${new URL("../src/index.ts", import.meta.url).href}").then(async (k) => { const d = await k.draw(${JSON.stringify(X01_MODEL)}); process.stdout.write(d.svg + "\\0" + d.json); })`;
  const runs = [0, 1].map(() => spawnSync(process.execPath, ["-e", script], { encoding: "utf8" }));
  for (const r of runs) {
    assert.equal(r.status, 0, r.stderr);
    assert.equal(r.stdout, a.svg + "\0" + a.json);
  }
});

test("R-DET-2: X06 で線を1本足しても、ほかのノードの移動量の平均が 20px 以下", async () => {
  const [before, after] = [await drawX01(), await draw(X06_AFTER)];
  const others = before.layout.nodes.filter((n) => n.id !== "order" && n.id !== "queue");
  const moves = others.map((n) => {
    const [p, q] = [center(n.rect), center(nodeRect(after, n.id))];
    return Math.hypot(p.x - q.x, p.y - q.y);
  });
  const mean = moves.reduce((s, m) => s + m, 0) / moves.length;
  assert.ok(mean <= 20, `移動量の平均が ${mean.toFixed(1)}px`);
});
