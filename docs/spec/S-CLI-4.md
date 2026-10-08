---
id: S-CLI-4
status: 確定
satisfies: [R-VIEW-1]
grounds: [docs/adr/0002-diagram-input.md, docs/adr/0009-attribute-vocabulary.md, packages/core/test/views.test.ts, packages/cli/test/cli.test.ts]
---

# S-CLI-4：別の文法で描く

`render`、`lint`、`check` に `--grammar <文法のパス>` を加える。指定したときは、モデルが参照する文法の代わりに、指定した文法で描き、検査する。モデルのファイルは読むだけで、書き換えない。

指定した文法は、モデルと同じ語彙のファイルを参照していなければならない（ADR 0009）。違う語彙を参照していたら、入力の誤りとして報告する。
