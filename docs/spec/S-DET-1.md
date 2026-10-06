---
id: S-DET-1
status: 仮説
satisfies: [R-DET-1, R-CHECK-2]
grounds: [docs/adr/0005-implementation-language.md]
---

# S-DET-1：決定性

同じ文法とモデルから、バイト単位で同じ SVG と JSON を出すために、次を守る。

- 時刻、乱数、環境変数、ファイルシステムの列挙順に依存しない。
- 座標は小数点以下2桁に丸めてから出力する。
- 配列とキーの順を固定する（S-OUT-1）。
- elkjs の版を固定する。
