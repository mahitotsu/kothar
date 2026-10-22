// 図の検査。仕様（*.fig.json）から作った SVG が整っていることと、置いた SVG が生成物と一致すること。
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { groupedColumns, stackedBars } from "../scripts/chart-figures.ts";
import { arrange } from "../scripts/arrange.ts";
import { niceTicks } from "../scripts/charts-more.ts";
import { generate, stale, svgPath, tableOf } from "../scripts/figure.ts";
import { figureTable, lintFigure, renderFigure, type FigureSpec } from "../scripts/render-figure.ts";
import type { GridSpec } from "../scripts/grid.ts";
import { textWidth } from "../scripts/svg-parts.ts";

const specs = readdirSync("templates/figures").filter((f) => f.endsWith(".fig.json")).map((f) => `templates/figures/${f}`);

describe("置いた図は、仕様の生成物と一致する", () => {
  it("例の仕様が、すべての kind にある", () => {
    const kinds = new Set(specs.map((f) => (JSON.parse(readFileSync(f, "utf8")) as { kind: string }).kind));
    for (const k of ["diagram", "columns", "stacked", "bars", "lines", "dumbbell", "heatmap", "tiles", "meter", "grid", "sequence", "timeline", "compare", "matrix"]) assert.ok(kinds.has(k), `kind「${k}」の例がない`);
  });
  for (const f of specs) {
    it(`${svgPath(f)}: 整った SVG で、ダーク対応で、置いたファイルと同じ`, () => {
      const svg = generate(f);
      assert.ok(svg.startsWith("<svg") && svg.includes("<title") && svg.includes("prefers-color-scheme: dark"));
      assert.deepEqual(stale([f]), []);
    });
  }
  it("同じ入力から、同じ図ができる", () => assert.equal(generate(specs[0]), generate(specs[0])));
  it("生成物と違う SVG は、stale が見つける", () => assert.deepEqual(stale(["test/fixtures/stale.fig.json"]), ["test/fixtures/stale.fig.json"]));
});

describe("renderFigure", () => {
  it("知らない kind は、エラーにする", () => assert.throws(() => renderFigure({ kind: "pie" } as never), /kind/));
  it("diagram は、箱・枠・矢印・文字を描く", () => {
    const svg = renderFigure({
      kind: "diagram", title: "t", desc: "d", height: 100,
      parts: [
        { box: [0, 0, 50, 30], lines: ["a", "b"] }, { group: [0, 0, 60, 40], label: "g" },
        { arrow: [0, 0, 20, 0] }, { text: [5, 5], value: "x<y" },
      ],
    });
    assert.ok(svg.includes('class="box"') && svg.includes('class="grp"') && svg.includes("<polyline") && svg.includes("x&lt;y"));
  });
  it("columns の decimals は、値の桁を決める", () => {
    const c = { kind: "columns" as const, title: "t", desc: "d", yLabel: "y", groups: [["A"]], series: [{ name: "X", cls: "s1" as const, values: [1.5] }], yMax: 2, ticks: [0, 2], decimals: 1 };
    assert.ok(renderFigure(c).includes(">1.5<") && renderFigure(c).includes(">2.0<"));
  });
});

describe("groupedColumns", () => {
  const chart = {
    title: "t", desc: "d", yLabel: "y", groups: [["A"], ["B"]],
    series: [
      { name: "X", cls: "s1" as const, values: [10, 5] },
      { name: "Y", cls: "s2" as const, values: [2, null] },
    ],
    yMax: 10, ticks: [0, 10], fmt: (n: number) => String(n),
  };
  it("値ごとに棒を 1 本描き、null の棒は描かない。凡例がある", () => {
    const svg = groupedColumns(chart);
    assert.equal(svg.match(/<path class="s[12]"/g)?.length, 3);
    assert.ok(svg.includes(">X<") && svg.includes(">Y<"));
  });
  it("読み上げ用の title と desc がある", () => {
    const svg = groupedColumns(chart);
    assert.ok(svg.includes('<title id="t">t</title>') && svg.includes('<desc id="d">d</desc>'));
  });
  it("文字をエスケープする", () => assert.ok(groupedColumns({ ...chart, groups: [["a<b"], ["&"]] }).includes("a&lt;b")));
});

