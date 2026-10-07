---
id: S-GRAMMAR-1
status: 確定
satisfies: [R-LAYOUT-1, R-LAYOUT-4, R-LINT-3]
grounds: [docs/adr/0001-layout-approach.md, docs/adr/0002-diagram-input.md, docs/adr/0008-input-notation.md, docs/adr/0009-attribute-vocabulary.md, packages/core/test/acceptance.test.ts]
---

# S-GRAMMAR-1：文法の語彙と、文法から作るもの

文法には、次のものを書く。ノードの名前は参照せず、語彙（S-INPUT-1）にある属性と線の種類だけを参照する。例は [benchmarks/sample-arch/grammar.yaml](../../benchmarks/sample-arch/grammar.yaml) にある。

| キー | 書くこと |
| --- | --- |
| `vocabulary` | 語彙のファイルのパス |
| `flow` | 流れの向き（`right`） |
| `regions` | 領域の一覧。上から順に当てはめる。各領域に、名前、置き方（`place`）、割り当てる属性の条件（`when`）、見せるときの名前（`label`）を書く |
| `styles` | 線のスタイルの一覧。線の形（実線、破線、点線）、色、太さ |
| `edges` | 線の規則の一覧。上から順に当てはめる。各規則に、線の種類（`kind`）、両端の領域の条件（`from`、`to`）、スタイル、出る辺（`exit`）、入る辺（`enter`）、流れに沿うか（`flow`）、外周を回るか（`route: around`）を書く |

領域の置き方（`place`）は、エンジンが持つ次の語彙から選ぶ（ADR 0001）。

| 置き方 | 位置 |
| --- | --- |
| `main` | 中央の帯。ELK で配置する |
| `below-main` | 本流の下の帯。ELK で配置する |
| `above-caller` | 本流の上の帯。呼び出す側の真上に、ELK の外で置く |
| `side-column` | 図の右端の列。ELK の外で置く |

エンジンは、文法を1つの中間表現に変換し、そこから次の3つを作る。同じ中間表現から作るので、配置と検査の基準が食い違わない。

1. ELK に渡す入力（向き、ポートの辺、入れ子のグループ）
2. ELK の外で置く領域の置き方
3. リンターが検査する、文法から導く不変条件（出入りの辺、領域、流れの向き、上段の位置、外周を回る線）
