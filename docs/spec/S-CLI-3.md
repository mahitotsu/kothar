---
id: S-CLI-3
status: 確定
satisfies: [R-CHECK-3]
grounds: [docs/adr/0003-ai-scope.md, docs/adr/0004-engine-plugin-split.md, packages/cli/test/cli.test.ts]
---

# S-CLI-3：ネットワークを使わない

`packages/core` と `packages/cli` は、実行時にネットワークにアクセスしない。実行時の依存は、elkjs（配置）、yaml（入力の読み込み）、ajv（JSON Schema の検査）と、同梱するフォントファイルだけとする。