describe("stackedBars", () => {
  it("合計を端に書き、幅が足りない部分の値は書かない", () => {
    const svg = stackedBars({
      title: "t", desc: "d", axisLabel: "x", unit: "ms", xMax: 18,
      bars: [{ label: "A", segments: [{ name: "a", cls: "s3", value: 10 }, { name: "b", cls: "s4", value: 0.1 }, { name: "c", cls: "s5", value: 3 }] }],
    });
    assert.ok(svg.includes("13.1 ms"));
    assert.ok(svg.includes(">10.0<"));
    assert.ok(!svg.includes(">0.1<"));
  });
});

const base = { title: "t", desc: "d" };
const bad = (spec: unknown, re: RegExp) => assert.throws(() => renderFigure(spec as FigureSpec), re);

describe("部品", () => {
  it("textWidth: 全角はサイズと同じ、半角は小さく、太字は広い", () => {
    assert.equal(textWidth("あい", 10), 20);
    assert.ok(textWidth("ab", 10) < 20 && textWidth("ab", 10, 700) > textWidth("ab", 10));
  });
  it("niceTicks: 1、2、5 の倍数の目盛りで、範囲を含む", () => {
    const t = niceTicks(0, 182, 4);
    assert.deepEqual(t.ticks, [0, 50, 100, 150, 200]);
    assert.ok(t.min <= 0 && t.max >= 182);
  });
});

describe("入力の検査", () => {
  it("title と desc がない図は、エラー", () => {
    bad({ kind: "bars", title: "", desc: "d", axisLabel: "a", items: [{ label: "a", value: 1 }] }, /title/);
    bad({ kind: "bars", title: "t", desc: "", axisLabel: "a", items: [{ label: "a", value: 1 }] }, /desc/);
  });
  it("箱に収まらないラベルは、クリップせず、エラー", () => {
    bad({ ...base, kind: "diagram", height: 60, parts: [{ box: [0, 0, 60, 30], lines: ["とても長い名前がここにあり、箱の幅に収まらない"] }] }, /収まらない/);
  });
  it("bars: 負の値はエラー（棒は 0 から）。highlight が items にないときもエラー", () => {
    bad({ ...base, kind: "bars", axisLabel: "a", items: [{ label: "a", value: -1 }] }, /0 から/);
    bad({ ...base, kind: "bars", axisLabel: "a", items: [{ label: "a", value: 1 }], highlight: ["b"] }, /highlight/);
  });
  it("lines: 色で区別する系列は 3 つまで。highlight なら増やせる", () => {
    const s = (n: string) => ({ name: n, values: [1, 2] });
    bad({ ...base, kind: "lines", axisLabel: "a", xLabels: ["x", "y"], series: [s("a"), s("b"), s("c"), s("d")] }, /3 つまで/);
    assert.ok(renderFigure({ ...base, kind: "lines", axisLabel: "a", xLabels: ["x", "y"], series: [s("a"), s("b"), s("c"), s("d")], highlight: "a" } as FigureSpec).includes("<svg"));
  });
  it("tiles: 状態には statusText が要る。meter: 値は max 以下", () => {
    bad({ ...base, kind: "tiles", tiles: [{ label: "a", value: "1", status: "ok" }] }, /statusText/);
    bad({ ...base, kind: "meter", meters: [{ label: "a", value: 2, max: 1 }] }, /max 以下/);
  });
  it("grid: 知らない id、重複したセル、メンバーでない節点を含む枠は、エラー", () => {
    const n = (id: string, row: number, col: number) => ({ id, row, col, lines: [id] });
    bad({ ...base, kind: "grid", nodes: [n("a", 0, 0)], edges: [{ from: "a", to: "z" }] }, /nodes にない/);
    bad({ ...base, kind: "grid", nodes: [n("a", 0, 0), n("b", 0, 0)] }, /同じセル/);
    bad({ ...base, kind: "grid", nodes: [n("a", 0, 0), n("b", 0, 1), n("c", 0, 2)], groups: [{ label: "g", nodes: ["a", "c"] }] }, /含む/);
  });
  it("sequence: 知らない参加者はエラー。timeline: 軸の外の日付はエラー。matrix: 座標は 0〜1", () => {
    bad({ ...base, kind: "sequence", participants: [{ id: "a", name: "A" }, { id: "b", name: "B" }], items: [{ from: "a", to: "z", label: "x" }] }, /participants にない/);
    bad({ ...base, kind: "timeline", start: "2026-04-01", end: "2026-05-01", lanes: [{ name: "a", items: [{ label: "x", date: "2026-09-01", milestone: true }] }] }, /の外/);
    bad({ ...base, kind: "matrix", xAxis: { name: "x", low: "l", high: "h" }, yAxis: { name: "y", low: "l", high: "h" }, points: [{ label: "p", x: 2, y: 0 }] }, /0〜1/);
  });
  it("知らない kind は、エラー", () => bad({ ...base, kind: "pie" }, /kind/));
});

