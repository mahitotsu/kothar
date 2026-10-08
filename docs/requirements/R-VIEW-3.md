---
id: R-VIEW-3
sources: [X08, X09]
verification: テスト
cycle: 2
approved_cycle: 2
---

# R-VIEW-3

文法がノードや線を出さないと決めたとき、render は、そのノードと線を SVG にも配置の結果の JSON にも出さない。

## 検証

X08 の例で log、mon、kms と `uses` の線が、X09 の例で queue、worker、log、mon、kms と `call` 以外の線が、SVG と JSON のどちらにもなければ合格とする。
