---
id: R-AI-5
sources: [X10]
verification: AI の評価
cycle: 3
approved_cycle: 3
---

# R-AI-5

プラグインが描いた図は、同じモデルから CLI で描いた図と同じである。

## 検証

X10 の例の依頼を3回行い、3回とも、プラグインが描いた SVG と、同じモデルから `kothar render` で描いた SVG が、バイト単位で一致すれば合格とする。
