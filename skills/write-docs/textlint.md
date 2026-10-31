# textlint の導入

**この文書の読み手:** 利用者のリポジトリに textlint を入れる Claude と人。Kothar の規則に合わせた設定の雛形を写し、既存の文書で試して、使える状態にするまでの手順を示す。根拠は [principles.md](../../docs/principles.md) の「機械で測るものと、測らないもの」にある。

## 要旨
- **入れるかどうかは、利用者が決める。** devDependencies が増えるので、入れる前に確かめる。入れなくても、`check-docs.ts` は動く。
- **設定は雛形を写す。** `${CLAUDE_PLUGIN_ROOT}/templates/textlint/.textlintrc.json` は、Kothar の文体と食い違うルールを調整してある。
- **強制する前に、既存の文書で試す。** 誤検知の多いルールは、無効にするか閾値を変え、理由を残す。
- **指摘を消すためだけに、文を崩さない。** 不自然に分けた文は、指摘より悪い。
- **`check-docs.ts` は、textlint を入れても回す。** リンクや読み手の行は、textlint では調べられない。

## 1. 手順
1. **利用者に確かめる。** textlint と 2 つのプリセット、無効化コメントのフィルタが、devDependencies に入ると伝える。断られたら、入れない。
2. **設定を写す。** 雛形の設定を、リポジトリの直下に `.textlintrc.json` として写す。既存の `.textlintrc*` があれば、上書きしない。差を見せ、足すルールを利用者と決める。
3. **入れる。** 次の命令で入れる。版の番号は固定しない（ja-technical-writing は、半年ごとに更新される）。

   ```bash
   npm i -D textlint textlint-rule-preset-ja-technical-writing @textlint-ja/textlint-rule-preset-ai-writing textlint-filter-rule-comments
   ```

4. **npm script を足す。** 文書の置き場所に合わせて、`package.json` の `scripts` に `"lint:text": "textlint README.md docs"` のように書く。
5. **既存の文書で試す。** `npx textlint -f json <文書の置き場所>` で、ルールごとの件数を数える。件数の多いルールは、中身を見て分ける（[2](#2-指摘を分ける)）。
6. **調整を残す。** 無効にしたルールと変えた閾値は、理由と一緒に、開発ガイドか CLAUDE.md に書く。JSON の設定には、理由を書けない。
7. **回す場所を決める。** 書いた文書は、`check-docs.ts` と textlint の両方にかける。CI に入れるかは、利用者が決める。

## 2. 指摘を分ける
指摘は、次の 3 つに分けて扱う。

| 分類 | 例 | 扱い |
|---|---|---|
| 本当の問題 | 冗長な表現、1 文に 4 つ以上の読点、同じ助詞の重なり | 文を直す。語を変えるか、文を分ける |
| 文書の性質による誤検知 | 出典の原文の引用、ですます調の文の引用 | 理由をつけて、無効化コメントで残す |
| 文体と食い違うルール | 同じ種類の誤検知が、多くの文書で出る | 設定で無効にするか、閾値を変える。理由を残す |

無効化コメントは、`<!-- textlint-disable ルール名 -->` と `<!-- textlint-enable ルール名 -->` で範囲を囲む。範囲の直前に、残す理由を書く。

## 3. 雛形の設定で調整したもの
雛形の設定は、2 つのプリセットの既定から、次の 5 つを変えた。

- **文の長さ（sentence-length）:** 無効にした。`check-docs.ts` が数える。textlint はインラインコードとリンクの文字も数えるので、同じ文に、字数の違う警告が 2 回出る。
- **助詞の重なり（no-doubled-joshi）:** 「も」と「にも」を許した。「文書にもコードにも書かない」のような並列は、自然な日本語。
- **文体の混在（no-mix-dearu-desumasu）:** 本文と箇条書きを「である」調にした。Kothar の雛形の文体に合わせた。
- **太字の名前（ai-writing の 2 つのルール）:** 「- **推奨:** 説明」の形を許した。Kothar は、並びの項目に名前を付けるときに、この形を使う。

- **文書全体への提案（ai-tech-writing-guideline）:** 無効にした。README は `severity: "info"` で提案として扱えると書くが、試した版では error として出て、終了コードを 1 にした。冗長な表現は、ja-no-redundant-expression と `check-docs.ts` が拾う。
