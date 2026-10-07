---
id: R-LINT-3
sources: [X04]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-LINT-3

lint は、grammar.md の規則1〜9のそれぞれについて、違反を検出する。

## 検証

規則ごとに、その規則だけを破る配置の結果を用意して lint を実行し、その規則の違反が1件以上報告されれば合格とする。
