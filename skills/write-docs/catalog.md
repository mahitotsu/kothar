# 雛形の一覧と、文書の組

**この文書の読み手:** `write-docs` を実行する Claude と、文書の種類を選ぶ人。どの雛形を使うか、どの文書に何を書くかを決める。

## 要旨
- 雛形は 21 ある。場所は `${CLAUDE_PLUGIN_ROOT}/templates/`。
- 取り組みに合う**文書の組**を選び、組の文書だけを写す。全部は要らない。
- 迷ったら、表の「書かないこと」を見る。書かないことの行き先が、置き場所。

## 1. 文書の組
| 取り組み | 写す雛形 |
|---|---|
| 調査・検証 | readme、report、findings、glossary、plan、log、design-decisions |
| 開発 | readme、requirements、design、architecture、design-decisions、test-cases、test-results、user-guide、dev-guide、runbook、glossary |
| 単発の文書 | proposal、planning、prfaq、minutes、weekly（1 つずつ使う） |

## 2. 雛形ごとの役割
| 雛形 | 書くこと | 書かないこと（行き先） |
|---|---|---|
| readme | 答え 3 行、読む順番、最短の使い方 | 詳細（各文書） |
| report | 結論 → 理由 → 信頼できる範囲 → 付録 | 日付と実績（log） |
| findings | 確かめた個別の事実。結論と根拠を分ける | 全体の結論（report） |
| glossary | 用語と、呼び名の対応 | 手順や設計（各文書） |
| plan | なぜ・何を・どう測るか。予測と基準 | 状況と実績（log） |
| log | 日付つきの実施、判断、実績、次の候補 | 設計の理由（design-decisions） |
| design-decisions | 判断と理由の一覧 | 構成の事実（architecture） |
| architecture | 今ある構成と仕様の事実 | これからの設計（design）、理由（design-decisions） |
| runbook | 動かし方、後片付け、つまずきやすい点 | 構成（architecture） |
| requirements | 何を満たせば完成か。受け入れ基準 | 実装の方法（design） |
| design | これから作る・変えるものの方式と代替案 | 今ある構成（architecture） |
| proposal | 選択肢を比べ、1 つを推奨して判断を求める | 取り組みの計画（planning） |
| planning | 新しい取り組みの課題、狙い、進め方、体制 | 選択肢の比較（proposal） |
| prfaq | 製品が出た日のプレスリリースと FAQ | 要件の一覧（requirements） |
| test-cases | 観点とケース。手順と期待結果 | 結果（test-results） |
| test-results | 合否の結論、不合格と対処、残るリスク | ケースの定義（test-cases） |
| user-guide | 作業ごとの使い方。利用者の言葉で | 内部の仕組み（architecture） |
| dev-guide | 環境の作り方、変更の流れ、規約 | 構成の事実（architecture） |
| minutes | 決まったこと、宿題、論点 | 長期の経過（log） |
| weekly | 進んだこと、遅れ、頼みたいこと | 結論や設計（各文書） |

## 3. 置き場所の目安
- 入口の readme は、リポジトリの直下。それ以外は `docs/`。
- 作業用の記録（plan、log、design-decisions、minutes、weekly）は `docs/internal/` に分けてもよい。分けたら、雛形内のリンクを直す。
- 図は文書の隣の `figures/` に置く。仕様（`*.fig.json`）とできた SVG を、一緒に置く。
