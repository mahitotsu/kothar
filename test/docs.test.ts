// 文書の検査。雛形（templates/）と、このプラグイン自身の文書（README.md、docs/）に、check-docs の検査をかける。規則は skills/write-docs/SKILL.md。
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import { anchors, brokenLinks, checkDocs, collectMarkdown, hasReaderLine, placeholders, slug, wideTables } from "../scripts/doc-checks.ts";

const skills = existsSync("skills") ? readdirSync("skills").flatMap((d) => collectMarkdown([`skills/${d}`])) : [];
const own = [...collectMarkdown(["README.md", "CLAUDE.md", "docs"]), ...skills];
const templates = collectMarkdown(["templates"]);

describe("slug", () => {
  it("GitHub と同じ: 記号は消え、空白はハイフンになり、日本語は残る", () => {
    assert.equal(slug("2-5. 使い分けの目安"), "2-5-使い分けの目安");
    assert.equal(slug("B. 条件と採用"), "b-条件と採用");
    assert.equal(slug("入口（`src/app.ts`）"), "入口srcappts");
  });
});

describe("雛形", () => {
  it("雛形が 21 ある（文書の雛形 20 と、CLAUDE.md の雛形）", () => assert.equal(templates.length, 21));
  for (const f of templates) {
    it(`${f}: 埋め残し以外の問題がない（リンク、表の幅、読み手の行、図）`, () => assert.deepEqual(checkDocs([f], { allowPlaceholders: true }), []));
  }
  it("雛形には、埋め残しの <…> がある（埋めて使うため）", () => {
    assert.ok(placeholders("templates/report.md").length > 0);
  });
});

describe("このプラグイン自身の文書", () => {
  for (const f of own) {
    it(`${f}: 問題がない（埋め残しも含む）`, () => assert.deepEqual(checkDocs([f]), []));
  }
});

describe("検査の部品", () => {
  it("wideTables は 6 列の表を見つける", () => assert.ok(wideTables("test/fixtures/wide-table.md").length > 0));
  it("brokenLinks は、ないファイルとないアンカーを見つける", () => assert.equal(brokenLinks("test/fixtures/broken-links.md").length, 2));
  it("brokenLinks は、行き先のない見出しを見つける", () => assert.equal(anchors("README.md").has("存在しない見出し"), false));
  it("placeholders は、本文の <…> だけを見つける（コードとタグは除く）", () => {
    assert.deepEqual(placeholders("test/fixtures/placeholder.md").length, 1);
  });
  it("hasReaderLine は、読み手の行のない文書を見つける", () => {
    assert.equal(hasReaderLine("test/fixtures/wide-table.md"), false);
    assert.equal(hasReaderLine("test/fixtures/placeholder.md"), true);
  });
});
