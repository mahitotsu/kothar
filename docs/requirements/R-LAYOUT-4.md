---
id: R-LAYOUT-4
sources: [X02]
verification: lint
cycle: 1
approved_cycle: 1
---

# R-LAYOUT-4

同じ文法を参照する別のモデルを描くとき、render は、文法を変えずに、その文法の規則を満たす配置を出力する。

## 検証

X01 と同じ文法のファイルを変えずに、X02 の例の入力で render した配置の結果に lint を実行し、規則1〜9の違反が0件で、ピン留めが0件なら合格とする。
