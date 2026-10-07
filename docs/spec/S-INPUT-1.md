---
id: S-INPUT-1
status: 確定
satisfies: [R-RENDER-1, R-LAYOUT-4]
grounds: [docs/adr/0002-diagram-input.md, docs/adr/0008-input-notation.md, docs/adr/0009-attribute-vocabulary.md, packages/core/test/acceptance.test.ts, packages/cli/test/cli.test.ts]
---

# S-INPUT-1：語彙、文法、モデルのファイル

語彙、文法、モデルを、別々の YAML のファイルに書く。

| ファイル | 書くこと | 参照するもの |
| --- | --- | --- |
| 語彙 | 属性のキーと、とりうる値。線の種類（`kind`）の一覧 | なし |
| 文法 | 配置の約束事（S-GRAMMAR-1） | 語彙のファイルのパス |
| モデル | 要素と線と属性（S-INPUT-2） | 語彙のファイルと文法のファイルのパス |

同じ語彙と文法のファイルを、複数のモデルから参照できる。CLI に渡すのはモデルのファイルだけで、語彙と文法はモデルの参照から読む。パスは、参照する側のファイルのあるディレクトリからの相対パスとする。

3つのファイルは、それぞれの JSON Schema で検査する。語彙にないキーや値をモデルや文法に書いたら、ファイル名、場所、書かれた値、語彙にある候補を報告して、描かずに終わる。
