---
id: S-LAYOUT-1
status: 仮説
satisfies: [R-LAYOUT-1, R-LAYOUT-2, R-LAYOUT-3, R-LAYOUT-4, R-LAYOUT-5, R-LAYOUT-6, R-LAYOUT-7, R-READ-2]
grounds: [docs/spikes/0001-elk-layout.md, docs/spikes/0002-post-place.md, docs/adr/0001-layout-approach.md]
---

# S-LAYOUT-1：配置の方式

検証 0002 の案 G の二段構成で配置する。

1. 本流と下段のノードを、ELK の layered（流れの向き、直交の経路）で配置する。グループは入れ子のノード、線の出入りの辺はポートの `FIXED_SIDE` で指定する。逆向きの線は、向きを反転して渡し、結果の点列を戻す。
2. 上段のノードを、呼び出す側のノードの真上に置く。複数の呼び出す側があるときは、上段のノードの幅を、呼び出す側すべての中心を含むまで広げる。
3. 端の列のノードを、ほかのすべてのノードとグループより右に、縦に並べて置く。
4. 2と3で置いたノードへの線を、文法の出る辺と入る辺から、ノードを避ける直交の経路探索で引く。同じ辺に複数の線が出入りするときは、辺の上の別の点に分ける。

ADR 0001 は提案の状態で、T7 で判定する。
