// 図の検査。仕様（*.fig.json）から作った SVG が整っていることと、置いた SVG が生成物と一致すること。
import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { groupedColumns, stackedBars } from "../scripts/chart-figures.ts";
import { generate, stale, svgPath } from "../scripts/figure.ts";
import { renderFigure } from "../scripts/render-figure.ts";

const specs = readdirSync("templates/figures").filter((f) => f.endsWith(".fig.json")).map((f) => `templates/figures/${f}`);

describe("置いた図は、仕様の生成物と一致する", () => {
  it("例の仕様が 4 つある", () => assert.equal(specs.length, 4));
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
