---
id: S-OUT-2
status: 仮説
satisfies: [R-RENDER-1, R-READ-1, R-READ-2, R-LAYOUT-5]
grounds: [docs/adr/0010-font-embedding.md, docs/spikes/0004-font-metrics.md]
---

# S-OUT-2：SVG のレンダラー

配置の結果から SVG を描く。線のスタイル（実線、破線、点線、太さ、色）は、文法の線の種類から決める。

文法の領域に `label` があるときは、領域の名前を描く。`above-caller` と `below-main` の領域は帯の名前を文字で書き、`side-column` の領域は破線の枠で囲んで名前を書く。

SVG は、スクリプトと外部のファイルへの参照を含めない。フォントは、図に使う字（ノード、グループ、線のラベル、領域の名前）だけを含むサブセットを fontkit で作り、`data:` URL にして `@font-face` で埋め込む（ADR 0010）。
