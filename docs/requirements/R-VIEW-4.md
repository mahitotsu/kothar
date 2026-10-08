---
id: R-VIEW-4
sources: [X08]
verification: テスト
cycle: 2
approved_cycle: 2
---

# R-VIEW-4

文法がグループの枠をまたぐ線のスタイルを決めるとき、render は、枠をまたぐ線をそのスタイルで、またがない線を別に決めたスタイルで描く。

## 検証

X08 の例で、cdn→apigw、apigw→idp、order→psp、worker→user の線のスタイルが境界をまたぐ線のスタイルで、ほかの線のスタイルが境界の中の線のスタイルであれば合格とする。
