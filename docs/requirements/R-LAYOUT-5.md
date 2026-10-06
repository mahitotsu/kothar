---
id: R-LAYOUT-5
sources: [X01]
verification: 人の確認
cycle: 1
approved_cycle: 1
---

# R-LAYOUT-5

render は、手で座標を指定して描いた元の図と同じ意図が読み取れる図を出力する。

## 検証

X01 の例の入力で render した SVG を [handplaced.svg](../../benchmarks/sample-arch/handplaced.svg) と並べ、次のすべてが一致すれば合格とする。座標は一致しなくてよい。

- 各ノードがどの領域（上段、本流、下段、端の列）にあるか
- 本流のノードの左右の順
- 各線のスタイル（実線、破線、点線、細い点線）と、出る辺と入る辺
- 各グループに含まれるノード
