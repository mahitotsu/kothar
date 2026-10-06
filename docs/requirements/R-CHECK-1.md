---
id: R-CHECK-1
sources: [X07]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-CHECK-1

渡された SVG が、文法とモデルから描いた SVG と一致しない場合、check は、描き直しが要ることを報告し、失敗の終了コードで終わる。

## 検証

X07 の例のモデルと、ノードと線を足す前のモデルから描いた SVG を渡して check を実行し、render で描き直すよう示すメッセージが出て、終了コードが0以外なら合格とする。
