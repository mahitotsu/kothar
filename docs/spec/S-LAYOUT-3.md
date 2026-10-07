---
id: S-LAYOUT-3
status: 確定
satisfies: [R-DET-2]
grounds: [docs/spikes/0001-elk-layout.md, packages/core/test/acceptance.test.ts]
---

# S-LAYOUT-3：変更に対する安定性

ELK に渡すノードと線の順は、モデルに書いた順とし、ELK にもモデルの順を考慮させる（`considerModelOrder`）。線を1本足しても、ほかのノードの層と層内の順が変わりにくくする。

線のラベルは ELK に渡さない（S-LAYOUT-1）。ELK に渡すと、ラベルの場所を取るために、線を1本足しただけでほかのノードの並びが変わった。

この方式では、X06 で線を1本足すと、本流と下段のノードの順は入れ替わらないが、足した線に関係しないノードも上下に動く（ユーザー、CDN、API Gateway が 57px）。
