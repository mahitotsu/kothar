---
id: S-OUT-2
status: 仮説
satisfies: [R-RENDER-1, R-READ-1, R-READ-2, R-LAYOUT-5]
grounds: []
---

# S-OUT-2：SVG のレンダラー

配置の結果から SVG を描く。線のスタイル（実線、破線、点線、太さ、色）は、文法の線の種類から決める。

文法の領域に `label` があるときは、領域の名前を描く。`above-caller` と `below-main` の領域は帯の名前を文字で書き、`side-column` の領域は破線の枠で囲んで名前を書く。

SVG は、スクリプトと外部のファイルへの参照を含めない。フォントは S-TEXT-1 による。
