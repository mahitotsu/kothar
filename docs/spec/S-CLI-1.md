---
id: S-CLI-1
status: 確定
satisfies: [R-RENDER-1, R-PIN-2, R-LINT-1, R-LINT-2]
grounds: [docs/adr/0004-engine-plugin-split.md, packages/core/test/acceptance.test.ts, packages/cli/test/cli.test.ts]
---

# S-CLI-1：コマンド

`packages/cli` に `kothar` コマンドを置き、`render`、`lint`、`check` を持たせる。配置、描画、検査の処理は `packages/core` に置く。

- `render <モデル> --out <SVG のパス>`：SVG と、同じ名前で拡張子を `.json` にした配置の結果を書く。ピン留めの数とノードを標準出力に出す。
- `lint <モデル>`：S-LINT-1 の結果を出す。
- `check <モデル> <SVG のパス>`：S-CLI-2 による。

入力（語彙、文法、モデル）に誤りがあるときは、見つけた誤りをすべて、ファイル名と場所とあわせて出し、終了コード2で終わる（S-INPUT-1）。

コマンドの名前と引数は、PR/FAQ と同じく仮である。
