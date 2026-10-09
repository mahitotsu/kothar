---
id: S-PLUGIN-5
status: 仮説
satisfies: [R-AI-1, R-AI-2, R-AI-5, R-AI-6, R-PLUGIN-1]
grounds: [docs/adr/0004-engine-plugin-split.md, docs/adr/0012-plugin-engine-call.md, docs/adr/0013-plugin-engine-delivery.md, docs/spikes/0007-plugin-reach.md]
---

# S-PLUGIN-5：プラグインからエンジンを呼ぶ方式

スキルは、AI に、プラグインの `bin/kothar` を Bash ツールで実行させる（ADR 0012）。`bin/kothar` は、プラグインの中の `engine/dist/kothar.mjs` を Node.js で起動する。CLI の出力（違反の一覧、入力の誤り）を AI が読んで、モデルを直す。

`engine/` には、エンジンの CLI と依存のパッケージを esbuild で1つにまとめたファイル（`dist/kothar.mjs`）と、JSON Schema（`schema/`）とフォント（`fonts/`）を置く（ADR 0013）。まとめたファイルは `npm run build:plugin` で作り、コミットする。CI で作り直して、コミットしたものと一致するかを確かめる。
