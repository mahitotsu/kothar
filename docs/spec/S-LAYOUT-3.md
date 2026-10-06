---
id: S-LAYOUT-3
status: 仮説
satisfies: [R-DET-2]
grounds: [docs/spikes/0001-elk-layout.md]
---

# S-LAYOUT-3：変更に対する安定性

ELK に渡すノードと線の順は、モデルに書いた順とし、ELK にもモデルの順を考慮させる（`considerModelOrder`）。線を1本足しても、ほかのノードの層と層内の順が変わりにくくする。

検証 0001 では、ノードを1つ足したときの移動量の合計は案 E で 140px だった。線を1本足したときの値は測っていない。
