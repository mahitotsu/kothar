---
id: S-LAYOUT-4
status: 確定
satisfies: [R-VIEW-2, R-VIEW-5]
grounds: [docs/adr/0001-layout-approach.md, docs/spikes/0006-elk-partition.md, packages/core/test/views.test.ts]
---

# S-LAYOUT-4：列の配置

列に割り当てたノードは、ELK の layered のパーティション（`elk.partitioning`）で配置する。ルートの直下のノードとグループに、列の番号をパーティションの番号として付け、パーティションの順に左から右へ層を並べさせる（[検証 0006](../spikes/0006-elk-partition.md)）。

グループの中のノードの列は、グループの列にそろえる。グループの中に、違う列に割り当てたノードがあれば、入力の誤りとする。

列（`column`）の領域と、ほかの置き方（`hidden` を除く）の領域は、1つの文法の中で混ぜない。混ぜたら入力の誤りとする。
