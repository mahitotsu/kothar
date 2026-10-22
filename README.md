# Kothar

人に伝える文書の、規則・雛形・図の部品・検査を 1 式にした、汎用のリポジトリ。名前は、ウガリット神話の工匠神コシャル・ワ・ハシスから取った。Claude Code のプラグインとして入れると、どのリポジトリでも、読み手を決めた文書を書き、検査で確かめられる。

**読み手:** 文書を書く人と、文書づくりを Claude Code に任せる人。プラグインを入れ、文書の種類を選んで書き始めるまでを、この文書で示す。

## 答え
- **規則は 5 つの原則から導く。** 読み手に要る、見つけられる、分かる、確かめられる、使える・保てる。規則と試験の正本は [skills/write-docs/SKILL.md](skills/write-docs/SKILL.md)、出典つきの根拠は [docs/principles.md](docs/principles.md)。
- **雛形は 21。** 調査・検証、開発、単発の文書まで。雛形ごとの定石と落とし穴を、[catalog.md](skills/write-docs/catalog.md) に置いた。本体は [templates/](templates/)。
- **図と検査は、複製なしで使う。** 図は、構造・流れの 6 種とグラフ 8 種を、JSON の仕様から SVG にする（配置は自動）。`check-docs.ts` は、リンク、表の幅、読み手の行、埋め残し、図の一致を調べ、長い文や曖昧語を警告する。依存はなく、Node.js 24 以上で動く。

## 読む順番
| 知りたいこと | 読む文書 |
|---|---|
| 文書を書く手順と規則 | [skills/write-docs/SKILL.md](skills/write-docs/SKILL.md) |
| どの雛形を使うか | [skills/write-docs/catalog.md](skills/write-docs/catalog.md) |
| 図の選び方と、仕様の書き方 | [skills/write-docs/figures.md](skills/write-docs/figures.md) |
| 既存の文書の点検 | [skills/review-docs/SKILL.md](skills/review-docs/SKILL.md) |
| 規則の根拠と出典 | [docs/principles.md](docs/principles.md) |
| 設計の判断と理由 | [docs/design-decisions.md](docs/design-decisions.md) |

## 最短の使い方
Claude Code に、プラグインを入れる。

```sh
claude plugin marketplace add mahitotsu/kothar
claude plugin install kothar@kothar
```

入れたあとは、Claude Code に「要件定義を書いて」「議事録を整えて」「この文書を点検して」と頼む。スキル `write-docs` が、読み手を決め、雛形を写し、検査を回す。スキル `review-docs` は、既存の文書を点検する。

検査と図は、プラグインのスクリプトを直接実行できる。`<プラグインの場所>` は、プラグインを入れた場所（Claude Code では `${CLAUDE_PLUGIN_ROOT}`）。

```sh
node <プラグインの場所>/scripts/check-docs.ts docs               # 文書を検査する
node <プラグインの場所>/scripts/figure.ts docs/figures/x.fig.json  # 仕様から SVG を作る
node <プラグインの場所>/scripts/figure.ts --table docs/figures/x.fig.json  # 図の隣に置く表を作る
```

## 構成
| パス | 中身 |
|---|---|
| `skills/` | スキル `write-docs`（書く）と `review-docs`（点検する） |
| `templates/` | 文書の雛形 20 と、CLAUDE.md の雛形。図の例（`figures/`）も入る |
| `scripts/` | 検査（`check-docs.ts`）、図の CLI（`figure.ts`）、図の部品 |
| `test/` | 検査と図の部品のテスト |
| `docs/` | このプラグイン自身の文書: 規則の根拠集と、設計判断 |
| `.claude-plugin/` | プラグインの定義と、マーケットプレイスの定義 |

このリポジトリを開発するときの約束事は [CLAUDE.md](CLAUDE.md)。
