---
id: R-LAYOUT-2
sources: [X01, X06, X07]
verification: lint
cycle: 1
approved_cycle: 1
---

# R-LAYOUT-2

ピン留めのないモデルを描くとき、render は、ノード同士、およびノードと線のラベルが重ならない配置を出力する。

## 検証

X01 の例の入力、X06 の例の変更後のモデル、X07 の例のモデルで render した配置の結果に lint を実行し、規則1の違反がどれも0件なら合格とする。
