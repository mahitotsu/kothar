// 文書の検査。雛形（templates/）と、このプラグイン自身の文書（README.md、docs/）に、check-docs の検査をかける。規則は skills/write-docs/SKILL.md。
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { describe, it } from "node:test";
import {
  aiSubject, anchors, brokenLinks, checkDocs, collectMarkdown, hasReaderLine, longSentences, placeholders, slug, summaryLength, vagueHeadings, vagueWords, warnDocs, wideTables,
} from "../scripts/doc-checks.ts";

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
    it(`${f}: 誤りも警告もない（埋め残しも含む）`, () => assert.deepEqual([...checkDocs([f]), ...warnDocs([f])], []));
  }
});

describe("雛形の警告", () => {
  it("雛形は、警告も出さない", () => assert.deepEqual(warnDocs(templates, {}), []));
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
  it("longSentences は、80 字を超える本文の文だけを見つける（表、details の中は除く）", () => {
    assert.equal(longSentences("test/fixtures/warnings.md").length, 1);
    assert.equal(longSentences("test/fixtures/warnings.md", 200).length, 0);
  });
  it("vagueWords は、コードの外の曖昧語を見つける（「適切に」「必要に応じて」「なるべく」）", () => {
    assert.equal(vagueWords("test/fixtures/warnings.md").length, 3);
  });
  it("summaryLength は、3〜5 項目の外の要旨を見つける", () => {
    assert.equal(summaryLength("test/fixtures/warnings.md").length, 1);
    assert.equal(summaryLength("test/fixtures/placeholder.md").length, 0);
  });
  it("vagueHeadings は、「概要」のような見出しを見つける（番号つきも）", () => {
    assert.equal(vagueHeadings("test/fixtures/warnings.md").length, 1);
  });
  it("aiSubject は、一人称の主語を見つける", () => assert.equal(aiSubject("test/fixtures/warnings.md").length, 1));
  it("warnDocs は、警告を `file:line 警告` の形で返す", () => {
    const w = warnDocs(["test/fixtures/warnings.md"]);
    assert.equal(w.length, 1 + 3 + 1 + 1 + 1);
    assert.ok(w.every((x) => /^test\/fixtures\/warnings\.md:\d+ 警告 /.test(x)));
  });
});
