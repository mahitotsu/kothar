# X09 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model.yaml](../../../benchmarks/sample-arch/model.yaml)、[vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml) | X01 と同じモデルと語彙。変えない |
| [request-flow.yaml](../../../benchmarks/sample-arch/request-flow.yaml) | リクエストの流れの図の文法。約束事の説明は [request-flow.md](../../../benchmarks/sample-arch/request-flow.md) にある |

## 期待する出力

- モデルのファイルが、描く前と同じである。
- SVG と配置の結果の JSON にあるノードは、user、cdn、apigw、order、stock、orderdb、stockdb、idp、psp だけである。
- 線は、モデルの `call` の線（8本）だけである。
- `call` の線は、出るノードが入るノードより左にある（上段への線を除く）。
- idp と psp は、それぞれ apigw と order の真上にある。
- lint の違反が0件である。
