# X02 の例

記述形式が未決なので、入力の中身を表で書く（[X01 の例](../X01/README.md) と同じ）。

## 入力

- 文法：X01 と同じ（[benchmarks/sample-arch/grammar.md](../../../benchmarks/sample-arch/grammar.md)）
- モデル：下の表

### ノード

| ID | ラベル | 属性 |
| --- | --- | --- |
| user | 社員 | |
| web | 経費精算画面 | |
| claim | 申請サービス | |
| claimdb | 申請DB | |
| acct | 会計サービス | `trust: external` |
| approval | 承認キュー | `mode: async` |
| notifier | 通知ワーカー | `mode: async` |
| audit | 監査ログ | `concern: cross-cutting` |

### グループ

| ID | ラベル | 属性 | メンバー |
| --- | --- | --- | --- |
| vpc | VPC | `boundary: network` | claim、claimdb、approval、notifier |

### 線

| 出る | 入る | kind | ラベル |
| --- | --- | --- | --- |
| user | web | call | HTTPS |
| web | claim | call | |
| claim | claimdb | call | |
| claim | acct | call | 仕訳 |
| claim | approval | publish | 申請 |
| approval | notifier | publish | |
| notifier | user | push | 承認依頼 |
| vpc | audit | uses | |

## 期待する出力

- 文法のファイルは X01 と同じもので、変更していない。
- grammar.md の規則1〜7の違反が0件である。
- ピン留めは0件である。
- 会計サービスは申請サービスの真上、承認キューと通知ワーカーは本流より下、監査ログはすべてのノードより右にある。
