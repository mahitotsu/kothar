// 図の検査。生成したものが SVG として整っていることと、リポジトリに置いた図が生成物と一致すること。
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { figures as charts, groupedColumns, stackedBars, type ExampleData } from "../scripts/chart-figures.ts";
import { figures as diagrams } from "../scripts/example-figures.ts";

const data = JSON.parse(readFileSync("docs/figures/example-data.json", "utf8")) as ExampleData;
const generated = { ...diagrams(), ...charts(data) };

describe("置いた図は、生成物と一致する", () => {
  for (const [name, svg] of Object.entries(generated)) {
    it(`${name}: 整った SVG で、ダーク対応で、docs/figures/ のファイルと同じ`, () => {
      assert.ok(svg.startsWith("<svg"));
      assert.ok(svg.includes("<title"));
      assert.ok(svg.includes("prefers-color-scheme: dark"));
      assert.equal(readFileSync(`docs/figures/${name}`, "utf8"), svg);
    });
  }
  it("同じ入力から、同じ図ができる", () => assert.deepEqual(charts(data), charts(data)));
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
