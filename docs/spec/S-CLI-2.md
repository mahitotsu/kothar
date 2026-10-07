---
id: S-CLI-2
status: 確定
satisfies: [R-CHECK-1, R-CHECK-2]
grounds: [packages/cli/test/cli.test.ts]
---

# S-CLI-2：check

check は、モデルから SVG をメモリの上で描き、渡された SVG のファイルとバイト単位で比べる。一致すれば終了コード0で終わる。一致しなければ、描き直すための render のコマンドを示して、終了コード1で終わる。
