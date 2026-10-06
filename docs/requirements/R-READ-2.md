---
id: R-READ-2
sources: [X05]
verification: 読み手の理解度テスト
cycle: 1
approved_cycle: 1
---

# R-READ-2

render が出力する図は、文法を知っている読み手が、手で描いた元の図と同程度以上に正しく読める。

## 検証

X05 の例の問いを、文法の説明と図だけを渡した読み手に答えさせ、X01 の例の入力で render した SVG での正答率が、handplaced.svg での正答率以上であれば合格とする。読み手には、文法を知らない LLM を使ってよい。
