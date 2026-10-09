# X11 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model-broken.yaml](model-broken.yaml) | サンプル構成図のモデルに、次の3つの誤りを入れたもの |
| [vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml)、[grammar.yaml](../../../benchmarks/sample-arch/grammar.yaml) | サンプル構成図の語彙と文法 |

入れた誤り：

| 誤り | 場所 | 正しくは |
| --- | --- | --- |
| 属性の名前の書き間違い | idp の `trsut: external` | `trust: external` |
| 存在しないノードへの線 | apigw から `odrer` への線 | apigw から order への線 |
| 違反を起こすピン留め | queue を (875, 364) に固定。コミット 5a2c9e1 のエンジンで描いた X01 の配置での stockdb の中心で、規則1と規則3の違反になる | ピン留めなし |

## 期待する出力

- 直したモデルの lint が、入力の誤りも違反も0件である。
- 直したモデルが、サンプル構成図のモデル（[model.yaml](../../../benchmarks/sample-arch/model.yaml)）と、語彙と文法のファイルのパスを除いて同じ内容である。
- 語彙と文法のファイルが変わっていない。
