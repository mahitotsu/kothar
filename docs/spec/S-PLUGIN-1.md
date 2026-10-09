---
id: S-PLUGIN-1
status: 仮説
satisfies: [R-PLUGIN-1, R-PLUGIN-2]
grounds: [docs/adr/0004-engine-plugin-split.md]
---

# S-PLUGIN-1：プラグインの構成

`plugins/kothar` に、次の2つのスキルを置く。ルートの `.claude-plugin/marketplace.json` にこのプラグインを載せ、リポジトリをマーケットプレイスとして加えれば入れられるようにする（ADR 0004）。

| スキル | 使われる依頼 |
| --- | --- |
| `draft-model` | 設計書からモデルを下書きし、図を描く（S-PLUGIN-2） |
| `fix-model` | lint の入力の誤りと違反を直す（S-PLUGIN-3） |

Claude Agent SDK からは、プラグインのディレクトリを指定して読み込む（S-PLUGIN-4）。
