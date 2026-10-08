---
id: S-LAYOUT-5
status: 確定
satisfies: [R-VIEW-3]
grounds: [packages/core/test/views.test.ts]
---

# S-LAYOUT-5：出さないノードと線

文法のコンパイラが、出さない領域のノード、そのノードにつながる線、出さない線の規則に当たる線を、配置の前にモデルから除く。除いたあとのモデルを、配置、出力、検査のすべてに使う。

グループのメンバーがすべて除かれたときは、そのグループも除く。
