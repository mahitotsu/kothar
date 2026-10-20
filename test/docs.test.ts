// 人が読む文書の検査。リンクとアンカーの行き先、表の幅、読み手の行。規則は CLAUDE.md の「文書の書き方」。
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { anchors, brokenLinks, hasReaderLine, headHas, slug, wideTables } from "../scripts/doc-checks.ts";

const md = (dir: string) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith(".md")).map((f) => `${dir}/${f}`) : []);
const skills = existsSync("skill-draft") ? readdirSync("skill-draft").map((d) => `skill-draft/${d}/SKILL.md`).filter(existsSync) : [];
/** リンクを検査する文書。 */
const all = ["README.md", "CLAUDE.md", ...md("docs"), ...md("docs/internal"), ...skills];
/** 読み手の行を持つべき文書（README と CLAUDE.md、スキルの下書きを除く、docs/ の文書）。 */
const readerDocs = [...md("docs"), ...md("docs/internal")];

describe("slug", () => {
  it("GitHub と同じ: 記号は消え、空白はハイフンになり、日本語は残る", () => {
    assert.equal(slug("2-5. 使い分けの目安"), "2-5-使い分けの目安");
    assert.equal(slug("B. 条件と採用"), "b-条件と採用");
    assert.equal(slug("入口（`src/app.ts`）"), "入口srcappts");
  });
});

describe("リンクとアンカー", () => {
  for (const f of all) {
    it(`${f}: 相対リンクとアンカーの行き先がある`, () => assert.deepEqual(brokenLinks(f), []));
  }
  it("検査が効く: 行き先のない見出しは、アンカーの集合にない", () => {
    assert.equal(anchors("README.md").has("存在しない見出し"), false);
  });
});

describe("最初に読まれる文書", () => {
  for (const f of ["README.md", "docs/report.md"]) {
    it(`${f}: 5 列を超える表がない`, () => assert.deepEqual(wideTables(f), []));
  }
  it("report.md は、冒頭に読み手と要旨がある", () => {
    assert.ok(headHas("docs/report.md", "読み手"));
    assert.ok(headHas("docs/report.md", "## 要旨"));
  });
  it("README.md は、冒頭に読み手を書く", () => assert.ok(hasReaderLine("README.md", 10)));
});

describe("読み手の行", () => {
  for (const f of readerDocs) {
    it(`${f}: 冒頭に読み手を書いてある`, () => assert.ok(hasReaderLine(f), `${f} の冒頭 14 行に「読み手」がない`));
  }
});

describe("検査の部品", () => {
  it("wideTables は 6 列の表を見つける", () => {
    assert.ok(wideTables("test/fixtures/wide-table.md").length > 0);
  });
  it("brokenLinks は、ないファイルとないアンカーを見つける", () => {
    assert.equal(brokenLinks("test/fixtures/broken-links.md").length, 2);
  });
});
