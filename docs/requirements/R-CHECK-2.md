---
id: R-CHECK-2
sources: [X07]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-CHECK-2

渡された SVG が、文法とモデルから描いた SVG とバイト単位で一致するとき、check は、成功の終了コードで終わる。

## 検証

X07 の例のモデルと、そのモデルから描き直した SVG を渡して check を実行し、終了コードが0なら合格とする。
