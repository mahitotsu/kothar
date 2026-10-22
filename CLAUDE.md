# CLAUDE.md

Kothar は、人に伝える文書の書き方を、規則・雛形・図の部品・検査にした Claude Code のプラグイン。入口は [README.md](README.md)。このファイルには、このリポジトリを開発するときの約束事と、つまずきやすい点だけを置く。コードや git から分かることは書かない。

## 規則の置き場所（更新先を迷わないために）
文書の書き方の規則は、[skills/write-docs/SKILL.md](skills/write-docs/SKILL.md) が正本。規則を変えるときは、SKILL.md と、利用者に写す [templates/CLAUDE.md](templates/CLAUDE.md) の要約を、同じ内容に保つ。

| 変えること | 更新先 |
|---|---|
| 規則、5 つの試験、手順 | [skills/write-docs/SKILL.md](skills/write-docs/SKILL.md)、[templates/CLAUDE.md](templates/CLAUDE.md) |
| 雛形の足し方、文書の組、役割の表 | [skills/write-docs/catalog.md](skills/write-docs/catalog.md)、`templates/` |
| 図の仕様 | [skills/write-docs/figures.md](skills/write-docs/figures.md)、`scripts/render-figure.ts` |
| 設計の判断と理由 | [docs/design-decisions.md](docs/design-decisions.md) |

- 人が読む文書は日本語。AI を主語にしない（「私」「Claude」と書かない）。
- このリポジトリの文書にも、規則を適用する。`npm test` が、README.md、CLAUDE.md、`docs/`、`skills/` を検査する。

## 雛形を足す
1. [catalog.md](skills/write-docs/catalog.md) の表で、既存の雛形に入らないことを確かめる。
2. `templates/` に置く。冒頭に、タイトル、読み手の行（「**この文書の読み手:**」）、要旨を書く。`<…>` は、日本語で、埋める内容を書く。
3. catalog.md の「文書の組」と「雛形ごとの役割」に 1 行足し、`test/docs.test.ts` の雛形の数を直す。
4. 5 つの試験を通し、`npm test` を通す。

## 図の部品を変える
- 配色は `scripts/svg-parts.ts` の `STYLE` にだけ書く。変えるときは、dataviz のスキルの検証をやり直す。
- 部品を変えたら `npm run figures` で例を作り直し、画像にして、はみ出し、重なり、矢印の向きを、ライトとダークで目で確かめる。`npm test` が、置いた SVG と生成物の一致を調べる。

## 承認が要る操作
- コミット: 区切りのよいところで、ユーザーに確認してから行う。
- 削除と、戻しにくい操作: 対象を見せて、承認を得てから行う。
- 数値、認証情報、アカウント ID、メールアドレスは、文書にもコードにも書かない。

## 開発
- Node.js 24 以上。TypeScript はビルドせず、Node の型の除去で実行する（import は `.ts` 拡張子つき）。実行時の依存はない。
- `npm install` のあと、`npm test`（文書、雛形、図の検査）と `npm run typecheck`。
- `npm run check` は、このリポジトリの文書に `check-docs.ts` をかける。`npm run figures` は、`templates/figures/` の SVG を作り直す。
