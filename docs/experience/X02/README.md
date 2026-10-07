# X02 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model.yaml](model.yaml) | 経費精算システムのモデル |
| [grammar.yaml](../../../benchmarks/sample-arch/grammar.yaml)、[vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml) | モデルから参照する文法と語彙。X01 と同じファイル |

## 期待する出力

- 文法のファイルは X01 と同じもので、変更していない。
- grammar.md の規則1〜7の違反が0件である。
- ピン留めは0件である。
- 会計サービスは申請サービスの真上、承認キューと通知ワーカーは本流より下、監査ログはすべてのノードより右にある。
