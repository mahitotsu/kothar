---
id: R-DET-2
sources: [X06]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-DET-2

モデルに線を1本足して描くとき、render は、ほかのノードの移動量を上限以下に抑える。

## 検証

X06 の例の変更前と変更後のモデルで render し、足した線の両端以外のノードの移動量の平均が 20px 以下なら合格とする。
