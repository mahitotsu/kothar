---
id: R-AI-6
sources: [X11]
verification: AI の評価
cycle: 3
approved_cycle: 3
---

# R-AI-6

検査の誤りと違反を直すよう頼まれたとき、プラグインは、文法と語彙を変えず、ピン留めを足さずに、モデルだけを直して、入力の誤りと違反を0件にする。

## 検証

X11 の例の依頼を3回行い、3回とも、直したモデルの lint が入力の誤りも違反も0件で、語彙と文法のファイルが変わっておらず、直したモデルが [benchmarks/sample-arch/model.yaml](../../benchmarks/sample-arch/model.yaml) と、語彙と文法のパスを除いて同じ内容なら合格とする。
