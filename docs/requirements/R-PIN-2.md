---
id: R-PIN-2
sources: [X03]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-PIN-2

モデルがノードをピン留めしているとき、render は、ピン留めの数とピン留めしたノードの ID を、コマンドの出力と配置の結果の JSON の両方に出す。

## 検証

X03 の例の入力で render し、コマンドの出力と JSON の両方に、ピン留めの数1と queue があれば合格とする。X01 の例の入力では、両方でピン留めの数が0であれば合格とする。
