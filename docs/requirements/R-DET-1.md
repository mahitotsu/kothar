---
id: R-DET-1
sources: [X06]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-DET-1

同じ文法とモデルを描くとき、render は、実行のたびに、バイト単位で同じ SVG と JSON を出力する。

## 検証

X01 の例の入力で、同じプロセスで2回、別のプロセスで2回 render し、SVG と JSON がそれぞれバイト単位で一致すれば合格とする。CI で Linux と macOS の両方で実行し、OS の間でも一致すること。
