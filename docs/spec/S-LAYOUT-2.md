---
id: S-LAYOUT-2
status: 確定
satisfies: [R-PIN-1, R-PIN-3]
grounds: [packages/core/test/acceptance.test.ts]
---

# S-LAYOUT-2：ピン留め

S-LAYOUT-1 の配置のあとで、ピン留めしたノードを指定した座標に移す。そのノードにつながる線と、移したノードを通るようになった線を、S-LAYOUT-1 の経路探索で引き直す。ピン留めしていないノードは動かさない。

ピン留めで文法の規則が破れても、配置はそのまま出力する。破れたことは lint で報告する（S-LINT-1）。
