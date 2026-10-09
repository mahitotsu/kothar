# 検証 0007：プラグインからエンジンを呼び、エンジンを届ける方法

- 実施日：2026-10-09
- 関連する ADR：[0004](../adr/0004-engine-plugin-split.md)
- 検証のコード：[spikes/plugin-reach/](../../spikes/plugin-reach/)（Claude Code 2.1.289、@anthropic-ai/claude-agent-sdk 0.3.295、esbuild 0.28.2、Node.js 24.21.0、Linux）

## 目的

ADR 0004 で、エンジンを npm のパッケージにし、プラグインはそれを呼ぶと決め、呼ぶ方式は別に決めるとした。フェーズ3では、プラグインのスキルがエンジンを呼んで、モデルを検査し、図を描く。呼ぶ方式と、プラグインを入れた環境にエンジンを届ける方法を決めるために、次の3つに答える。

1. プラグインの `bin/` に置いたコマンドと、スキルの本文に書いた `${CLAUDE_PLUGIN_ROOT}` のパスを、Claude Code と Claude Agent SDK の両方で、AI が呼べるか。
2. TypeScript のまま npm に公開したエンジンを、依存として入れて動かせるか。
3. エンジンを1つの JavaScript のファイルにまとめれば、`node_modules` なしで動き、元の CLI と同じ出力を出すか。

## 方法

### 1. プラグインからコマンドを呼ぶ

検証用のプラグイン（[probe](../../spikes/plugin-reach/probe/)）を作った。

- `bin/probe-bin`：`BIN_OK` を出すシェルのスクリプト
- `scripts/root.sh`：`ROOT_OK` を出すシェルのスクリプト
- `skills/probe/SKILL.md`：Bash ツールで `probe-bin` と `"${CLAUDE_PLUGIN_ROOT}/scripts/root.sh"` を実行し、出力をそのまま報告するよう指示するスキル

このプラグインを、次の2つの方法で読み込み、スキル（`/probe:probe`）を実行した。モデルは haiku、使える道具は Bash だけにした。各1回である。

- Claude Code：`claude -p "/probe:probe" --plugin-dir spikes/plugin-reach/probe`
- Claude Agent SDK：`query()` の `plugins` に、プラグインのディレクトリを `{ type: "local", path }` で渡した（[sdk.mjs](../../spikes/plugin-reach/sdk.mjs)）

### 2. node_modules の中の TypeScript

`node_modules/pkg/index.ts` に TypeScript のファイルを置き、パッケージとして import して、Node.js で実行した。

### 3. エンジンを1つのファイルにまとめる

esbuild で、`packages/cli/src/index.ts` と依存のパッケージを、1つの ES モジュールのファイルにまとめた。そのファイルを、`schema/` と `fonts/` と一緒に `node_modules` のないディレクトリに置き、サンプル構成図と作業プロセスのモデルを描いて、元の CLI（`node packages/cli/src/index.ts`）で描いた SVG と JSON と比べた。

## 結果

| 確かめたこと | Claude Code | Claude Agent SDK |
| --- | --- | --- |
| `bin/` のコマンド（`probe-bin`）を呼べたか | 呼べた（`BIN_OK`） | 呼べた（`BIN_OK`） |
| スキルの本文の `${CLAUDE_PLUGIN_ROOT}` のパスのコマンドを呼べたか | 呼べた（`ROOT_OK`）。パスはプラグインのディレクトリの絶対パスに置き換わっていた | 呼べた（`ROOT_OK`） |

| 確かめたこと | 結果 |
| --- | --- |
| `node_modules` の中の TypeScript のファイルを import したか | `ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING` で失敗した |
| 1つにまとめたファイルの大きさ | 5,818,735 バイト |
| 1つにまとめたファイルの出力と、元の CLI の出力 | サンプル構成図と作業プロセスの図の両方で、SVG と JSON がバイト単位で一致した |

根拠：[evidence/0007-plugin-reach/](evidence/0007-plugin-reach/)

## 観察

1. **`bin/` のコマンドと、スキルの本文の `${CLAUDE_PLUGIN_ROOT}` は、Claude Code でも Agent SDK でも使えた。** Agent SDK の初期化のメッセージでは、プラグインは `probe@inline` として読み込まれ、スキル `probe:probe` が一覧にあった。
2. **TypeScript のまま npm に公開したエンジンは、依存として入れても動かない。** Node.js は `node_modules` の中の TypeScript のファイルを扱わない。Node.js の文書にも、パッケージの作者が TypeScript のまま公開しないよう、`node_modules` の中の TypeScript のファイルを扱わないとある（[Node.js の TypeScript](https://nodejs.org/api/typescript.html)）。
3. **1つにまとめたエンジンは、`node_modules` なしで動き、元の CLI と同じ出力を出した。** 入力の誤りも、元の CLI と同じ形で報告した。

## 限界

- **マーケットプレイスから入れたプラグインは試していない。** `--plugin-dir` と Agent SDK の `plugins` は、どちらもプラグインのディレクトリをその場で読み込む。マーケットプレイスから入れると、プラグインはキャッシュに写される（[Plugin loading reference](https://code.claude.com/docs/en/plugins/loading.md)）。
- **MCP サーバーは試していない。**
- **AI の実行は、それぞれ1回だけで、モデルは haiku だけである。**
- **Linux でしか確かめていない。**
