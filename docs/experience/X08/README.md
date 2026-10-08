# X08 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model.yaml](../../../benchmarks/sample-arch/model.yaml)、[vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml) | X01 と同じモデルと語彙。変えない |
| [trust.yaml](../../../benchmarks/sample-arch/trust.yaml) | 信頼境界の図の文法。約束事の説明は [trust.md](../../../benchmarks/sample-arch/trust.md) にある |

## 期待する出力

- モデルのファイルが、描く前と同じである。
- ノードの列は次のとおり。

| 列 | ノード |
| --- | --- |
| 左 | user、cdn |
| 中央 | apigw、order、stock、orderdb、stockdb、queue、worker |
| 右 | idp、psp |

- log、mon、kms と、それらへの線は、SVG にも配置の結果の JSON にもない。
- 次の線が、境界をまたぐ線のスタイルで描かれ、ほかの線は境界の中の線のスタイルで描かれる：cdn→apigw、apigw→idp、order→psp、worker→user。
- lint の違反が0件である。
