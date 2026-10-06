---
id: R-RENDER-2
sources: [X01, X06]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-RENDER-2

文法とモデルを渡して描くとき、render は、配置の結果を JSON のファイルに出力する。配置の結果は、各ノードの座標と大きさ、各線の経路の点列、各グループの枠を含む。

## 検証

X01 の例の入力と X06 の例の変更後のモデルで render を実行し、出力の JSON に、モデルのすべてのノード、線、グループについて上の値があれば合格とする。
