---
id: R-PIN-3
sources: [X03]
verification: lint
cycle: 1
approved_cycle: 1
---

# R-PIN-3

モデルがノードをピン留めしているとき、render は、ピン留めしていないノードを、文法の規則を満たすように置く。

## 検証

X03 の例の入力で render した配置の結果に lint を実行し、規則1〜9の違反が0件なら合格とする。
