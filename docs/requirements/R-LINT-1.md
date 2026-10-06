---
id: R-LINT-1
sources: [X04]
verification: テスト
cycle: 1
approved_cycle: 1
---

# R-LINT-1

配置が文法の規則を破っている場合、lint は、違反ごとに、破った規則、対象のノードや線、対象がピン留めされているかを報告し、失敗の終了コードで終わる。

## 検証

X04 の例の入力で lint を実行し、規則1（queue、stockdb）と規則3（queue）の違反が、queue がピン留めされていることとあわせて報告され、終了コードが0以外なら合格とする。
