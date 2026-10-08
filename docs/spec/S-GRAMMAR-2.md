---
id: S-GRAMMAR-2
status: 確定
satisfies: [R-VIEW-1, R-VIEW-2, R-VIEW-3, R-VIEW-4]
grounds: [docs/adr/0009-attribute-vocabulary.md, packages/core/test/views.test.ts]
---

# S-GRAMMAR-2：文法の語彙の追加

S-GRAMMAR-1 の文法に、次の語彙を加える。

| 語彙 | 書き方 | 意味 |
| --- | --- | --- |
| 列 | 領域の `place: column` と `column: <番号>` | ノードを、番号の列に置く。番号の小さい列から左に並べる。グループは、メンバーの列に置く |
| 出さない領域 | 領域の `place: hidden` | その領域のノードと、そのノードにつながる線を出さない |
| 出さない線 | 線の規則の `hidden: true` | その規則に当たる線を出さない |
| グループの中という条件 | 領域の `when` の `inGroup: { <属性>: <値> }` | その属性を持つグループの中（入れ子を含む）にあるノードに当たる |
| 枠をまたぐという条件 | 線の規則の `crosses: { <属性>: <値> }` | その属性を持つグループについて、片方の端だけが中にある線に当たる |

条件（`when`）のない領域は、`main` に限らず、どの置き方でもよい。条件のない領域が1つもなければ、入力の誤りとする。

線のスタイルの太さに、`thick` を加える。

例は [benchmarks/sample-arch/trust.yaml](../../benchmarks/sample-arch/trust.yaml) と [request-flow.yaml](../../benchmarks/sample-arch/request-flow.yaml) にある。1つのモデルに対して複数の文法を置けるように、ベンチマークの説明の書き方（文書体系）を改めた。
