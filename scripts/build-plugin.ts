#!/usr/bin/env node
// エンジンの CLI と依存のパッケージを1つのファイルにまとめ、JSON Schema とフォントと一緒にプラグインに置く（ADR 0013）。
// 使い方：node scripts/build-plugin.ts
// 出力：plugins/kothar/engine/dist/kothar.mjs、plugins/kothar/engine/schema/、plugins/kothar/engine/fonts/

import { cpSync, mkdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { build } from "esbuild";

const root = join(import.meta.dirname, "..");
const engine = join(root, "plugins", "kothar", "engine");

rmSync(engine, { recursive: true, force: true });
mkdirSync(join(engine, "dist"), { recursive: true });
await build({
  entryPoints: [join(root, "packages", "cli", "src", "index.ts")],
  outfile: join(engine, "dist", "kothar.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  legalComments: "eof",
  // まとめたファイルの中の CommonJS のパッケージが require を使えるようにする
  banner: { js: "import { createRequire as __kotharCreateRequire } from 'node:module'; const require = __kotharCreateRequire(import.meta.url);" },
  logLevel: "warning",
});
// エンジンは、まとめたファイルの1つ上のディレクトリから schema/ と fonts/ を読む
cpSync(join(root, "packages", "core", "schema"), join(engine, "schema"), { recursive: true });
cpSync(join(root, "packages", "core", "fonts"), join(engine, "fonts"), { recursive: true });
console.log("plugins/kothar/engine/ を書きました。");
