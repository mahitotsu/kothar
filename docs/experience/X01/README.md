# X01 の例

文法とモデルの記述形式は未決である。ここでは、入力の中身を形式によらない表で書く。記述形式が決まったら、その形式のファイルに置き換える。

## 入力

- 文法：[benchmarks/sample-arch/grammar.md](../../../benchmarks/sample-arch/grammar.md) の軸、領域、線の種類、グループ
- モデル：下の表

### ノード

| ID | ラベル | 属性 |
| --- | --- | --- |
| user | ユーザー | |
| cdn | CDN | |
| apigw | API Gateway | |
| order | 注文サービス | |
| stock | 在庫サービス | |
| orderdb | 注文DB | |
| stockdb | 在庫DB | |
| idp | IdP | `trust: external` |
| psp | 決済代行 | `trust: external` |
| queue | イベントキュー | `mode: async` |
| worker | 通知ワーカー | `mode: async` |
| log | ログ基盤 | `concern: cross-cutting` |
| mon | 監視 | `concern: cross-cutting` |
| kms | 鍵管理 | `concern: cross-cutting` |

### グループ

| ID | ラベル | 属性 | メンバー |
| --- | --- | --- | --- |
| vpc | VPC | `boundary: network` | apigw、orderdb、stockdb、queue、worker、app |
| app | アプリ層 | `tier: app` | order、stock |

### 線

| 出る | 入る | kind | ラベル |
| --- | --- | --- | --- |
| user | cdn | call | HTTPS |
| cdn | apigw | call | |
| apigw | order | call | |
| apigw | stock | call | |
| order | orderdb | call | |
| stock | stockdb | call | |
| apigw | idp | call | トークン検証 |
| order | psp | call | 決済 |
| stock | queue | publish | 在庫変動 |
| queue | worker | publish | |
| worker | user | push | プッシュ通知 |
| vpc | log | uses | |
| vpc | mon | uses | |
| vpc | kms | uses | |

## 期待する出力

座標の値は決めない。次を満たすことを期待する。

- SVG と、配置の結果の JSON の両方が出る。
- grammar.md の規則1〜7の違反が0件である。
- ピン留めは0件である。
- [handplaced.svg](../../../benchmarks/sample-arch/handplaced.svg) と並べて、要素の位置関係と線の意味が一致する。
