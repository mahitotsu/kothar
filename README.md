# Kothar

人に伝える文書の、規則・雛形・図の部品・検査を 1 式にした、汎用のリポジトリ。名前は、ウガリット神話の工匠神コシャル・ワ・ハシスから取った。検証・調査・設計の文書を、同じ型で書くために使う。

**読み手:** 新しい検証や調査の文書を書き始める人。このリポジトリを複製して、題材だけを替えて使う。

## 答え
- **規則は 1 か所。** 読み手を決める、結論を先に書く、1 文書 1 役割、など。要約は [CLAUDE.md](CLAUDE.md)、スキルの形は [skill-draft/write-docs/SKILL.md](skill-draft/write-docs/SKILL.md)。
- **雛形は 9 つ。** README、報告書、構成、手順書、事実集、用語集、作業用の 3 つ（計画、経過、設計判断）。各雛形は、何を書くかを示す。
- **図は SVG をコードで作る。** ライト・ダーク対応。`npm test` が、リンク、表の幅、読み手の行、図と生成物の一致を調べる。

## 読む順番
| 知りたいこと | 読む文書 |
|---|---|
| 結論を伝える文書の型 | [docs/report.md](docs/report.md) |
| 構成と仕様を書く型 | [docs/architecture.md](docs/architecture.md) |
| 手順を書く型 | [docs/runbook.md](docs/runbook.md) |
| 確かめた個別の事実を書く型 | [docs/findings.md](docs/findings.md) |
| 用語の定義を書く型 | [docs/glossary.md](docs/glossary.md) |
| 作業用の文書（計画、経過、設計判断） | [docs/internal/plan.md](docs/internal/plan.md)、[log.md](docs/internal/log.md)、[design-decisions.md](docs/internal/design-decisions.md) |

## 最短の使い方
前提は Node.js 24 以上と npm。

```sh
npm install
npm test            # 文書と図の検査
npm run typecheck   # 型の検査
npm run figures     # docs/figures/ の図を作り直す
```

使い始めるときは、次の順に進める。

1. 題材を決め、[CLAUDE.md](CLAUDE.md) の 1 行目と「読み手」を書き替える。
2. 各雛形の `<…>` を、題材の内容で埋める。使わない雛形は、削除する。
3. 図は [scripts/](scripts/) の部品で作る。手順は CLAUDE.md の「図を足す」にある。

## 構成
| パス | 中身 |
|---|---|
| `docs/` | 文書の雛形。作業用は `docs/internal/` |
| `docs/figures/` | 生成した SVG（例の 4 枚）と、グラフの入力 JSON |
| `scripts/` | 図の部品（`svg-parts.ts`）、構成図の例、グラフの部品と例、文書の検査の部品 |
| `test/` | 文書と図の検査 |
| `skill-draft/` | スキルの下書き。まだ `~/.claude/skills/` には置かない |
