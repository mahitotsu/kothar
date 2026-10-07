# Kothar

構成図に込めた意図を、描き手が確実に表し、読み手が正確に読み取れるようにするツール。配置の約束事を「空間の文法」として宣言し、構成図をその文法に従って生成し、検査する。開発の初期段階（フェーズ1）にある。

名前は、ウガリット神話の工匠神コシャル・ワ・ハシスから取った。

## 文書

文書の種類と書き方は [docs/README.md](docs/README.md) にまとめてある。まず読むものは次の4つ。

- [PR/FAQ](docs/prfaq.md)：誰に何を約束するか
- [計画](docs/plan.md)：どの順で作り、何で判断するか
- [ADR](docs/adr/)：何をなぜそう決めたか
- [作業プロセス](docs/process.md)：どの順で作業し、いつ誰が決めるか

## 構成

| パス | 中身 |
| --- | --- |
| `packages/core` | 文法のコンパイラ、レイアウト、レンダラー、リンター（未実装） |
| `packages/cli` | `kothar render / lint / check`（未実装） |
| `plugins/kothar` | Claude Code のプラグイン（未実装） |
| `.claude-plugin/marketplace.json` | このリポジトリを Claude Code のマーケットプレイスとして公開する |
| `benchmarks/` | 評価用の図。図ごとに、手で描いた元の図と、込めた文法を置く |
| `spikes/` | 技術検証のコード。本実装には使わない。結果は `docs/spikes/` の報告書にある |
| `scripts/` | 開発の補助のスクリプト |
| `docs/` | PR/FAQ、体験、計画、作業プロセス、ADR、検証の報告書、ゲートの記録 |
| `TODO.md` | 作業項目の一覧 |

## 開発

Node.js 24 以上が必要。TypeScript はビルドせず、Node の型の除去でそのまま実行する。

```
npm install
npm run typecheck

# 約束、シナリオ、要件、仕様、テストの対応表と、対応の抜けを出力する
# （npm run trace -- --stage <段階の番号> とすると、その段階までの出る条件に抜けがあれば失敗する）
npm run trace

# ベンチマークの元の図を描く
node benchmarks/sample-arch/handplaced.ts > benchmarks/sample-arch/handplaced.svg

# レイアウトの検証を回す（spikes/<検証>/out/ に結果を書く。out/ はコミットしない。
# 報告書の根拠は docs/spikes/evidence/ にある）
node spikes/elk-layout/layout.ts
node spikes/post-place/layout.ts
```

## ライセンス

[MIT](LICENSE)
