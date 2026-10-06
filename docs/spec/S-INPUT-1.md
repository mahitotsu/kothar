---
id: S-INPUT-1
status: 仮説
satisfies: [R-RENDER-1, R-LAYOUT-4]
grounds: [docs/adr/0002-diagram-input.md]
---

# S-INPUT-1：文法とモデルのファイル

文法とモデルを、別のファイルに書く。モデルのファイルは、使う文法のファイルをパスで参照する。同じ文法のファイルを、複数のモデルから参照できる。

記述形式は YAML とする仮説を置く。決めるのは T1 の ADR である。

CLI に渡すのはモデルのファイルだけで、文法はモデルの参照から読む。