describe("表の双子", () => {
  it("図のデータを、Markdown の表にする（bars は降順、heatmap は行列）", () => {
    const t = figureTable({ ...base, kind: "bars", axisLabel: "a", items: [{ label: "x", value: 1 }, { label: "y", value: 3 }] } as FigureSpec) as string;
    assert.ok(t.split("\n")[2].includes("y") && t.split("\n")[3].includes("x"));
    const h = figureTable({ ...base, kind: "heatmap", rows: ["r"], cols: ["c1", "c2"], values: [[1, null]], legendName: "n" } as FigureSpec) as string;
    assert.ok(h.includes("| r | 1 | – |"));
  });
  it("構成図と流れの図は、表にならない（null）", () => {
    assert.equal(figureTable({ ...base, kind: "grid", nodes: [{ id: "a", row: 0, col: 0, lines: ["a"] }] } as FigureSpec), null);
    assert.equal(tableOf("templates/figures/example-request.fig.json"), null);
  });
  it("tableOf: 例の仕様から、値の入った表が出る", () => assert.ok((tableOf("templates/figures/example-ranking.fig.json") as string).includes("182")));
});

describe("例の図は、機能を使っている", () => {
  const svg = (n: string) => generate(`templates/figures/${n}.fig.json`);
  it("比較図は、追加と削除を、色と記号で示す", () => {
    const s = svg("example-options");
    assert.ok(s.includes("hadd") && s.includes("hrem") && s.includes("glyph"));
  });
  it("タイムラインは、今日の線とひし形を持つ", () => {
    const s = svg("example-roadmap");
    assert.ok(s.includes('class="today"') && s.includes("<polygon"));
  });
  it("KPI タイルの状態は、記号と文字を併記する", () => {
    const s = svg("example-kpi");
    assert.ok(s.includes("注意") && s.includes("正常") && s.includes("glyph"));
  });
  it("折れ線は、終端に丸い印（リング）を付ける", () => assert.ok(svg("example-trend").includes("ring")));
  it("強調した横棒は、強調以外が灰色", () => assert.ok(svg("example-ranking").includes('class="gray"')));
});

describe("配置の警告と自動調整", () => {
  const n = (id: string, row: number, col: number) => ({ id, row, col, lines: [id] });
  /** a→d と c→b が、同じ通路を共有して、X 字に交差する配置。 */
  const crossing: GridSpec = {
    ...base, kind: "grid",
    nodes: [n("a", 0, 0), n("b", 0, 1), n("c", 1, 0), n("d", 1, 1)],
    edges: [{ from: "a", to: "d" }, { from: "c", to: "b" }],
  };
  it("例の図は、警告が 0 件", () => {
    for (const f of specs) assert.deepEqual(lintFigure(JSON.parse(readFileSync(f, "utf8")) as FigureSpec), [], f);
  });
  it("交差する矢印を、警告で指す（矢印の両端の id が入る）", () => {
    const w = lintFigure(crossing);
    assert.equal(w.length, 1);
    assert.ok(w[0].includes("a→d") && w[0].includes("c→b") && w[0].includes("交差"));
  });
  it("allowCrossings なら、警告が出ない", () => assert.deepEqual(lintFigure({ ...crossing, allowCrossings: true }), []));
  it("arrange: 同じ行の節点を入れ替えて、交差を 0 にする。同じ入力から、同じ結果", () => {
    const r = arrange(crossing);
    assert.equal(r.before, 1);
    assert.equal(r.after, 0);
    assert.deepEqual(lintFigure(r.spec), []);
    assert.deepEqual(arrange(crossing).spec, r.spec);
    assert.equal(crossing.nodes[0].col, 0, "元の仕様は変えない");
  });
  it("arrange: 行をまたぐ入れ替えはしない（行の順を保つ）", () => {
    const r = arrange(crossing);
    for (const node of r.spec.nodes) assert.equal(node.row, crossing.nodes.find((m) => m.id === node.id)!.row);
  });
  it("compare の警告は、変更前・変更後を区別する", () => {
    const w = lintFigure({ ...base, kind: "compare", before: crossing, after: { nodes: [n("a", 0, 0)] } } as FigureSpec);
    assert.ok(w[0].startsWith("変更前の図:"));
  });
});
