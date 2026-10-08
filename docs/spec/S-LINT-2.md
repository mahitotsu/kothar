---
id: S-LINT-2
status: 確定
satisfies: [R-VIEW-2, R-VIEW-5]
grounds: [packages/core/test/views.test.ts]
---

# S-LINT-2：列の規則

リンターに、文法から導く規則として、規則10（列）を加える。ノードは、割り当てた列にある（ある列のノードの中心は、それより左の列のどのノードの中心よりも右にある）。

外周を回る線の規則（規則6）では、列のノードも、通過するノードとして扱う。

規則の番号は、[benchmarks/sample-arch/trust.md](../../benchmarks/sample-arch/trust.md) の期待する不変条件の番号とする。
