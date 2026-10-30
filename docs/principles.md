# 文書の規則は、5 つの原則から導く（根拠集）

**この文書の読み手:** Kothar の規則や雛形を変える人と、規則の理由を知りたい人。各規則がどの原則に拠り、どの出典が支えているか（または、支えがないか）を確かめるために使う。規則そのものは [SKILL.md](../skills/write-docs/SKILL.md)、判断の一覧は [design-decisions.md](design-decisions.md)。

## 要旨
- **5 つの原則:** 読み手に要る、見つけられる、分かる、確かめられる、使える・保てる。ISO 24495-1 の 4 原則を土台にし、事実と推定を分ける「確かめられる」を足した。
- **規則は原則から導く。** 既存の規則はすべて、いずれかの原則に割り付けられた。割り付けられない規則はなかった。
- **支えの強さに差がある。** 公用文作成の考え方など、本文を読んだ出典が支える規則が多い。数字の上限と表の列数は、出典を確認できなかった（[未確認](#7-未確認)）。
- **機械で測れるのは一部。** 文の長さ、曖昧語などを警告にした。測れない原則（確かめられる、使える）は、出す前の確認に置いた。
- **取得日:** 出典は 2026-10-22 に確かめた。

## 1. 原則と規則と試験の対応
原則ごとに、導く規則と、確かめる手段を 1 行にまとめる。規則の本文は [SKILL.md](../skills/write-docs/SKILL.md) にある。

| 原則 | 導く規則 | 確かめる手段 |
|---|---|---|
| 1. 読み手に要る | 読み手と目的を冒頭に書く。伝えることを絞る | 試験 1（30 秒） |
| 2. 見つけられる | 結論を先に書く。見出しは主張。1 段落 1 主題。1 文書 1 役割 | 試験 1〜3 |
| 3. 分かる | 1 文 1 義。用語を定義する。曖昧語を避ける。数字・表・図を絞る | 試験 3〜5、検査の警告 |
| 4. 確かめられる | 事実・推定・意見を分ける。前提と根拠を書く | 出す前の確認 1 |
| 5. 使える・保てる | 使う場面で試す。重複させない。実績は記録の文書に置く | 出す前の確認 2、検査 |

出典の層は 4 つに分ける。① 規格と公的な指針。② 定番の文献。③ 企業や団体の公開ガイド。④ 二次資料だけで確認したもの。④ だけに拠る規則は作らない。

## 2. 原則ごとの根拠
### 2-1. 原則 1: 文書は、読み手が必要とするものだけを渡す
**結論:** 読み手を決め、その人が知りたいことに絞る。公用文の考え方は、文書を読み手とのコミュニケーションと捉える。伝えることを絞り、副次的な内容は別に扱うよう求める。読み手が複数いる文書は、主な読み手を 1 つ決める。ほかの読み手の分は、節を分けて渡す。この扱いは、出典に直接の記述がなく、推定である。

<details>
<summary>根拠</summary>

- 公用文作成の考え方（文化審議会建議、2022-01-07、①）: 「読み手に理解され、信頼され、行動の指針とされる文書を作成する」「伝えることを絞る。副次的な内容は、別に対応する」「読み手の視点で構成を考える」。https://www.bunka.go.jp/seisaku/bunkashingikai/kokugo/hokoku/pdf/93731901_01.pdf（本文を読んだ）
- Federal Plain Language Guidelines（①）: 第 1 の原則は「write for your audience」。読み手の知識に合わせる。https://www.plainlanguage.gov/guidelines/audience/（検索結果の要約で確認）
- ISO 24495-1:2023（①）: 第 1 原則は、読み手が必要とするものを得られること（relevant）。https://committee.iso.org/standard/78907.html（規格本文は有料で未取得。原則の名は、複数の販売ページと協会の説明で一致）
- Google の文書ガイド（③）: README は「何を置くか、最初に見るファイル、誰が保守するか」に答える。読み手を明示する。https://google.github.io/styleguide/docguide/best_practices.html（本文を読んだ）

</details>

### 2-2. 原則 2: 結論を先に置き、構成を読み手が辿れるようにする
**結論:** 結論を冒頭に書き、見出しだけで筋が通るようにする。1 文書には 1 つの役割だけを持たせる。公用文の考え方は、結論を最初の段落で示し、理由と詳細を続けるよう求める。米陸軍の文書規則（BLUF）と、Minto のピラミッド原則も、結論先行で一致する。Diátaxis は、学習・作業・参照・理解の 4 つの形を、混ぜない構成にする。要旨を 3〜5 項目とするのは、Minto の「1 つの群は 3〜7 項目」を狭めた Kothar の判断で、推定である。

<details>
<summary>根拠</summary>

- 公用文作成の考え方（①）: 「結論は早めに示し、続けて理由や詳細を説明する」「文書の結論は、できれば最初の段落で示しておく」「最後まで読まないと何を言おうとしているか分からないような書き方は避ける」「重要な点を優先して伝え、具体例、細目等は後に示すか別途添える」。同上 URL（本文を読んだ）
- BLUF（米陸軍規則 AR 25-50、①）: 「putting the main point at the beginning of the correspondence (bottom line up front)」。https://en.wikipedia.org/wiki/Bottom_line_up_front（二次資料経由。規則の原文は未取得）
- Minto, The Pyramid Principle（②）: 結論を先頭に置く。1 つの群の項目は同じ抽象度で、論理の順に並べ、3〜7 個を目安にする。https://thinkinsights.net/strategy/pyramid-principle（二次資料経由）
- 木下是雄『理科系の作文技術』（②）: 重点先行主義、事実と意見の区別。（二次資料経由。書籍の本文は未確認）
- Diátaxis（③）: 「identifies four distinct needs, and four corresponding forms of documentation」。how-to は「action only」で、説明を入れない。reference は「describe and only describe」。https://diataxis.fr/ 、https://diataxis.fr/how-to-guides/ 、https://diataxis.fr/reference/ （本文を読んだ）

</details>

### 2-3. 原則 3: 1 文に 1 つの意味を載せ、曖昧さを残さない
**結論:** 文は短く、論点を 1 つにする。専門用語を定義し、曖昧な語を避ける。公用文の考え方は、50〜60 字ほどになったら読みにくくなっていないかを意識するよう述べる。「適当な長さは一概に決められない」とも断る。3 つ以上の並びは、箇条書きにする。要件の文書では、曖昧な語が検証を不能にする。能動態は、誰が何をするかを明らかにする。図は、色だけで意味を伝えず、読み上げ用の説明を付ける。数字を 1 段落に 3 個まで、表を 5 列までとする規則は、出典を確認できなかった。

<details>
<summary>根拠</summary>

- 公用文作成の考え方（①）: 「一文を短くする」「適当な長さは一概に決められないが、50～60 字ほどになってきたら読みにくくなっていないか意識するとよい」「一文の論点は、一つにする」「三つ以上の情報を並べるときには、箇条書を利用する」「専門用語や外来語をむやみに用いない」「受身形をむやみに使わない」「曖昧さを避ける」「図表等によって視覚的な効果を活用する」。同上 URL（本文を読んだ）
- digital.gov Plain Language（①）: 「Active voice makes it clear who should do what」。https://digital.gov/guides/plain-language/writing （本文を読んだ）
- Google developer documentation style guide（③）: 能動態、条件を指示の前に置く、順序のある手順は番号つきリスト、画像に alt text。https://developers.google.com/style/highlights （本文を読んだ）
- INCOSE Guide to Writing Requirements（①、二次資料経由）: R7 は曖昧な量や形容詞（vague terms）、R8 は「where possible」「if necessary」「as appropriate」などの逃げ道（escape clauses）を避ける。https://www.modernrequirements.com/blogs/requirements-writing-pitfalls-to-avoid/ 。本文は未取得
- ISO 24495-1（①）: 「understandable」の指針は、身近な語、明快で簡潔な文、まとまり。https://committee.iso.org/standard/78907.html （検索結果の要約）
- W3C WAI, Complex images（①）: グラフや図は、短い alt と、要点を文章にした長い説明の 2 つを用意する。https://www.w3.org/WAI/tutorials/images/complex/ （本文を読んだ）
- WCAG 2.2, 達成基準 1.4.1 色の使用（①）: 色だけで情報を伝えない。https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html （検索結果の要約）

</details>

### 2-4. 原則 4: 主張を、読み手が確かめられる形で書く
**結論:** 事実と、推定や意見を分け、前提を明示する。前提が外れたときの影響まで書く。米国の情報機関の分析基準（ICD 203）は、基になる情報と、前提・判断を明確に区別するよう求める。前提は、論証の要になるときに明示し、誤りだった場合の含意を説明させる。設計の文書では、Google の設計書の指針が、退けた案とそのトレードオフを書かせる。ADR は、決定の結果を、良い面だけでなく全部書かせる。退けた案を求める出典は、どれも判断を扱う文書のもの。現在の姿を伝える文書に退けた案を書くと、使える案と使えない案が混ざり、設計判断と同じ内容を 2 か所に書くことになる（原則 5）。そこで、退けた案は判断を扱う文書に限り、ほかの文書からはリンクする。

<details>
<summary>根拠</summary>

- ICD 203 Analytic Standards（①）: 「Analytic products should clearly distinguish statements that convey underlying intelligence information used in analysis from statements that convey assumptions or judgments」「Products should state assumptions explicitly when they serve as the linchpin of an argument」「Products should explain the implications for judgments if assumptions prove to be incorrect」。https://archive.dni.gov/files/documents/ICD/ICD-203.pdf （本文を読んだ）
- Design Docs at Google（③）: 「Alternatives considered」は最も重要な節の 1 つで、各案のトレードオフに焦点を当てる。非目標は「否定した目標」ではなく、目標になりえたが意図して外したもの。https://www.industrialempathy.com/posts/design-docs-at-google/ （本文を読んだ）
- Nygard, Documenting Architecture Decisions（②）: Context は価値中立で事実を書く。Consequences には、良い面だけでなく全部を書く。https://www.cognitect.com/blog/2011/11/15/documenting-architecture-decisions （本文を読んだ）
- Rust RFC のひな型（③）: 「Drawbacks」「Rationale and alternatives」「Unresolved questions」を必須の節に置く。https://github.com/rust-lang/rfcs/blob/master/0000-template.md （本文を読んだ）
- ISO/IEC/IEEE 29148:2018（①、二次資料経由）: 要件の特性に、検証できること（verifiable）が入る。本文は未取得

</details>

### 2-5. 原則 5: 使う場面で試し、古くならないように持ち主を決める
**結論:** 文書は、使う場面で試してから出す。同じ内容を 2 か所に書かず、変わりやすい実績は記録の文書に置く。ISO 24495-1 の「usable」は、作成中と読み手とで文書を評価することを求める。Google の文書ガイドは、コードと同じ変更で文書を直し、古い文書は消すよう求める。PRFAQ のプレスリリースは、顧客が買う気になるかを確かめる試金石として使う。

<details>
<summary>根拠</summary>

- ISO 24495-1（①）: 「usable」の指針は、作成中と読み手とでの評価。https://committee.iso.org/standard/78907.html （検索結果の要約）
- Google の文書ガイド（③）: 「Change your documentation in the same CL as the code change」「Dead docs are bad. They misinform, they slow down」。https://google.github.io/styleguide/docguide/best_practices.html （本文を読んだ）
- Working Backwards（Bryar & Carr、②、二次資料経由）: プレスリリースは、これで顧客が買う気にならなければ書き直す試金石。https://www.goodreads.com/notes/55297149-working-backwards/50759819-thomas-hefke?page=2 。書籍は未確認
- IPA 非機能要求グレード（①）: 利用者と開発者の認識の行き違いを防ぐため、重要な項目から水準を決め、双方で確認する。https://www.ipa.go.jp/archive/digital/iot-en-ci/jyouryuu/hikinou/index.html （検索結果の要約）

</details>

## 3. 雛形ごとに採った定石
雛形ごとに、採った定石と出典の層を示す。節立ての細部は、雛形を直接読む。

| 雛形 | 採った定石 | 層 |
|---|---|---|
| 要件定義 | 1 要件 1 文で、検証できる形。EARS の型で書く。出所を持たせる | ①② |
| 設計書 | 目標と非目標。代替案とトレードオフ。横断的な関心事。未決を時期で分ける | ③ |
| 設計判断 | 状態、文脈、決定、結果（悪い面も）、退けた案 | ②③ |
| 提案書 | 結論先行。状況・複雑化・問い・答えで背景を書く。選択肢は重ならない。何もしない案も置く | ②① |
| 企画書 | 課題、成功の指標、範囲の内と外、節目 | ③ |
| PRFAQ | プレスリリースは 1 ページ未満。FAQ は顧客向けと社内向け。作る前に書く | ②④ |
| テストケース | 網羅項目と、ケース（前提、入力、期待結果、対応する要件） | ①④ |
| テスト結果 | 計画との差、網羅の評価、完了の評価、残るリスク | ①④ |
| ユーザーガイド | 節ごとに 1 つの形（学習、作業、参照）。説明は別の文書にリンク | ③ |
| 開発ガイド | 最初に見るファイル、保守者、作業の流れ。手順に説明を混ぜない | ③ |
| 議事録 | 決まったこと、決まらなかったこと、宿題（動詞、担当、期限） | ④ |
| 週報 | 進んだこと、計画、問題、決めてほしいこと、次の報告日 | ④ |

<details>
<summary>根拠</summary>

- EARS（Mavin ら、Rolls-Royce、RE'09、2009、②）: 型は、常時、イベント駆動（WHEN）、状態駆動（WHILE）、望ましくない動作（IF-THEN）、任意機能（WHERE）、複合の 6 つ。節の順は固定。https://en.wikipedia.org/wiki/Easy_Approach_to_Requirements_Syntax （本文を読んだ）
- ISO/IEC/IEEE 29148:2018（①、二次資料経由）: 個々の要件の特性は、必要、適切、曖昧でない、完全、単一、実現可能、検証可能、正しい、規約に合う（資料により、追跡可能を足して 10）。https://www.modernrequirements.com/?p=32595 。本文は未取得
- ISO/IEC/IEEE 29119-3:2021（①、二次資料経由）: テスト完了報告は、概要、実施の要約、計画との差、完了の評価、阻害要因、測定値、残るリスク、成果物（再利用する資産、得た教訓）。テストケース仕様は、網羅項目と、ケース（識別子、目的、優先度、追跡、前提、入力、期待結果）。https://store.standards.org.au/product/as-nzs-iso-iec-ieee-29119-3-2022 、https://www.microtool.de/en/document-management/test-documentation-with-iso-iec-ieee-29119-32021/ 。本文は未取得
- IEEE 829-1998 のテスト要約報告（④）: 識別子、要約、差異、網羅性の評価、結果の要約、評価、活動の要約。https://www.cs.otago.ac.nz/cosc345/lecs/lec22/testplan.htm
- Design Docs at Google（③）: 構成は、文脈と範囲、目標と非目標、代替案、横断的な関心事（セキュリティ、プライバシー、可観測性）。長さは、大きな案件で 10〜20 ページ、小さな案件で 1〜3 ページ。同上 URL
- Rust RFC のひな型（③）: 未解決の問いを、「RFC の間」「実装の間」「範囲外」に分ける。同上 URL
- MADR（③）: 文脈と問題、決定の要因、検討した選択肢、決定の結果（良い面と悪い面）、各案の長所と短所。https://adr.github.io/madr/ （本文を読んだ）
- Working Backwards（②、二次資料経由）: プレスリリースは 1 ページ未満、FAQ は 5 ページ以内、FAQ は顧客向けから社内向けの順。書籍は未確認。長さは資料により異なる（[食い違い](#4-出典どうしの食い違いと採った側)）
- Diátaxis（③）: チュートリアルは「目的地を見せる」「各段階で小さくても見える結果を出す」。how-to は利用者の視点で、行動だけを書く。reference は製品の構造を写す。https://diataxis.fr/tutorials/ 、https://diataxis.fr/explanation/ （本文を読んだ）
- 議事録（④）: 決まらなかったことも書く。宿題は動詞で始め、担当と期限を付ける。構成を毎回揃える。https://www.read.ai/articles/how-to-write-meeting-minutes-step-by-step-guide 。1 件の資料だけ
- 週報（④）: Progress、Plans、Problems の順で、助けが要ること、決定が要ること、次の報告日を添える。https://slite.com/ja/learn/progress-report-guide ほか複数の企業のひな型が一致

</details>

## 4. 出典どうしの食い違いと、採った側
食い違いは 7 件あった。どれも、片方を捨てず、使う場面で分けて採った。

| 論点 | 一方の出典 | もう一方の出典 | 採った側 |
|---|---|---|---|
| 箇条書きか、文章か | 公用文、Google: 3 つ以上の並びは箇条書き | Nygard、Amazon の 6 ページ文書: 断片文を避け、文章で書く | 並列の列挙は箇条書き。理由と論証は完全な文 |
| 結論と背景の順 | 公用文、BLUF: 結論を最初に | Minto の SCQA: 状況から入り、答えに至る | 要旨に答えを置く。背景は直後。SCQA は提案書の背景の書き方に使う |
| 要件の特性の数 | 資料により 9 | 資料により 10（追跡可能を足す） | 追跡可能を採る。要件に出所を持たせ、テストケースから辿る |
| PRFAQ の長さ | プレスリリース 1 ページ未満、FAQ 5 ページ以内 | プレスリリース 1〜1.5 ページ、全体 6 ページ | 前者を雛形の注意書きにする。④ のため、検査はしない |
| 4 つの形を分けるか | Diátaxis: 形を混ぜず、文書を分ける | 利用者は、1 つのガイドを読みたい | 1 節 1 形で混ぜない。大きくなったら文書を分ける |
| 見出しの大文字小文字 | Google: 文頭のみ大文字（英語） | 日本語には大文字がない | 採らない |
| 日付や実績を書かない規則 | 既存の規則: 結論と設計の文書に書かない | 議事録、週報、テスト結果は日付と実績が本体 | 文書を「結論・設計」と「記録」に分ける |

## 5. 機械で測るものと、測らないもの
検査の警告は、出典があり、誤検知が少ないものだけにした。閾値は、出典の値に余裕を見た。

| 検査 | 閾値 | 根拠 |
|---|---|---|
| 長い文 | 80 字を超える文 | 公用文は 50〜60 字で意識を促す。警告は誤検知を避けて、余裕を見る |
| 曖昧語 | 語の一覧（検査の実装を参照） | INCOSE R7、R8。要件定義とテストケースで特に重い |
| 要旨の長さ | 「## 要旨」の項目が 3〜5 個の外 | Minto の 3〜7 を狭めた Kothar の判断（推定） |
| 曖昧な見出し | 概要、その他、一般、範囲など | 見出しは主張を書く規則。出典は公用文の「主旨を明確に示す」 |
| 主語の AI | 一人称や AI の名前を主語にした文 | 既存の規則。出典は確認できなかった |
| 図の説明 | desc がない図 | W3C の長い説明 |

測らないものも、理由とともに残す。

- **「など」「等」:** 公用文でも使う語で、誤検知が多い。INCOSE は避けるよう求めるが、検査の対象にしない。
- **数字の個数:** 段落ごとの個数は、番号や日付、版を誤って数える。試験 5 で人が確かめる。
- **事実と推定の別:** 機械では判定できない。出す前の確認 1 で人が確かめる。

## 6. 図の定石
図の規則は、原則 1〜5 を図に当てはめたもの。図は、種類を選び、主張を書き、色以外の手がかりを足し、表を併記する。種類ごとの書式は [figures.md](../skills/write-docs/figures.md) にある。

| 規則 | 導く原則 | 層 |
|---|---|---|
| 図は、文章では伝えにくいときだけ使う。数字が 1 つなら、数字で書く | 1 | ③ |
| 1 図 1 主張。題名に種類と範囲、説明（`desc`）に要点を書く | 2、3 | ①③ |
| 矢印は 1 方向で、ラベルを付ける。要素の種類を示し、凡例を付ける | 3 | ③ |
| 色だけに頼らない。記号、ラベル、位置を併用する | 3 | ① |
| 棒は 0 から始める。差が小さいときは、ダンベルか折れ線にする | 4 | ①③ |
| 色で区別する系列は 3 つまで。それ以上は、強調（1 つだけ色を付ける）か分割 | 3 | ①③ |
| 図の隣に、データの表を置く | 3、5 | ① |
| 長さと位置で比べる。円グラフと二軸は使わない | 3、4 | ②③ |
| 目印の色は、背景に対して 3:1 以上。値は文字でも示す | 3 | ① |

<details>
<summary>根拠</summary>

- GOV.UK Analysis Function, Data visualisation: charts（①）: 「All charts need at least one title, but it is considered best practice to give them two」。棒グラフの軸を切るのは「problematic and highly controversial」。「In general, we should not rely on colour as the only way to match labels to data」。「If you expect a non-disabled user to read the data from the chart, give a table」。積み上げは 4 カテゴリまで、折れ線は 4 本を超えると煩雑。https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/ （本文を読んだ）
- C4 model, Notation（③）: 「Every diagram should have a title describing the diagram type and scope」「Every diagram should have a key/legend」「Every line should represent a unidirectional relationship」「Every line should be labelled」（「Uses」のような 1 語を避ける）。https://c4model.com/diagrams/notation （本文を読んだ）
- Datawrapper Academy（③）: 棒グラフは 0 から始める。切った軸は、誤解を招く。代わりに、ドットプロットか折れ線を使う。折れ線は 0 から始めなくてよいが、0 に近いなら 0 基線を足す。重要でない線は灰色にする。https://www.datawrapper.de/academy/why-our-column-and-bar-charts-start-at-zero 、https://www.datawrapper.de/academy/what-to-consider-when-creating-line-charts （本文を読んだ）
- WCAG 2.2, 1.4.11 非テキストのコントラスト（①）: 理解に要るグラフィックは、隣接色に対して 3:1。ラベルと値を文字で示せば、グラフィック自体は必須でなくなりうる。https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html （本文を読んだ）
- WCAG 2.2, 1.4.1 色の使用（①）: 色だけで情報を伝えない。https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html （検索結果の要約）
- W3C WAI, Complex images（①）: グラフや図は、短い alt と、要点の長い説明を用意する。https://www.w3.org/WAI/tutorials/images/complex/ （本文を読んだ）
- Google developer documentation style guide, Images（③）: 画像は、文章では説明しにくいものを見せるときに使う。新しい情報は、図ではなく文章で伝える。図中の文字は短くする。https://developers.google.com/style/images （本文を読んだ）
- Cleveland & McGill, Graphical Perception（1984、②、二次資料経由）: 共通の目盛り上の位置が最も正確で、長さ、角度、面積の順に落ちる。Heer & Bostock の再現で大筋が確かめられた。異論もある。https://info3312.infosci.cornell.edu/slides/04-graphical-perception.html
- Few, 二軸の批判（②、二次資料経由）: 二軸を正当化できる場面は見つからないと結論した。https://peltiertech.com/secondary-axes-in-charts-2/ 。本文は未取得
- UML のシーケンス図（③④、複数の二次資料）: ライフラインは縦の破線で、時間は下へ進む。戻りのメッセージは破線。https://learn.microsoft.com/en-us/previous-versions/visualstudio/visual-studio-2012/dd409377(v=vs.110) ほか
- フローチャート記号（④）: 端子は楕円か角丸の長方形、処理は長方形、判断はひし形。ISO 5807:1985。https://creately.com/guides/flowchart-symbols/
- ガント図（④、2 件の資料）: 水平の棒は期間、ひし形は節目、縦線は今日、矢印は依存。https://www.instagantt.com/guides/gantt-chart-best-practices
- 2x2 マトリクス（④）: 軸を定義し、向きを明示する。象限の名前を揃える。https://roadmunk.com/product-management-blog/impact-effort-matrix
- ColorBrewer（②、二次資料経由）: 順序のあるデータには、明から暗の単色階調。https://en.wikipedia.org/wiki/ColorBrewer

</details>

図の種類ごとに採ったものと、判断した点を示す。

- **横棒:** 位置と長さで比べる。値は先端に書く。強調は、重要な棒だけに色を付け、残りは灰色にする。
- **折れ線:** 推移を見る。線は 2px。終端にラベルを置き、衝突したら凡例だけにする。
- **ダンベル:** 前後の 2 点を結ぶ。棒の軸を切らずに、小さな差を見せる。
- **ヒートマップ:** 単色階調で濃さを表す。値を文字でも書く。階調は 3:1 の対象外とされるが、値の文字で補う。
- **KPI タイル:** 数字が主張のとき、グラフにしない。状態は、記号と文字を併記する。
- **シーケンス、フローチャート、タイムライン:** 時間は下か右へ進む。判断の枝にはラベルを付ける。今日の線を引く。
- **比較（Before/After）:** 追加と削除に、色と記号（＋、−）を併用する。この記法の出典は確認できなかった。WCAG 1.4.1 に従った設計判断で、推定。
- **線種:** 実線、破線、点線の 3 つ。点線は、太い丸い点にし、細く薄い破線と、形・太さ・濃さの 3 つで見分けられるようにする。線種の意味は、図ごとに注記で書く。製図の線種（ISO 128 系）に倣ったが、本文は確認できなかった。設計判断で、推定。

図の規則でも、出典どうしが食い違った。

| 論点 | 一方の出典 | もう一方の出典 | 採った側 |
|---|---|---|---|
| 凡例か、直接ラベルか | GOV.UK: 凡例は必要なときだけ | 色の対応を凡例で示す定石 | 2 系列以上は凡例を置き、直接ラベルを併用する |
| 線や系列の数 | GOV.UK: 4 まで | Datawrapper の資料: 5〜7 | 3 つまで。それ以上は強調か分割。色の見分けやすさを優先する |
| 折れ線を 0 から始めるか | GOV.UK、Datawrapper: 棒は 0 から | Datawrapper: 折れ線は 0 でなくてよい | 棒は 0 から。折れ線は 0 に近いときだけ 0 を足す |
| 図の中の文字 | Google: 短くする | C4: 要素に短い説明を付ける | 名前と 1 行の補足まで。説明は文章で書く |

図に関して、測らないものも決めた。

- **描かないもの:** 円グラフ、二軸グラフ、3D、虹色。位置と長さで比べられない、または誤読を招く。
- **対話:** ホバーなどの対話は扱わない。図は、文書に載せる静的な SVG で、表を併記して補う。

## 7. 未確認
次の出典は、本文を読めなかった。規則の支えとして使った場合は、二次資料に拠っている。

- **有料の規格:** ISO 24495-1、ISO/IEC/IEEE 29148、ISO/IEC/IEEE 29119-3。IEEE 829 の原文。
- **書籍:** 木下是雄『理科系の作文技術』、本多勝一『日本語の作文技術』。Minto『The Pyramid Principle』、Bryar & Carr『Working Backwards』も、書籍は未確認。
- **指針の本文:** INCOSE Guide to Writing Requirements、JTCA『日本語スタイルガイド』、AR 25-50 の原文、ISO 704。
- **規則の出典:** 「数字は 1 段落に 3 個まで」「表は 5 列まで」。既存の規則として保つ。出典を探す作業は残る。
- **図の出典:** Tufte の本文、Few の仕様書、FT Visual Vocabulary、ISO 5807 の本文、UML 仕様の原文。Now/Next/Later の出典。差分表示（追加・削除）の記法の出典。線種（実線、破線、点線）の使い分けの出典（ISO 128 系）。
- **確認の方法:** 有料の規格は、購入するか、公開された目次と要約で確かめる。書籍は、図書館で確かめる。
