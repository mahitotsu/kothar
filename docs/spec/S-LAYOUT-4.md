---
id: S-LAYOUT-4
status: 仮説
satisfies: [R-VIEW-2, R-VIEW-5]
grounds: [docs/adr/0001-layout-approach.md]
---

# S-LAYOUT-4：列の配置

列に割り当てたノードは、ELK の layered のパーティション（`elk.partitioning`）で配置する。列の番号をパーティションの番号にし、パーティションの順に左から右へ層を並べさせる。

グループの中のノードの列は、グループの列にそろえる。グループの中に、違う列に割り当てたノードがあれば、入力の誤りとする。

入れ子のグループがあるときにパーティションが効くかは、確かめていない。
