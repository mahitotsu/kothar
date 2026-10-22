# 図の仕様の書き方

**この文書の読み手:** 文書に図を足す Claude と人。図の仕様（JSON）を書き、SVG を作り、確かめるまでの手順を示す。

## 要旨
- 図は、仕様（`*.fig.json`）から SVG を作る。コードは複製しない。
- 種類は 3 つ: `diagram`（構成図）、`columns`（棒）、`stacked`（積み上げ棒）。
- 例は `${CLAUDE_PLUGIN_ROOT}/templates/figures/` の 4 つ。写して書き替える。

## 1. 手順
1. 文書の隣の `figures/` に、`名前.fig.json` を書く。例を写すのが早い。
2. `node ${CLAUDE_PLUGIN_ROOT}/scripts/figure.ts figures/名前.fig.json` で、隣に `名前.svg` を作る。
3. SVG を画像にして、はみ出し、重なり、矢印の向きを目で確かめる。ライトとダークの両方を見る。
4. 文書に `![何の図か 1 文で](figures/名前.svg)` で載せる。
5. `check-docs.ts` が、図の title、ダーク対応、仕様との一致を調べる。`figure.ts --check` でも、一致だけ調べられる。

## 2. 構成図（diagram）
`parts` に、部品を描く順に並べる。座標は 720 幅の中で、手で決める。

| 部品 | 書き方 |
|---|---|
| 箱 | `{"box": [x, y, 幅, 高さ], "lines": ["太字の 1 行目", "補足"], "cls": "k1"}`（cls は省略可。`k1` `k2` で色分け） |
| 枠 | `{"group": [x, y, 幅, 高さ], "label": "名前"}`（箱をまとめる） |
| 矢印 | `{"arrow": [x1, y1, x2, y2, …], "dashed": false}`（折れ線は直交する点を与える。終点に矢じり） |
| 文字 | `{"text": [x, y], "value": "…", "anchor": "start"}`（`cls`、`size` は省略可） |

トップレベルは `kind`、`title`、`desc`（読み上げ用）、`height`。

## 3. グラフ（columns、stacked）
- 傾向・差・例外が主張のときに使う。値を引くだけなら表にする。
- 系列の色は `s1`〜`s5` を順に使い、系列は 3 つまでにする。
- `columns` は群ごとの棒。`groups`、`series`（`name`、`cls`、`values`）、`yMax`、`ticks`、`yLabel`、`decimals`（値の小数桁。省略で整数表示）、`note`。
- `stacked` は横の積み上げ。`bars`（`label`、`segments`）、`xMax`、`unit`、`axisLabel`、`note`。
- 例の値は架空。実際の図の値は、測定や集計のファイルから写す。

## 4. 規則
- 図には読み上げ用の `title` と `desc` を付ける。文書には、何の図かを 1 文で書く。
- Mermaid は使わない（表示できない環境がある）。
- 配色は、部品側（`scripts/svg-parts.ts`）にだけある。仕様に色を書かない。
