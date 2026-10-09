---
id: S-PLUGIN-5
status: 仮説
satisfies: [R-AI-1, R-AI-2, R-AI-5, R-AI-6, R-PLUGIN-1]
grounds: [docs/adr/0004-engine-plugin-split.md]
---

# S-PLUGIN-5：プラグインからエンジンを呼ぶ方式

スキルは、エンジンの CLI（`kothar render`、`lint`、`check`）を、シェルのコマンドとして呼ぶ。CLI の出力（違反の一覧、入力の誤り）を AI が読んで、モデルを直す。

CLI を呼ぶか MCP サーバーを置くかは、T8 の ADR で決める。プラグインを入れた環境で、エンジンをどう手に入れるか（npm に公開するか、プラグインに含めるか）も、あわせて決める。
