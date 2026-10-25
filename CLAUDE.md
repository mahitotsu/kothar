# CLAUDE.md

Kothar は、人に伝える文書の書き方を、規則・雛形・図の部品・検査にした Claude Code のプラグイン。入口は [README.md](README.md)。このファイルには、このリポジトリを開発するときの約束事と、つまずきやすい点だけを置く。コードや git から分かることは書かない。

## 規則の置き場所（更新先を迷わないために）
文書の書き方の規則は、[skills/write-docs/SKILL.md](skills/write-docs/SKILL.md) が正本。規則を変えるときは、SKILL.md を直す。利用者に写す [templates/CLAUDE.md](templates/CLAUDE.md) には規則を写さず、スキルを参照させる（写しは持たない）。規則は原則から導く。変えるときは、[docs/principles.md](docs/principles.md) に出典を足し、出典がない規則は「未確認」に書く。

| 変えること | 更新先 |
|---|---|
| 原則、規則、試験、手順 | [skills/write-docs/SKILL.md](skills/write-docs/SKILL.md) |
| 規則の根拠、出典、食い違い、検査の閾値 | [docs/principles.md](docs/principles.md) |
| 雛形の足し方、文書の組、役割の表 | [skills/write-docs/catalog.md](skills/write-docs/catalog.md)、`templates/` |
| 図の仕様 | [skills/write-docs/figures.md](skills/write-docs/figures.md)、`scripts/render-figure.ts` |
| 設計の判断と理由 | [docs/design-decisions.md](docs/design-decisions.md) |

- 人が読む文書は日本語。AI を主語にしない（「私」「Claude」と書かない）。
- このリポジトリの文書にも、規則を適用する。`npm test` が、README.md、CLAUDE.md、`docs/`、`skills/` を検査する。

## 雛形を足す
1. [catalog.md](skills/write-docs/catalog.md) の表で、既存の雛形に入らないことを確かめる。
2. 種類ごとの定石を調べ、出典を [docs/principles.md](docs/principles.md) の「雛形ごとに採った定石」に足す。
3. `templates/` に置く。冒頭に、タイトル、読み手の行（「**この文書の読み手:**」）、要旨を書く。`<…>` は、日本語で、埋める内容を書く。
4. catalog.md の「文書の組」「雛形ごとの役割」「定石と落とし穴」に足し、`test/docs.test.ts` の雛形の数を直す。
5. 5 つの試験と、出す前の確認を通し、`npm test` を通す。

## 図の部品を変える
- 配色は `scripts/svg-parts.ts` の `STYLE` にだけ書く。値は、dataviz のスキルの `palette.md` のものを使う。変えるときは、同スキルの `scripts/validate_palette.js` を、ライトとダークで回す。
- 種類を足すときは、`scripts/` に部品を書き、`scripts/render-figure.ts` の登録表（`KINDS`）と `figureTable` に足す。ラベルが収まらない入力は、描かずにエラーにする（`fit`）。例の仕様を `templates/figures/` に足し、`test/figures.test.ts` に、入力の検査と表の双子のテストを足す。
- 配置の検出（矢印の交差、節点の横切り）と自動調整（`scripts/arrange.ts`）は、`test/figures.test.ts` で守る。例の図は、警告が 0 件であること。
- 部品を変えたら `npm run figures` で例を作り直し、画像にして、はみ出し、重なり、矢印の向きを、ライトとダークで目で確かめる。画像にする道具は、環境に入れる（例: scratchpad の venv に `resvg-py`）。リポジトリには、置かない。`npm test` が、置いた SVG と生成物の一致を調べる。

## 承認が要る操作
- コミット: 区切りのよいところで、ユーザーに確認してから行う。
- 削除と、戻しにくい操作: 対象を見せて、承認を得てから行う。
- 数値、認証情報、アカウント ID、メールアドレスは、文書にもコードにも書かない。

## 開発
- Node.js 24 以上。TypeScript はビルドせず、Node の型の除去で実行する（import は `.ts` 拡張子つき）。実行時の依存はない。
- `npm install` のあと、`npm test`（文書、雛形、図の検査）と `npm run typecheck`。
- `npm run check` は、このリポジトリの文書に `check-docs.ts --strict` をかける。警告も 0 件にする。`npm run figures` は、`templates/figures/` の SVG を作り直す。
