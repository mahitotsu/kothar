---
id: R-LAYOUT-1
sources: [X01, X06, X07]
verification: lint
cycle: 1
approved_cycle: 1
---

# R-LAYOUT-1

ピン留めのないモデルを描くとき、render は、文法の規則（[grammar.md](../../benchmarks/sample-arch/grammar.md) の規則2〜6）を満たす配置を出力する。

## 検証

X01 の例の入力、X06 の例の変更後のモデル、X07 の例のモデルで render した配置の結果に lint を実行し、規則2〜6の違反がどれも0件なら合格とする。
