---
id: S-LAYOUT-1
status: 確定
satisfies: [R-LAYOUT-1, R-LAYOUT-2, R-LAYOUT-3, R-LAYOUT-4, R-LAYOUT-5, R-LAYOUT-6, R-LAYOUT-7, R-READ-2]
grounds: [docs/spikes/0001-elk-layout.md, docs/spikes/0002-post-place.md, docs/spikes/0003-edge-overlap.md, docs/adr/0001-layout-approach.md, packages/core/test/acceptance.test.ts, docs/spikes/0005-human-review.md]
---

# S-LAYOUT-1：配置の方式

検証 0003 の案 H の二段構成で配置する。

1. 本流と下段のノードを、ELK の layered（流れの向き、直交の経路）で配置する。グループは入れ子のノードにし、グループにもノードの間隔を指定する。線の出入りの辺はポートの `FIXED_SIDE` で指定する。逆向きの線は、向きを反転して渡し、結果の点列を戻す。
2. 上段のノードを、呼び出す側のノードの真上に置く。複数の呼び出す側があるときは、上段のノードの幅を、呼び出す側すべての中心を含むまで広げる。
3. 端の列のノードを、ほかのすべてのノードとグループより右に、縦に並べて置く。
4. 2と3で置いたノードへの線を、文法の出る辺と入る辺から、ノードを避ける直交の経路探索で引く。同じ辺に複数の線が出入りするときは、辺の上の別の点に分ける。経路探索では、すでにある線とグループの枠線に沿って走ることに費用を足す。
5. 線のラベルは ELK に渡さず、配置のあとで線分の横に置く。ノード、グループの枠線、ほかのラベル、ほかの線と重ならない位置を選ぶ。ELK に渡すと、ラベルの場所を取るために、線を1本足しただけでほかのノードが大きく動いた（R-DET-2）。その代わり、層の間を 100px とって、ラベルの場所を残す。

