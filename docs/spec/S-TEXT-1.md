---
id: S-TEXT-1
status: 確定
satisfies: [R-LAYOUT-2, R-DET-1, R-READ-1]
grounds: [docs/adr/0006-text-width-measurement.md, docs/adr/0007-license.md, docs/adr/0011-bundled-font.md, docs/spikes/0004-font-metrics.md, packages/core/test/acceptance.test.ts, docs/spikes/0005-human-review.md]
---

# S-TEXT-1：文字幅

`packages/core/fonts/` に BIZ UDPGothic（ADR 0011）と、そのライセンスの文書（OFL.txt）を同梱する。ラベルの幅は、このフォントのメトリクスから fontkit で測る。

SVG には、このフォントの名前を指定し、図に使う字だけのサブセットを埋め込む（S-OUT-2）。
