---
id: S-INPUT-2
status: 確定
satisfies: [R-PIN-1, R-LAYOUT-1]
grounds: [docs/adr/0002-diagram-input.md, docs/adr/0009-attribute-vocabulary.md, packages/core/test/acceptance.test.ts]
---

# S-INPUT-2：モデルの中身

モデルには、次のものを書く。座標は、ピン留めのほかには書かない。

| 要素 | 持つもの |
| --- | --- |
| ノード | ID、ラベル、属性（語彙にあるキーと値の組） |
| グループ | ID、ラベル、属性、メンバー（ノードとグループの ID） |
| 線 | 出るノードかグループの ID、入るノードかグループの ID、種類（語彙にある `kind`）、ラベル |
| ピン留め | ノードの ID と、そのノードの中心の座標（x、y） |

サンプルの構成図の語彙は、検証 0001 で使った `trust`、`mode`、`concern`、グループの `boundary`、`tier`、線の `kind`（`call`、`publish`、`push`、`uses`）とする。
