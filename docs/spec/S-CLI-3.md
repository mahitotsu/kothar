---
id: S-CLI-3
status: 仮説
satisfies: [R-CHECK-3]
grounds: [docs/adr/0003-ai-scope.md, docs/adr/0004-engine-plugin-split.md]
---

# S-CLI-3：ネットワークを使わない

`packages/core` と `packages/cli` は、実行時にネットワークにアクセスしない。依存は elkjs と、同梱するフォントファイルだけとする。
