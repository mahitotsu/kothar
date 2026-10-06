---
id: R-CHECK-3
sources: [X07]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-CHECK-3

render、lint、check は、ネットワークに接続せずに動く。

## 検証

ネットワークを遮断した CI のジョブで、X07 の例のモデルについて render、lint、check がどれも成功すれば合格とする。
