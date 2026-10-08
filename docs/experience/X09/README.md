# X09 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model.yaml](../../../benchmarks/sample-arch/model.yaml)、[vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml) | X01 と同じモデルと語彙。変えない |
| リクエストの流れの図の文法 | 下の表の約束事を書いた文法。文法の書き方（語彙）は、このサイクルの仕様で決めるので、決まったら YAML のファイルにする |

リクエストの流れの図の文法に書く約束事：

| 約束事 | 内容 |
| --- | --- |
| 流れの向き | 左から右 |
| 出すもの | `call` の線と、その両端のノードだけ |
| 領域 | `trust: external` のノードは上段（呼び出す側の真上）、ほかは本流 |

## 期待する出力

- モデルのファイルが、描く前と同じである。
- SVG と配置の結果の JSON にあるノードは、user、cdn、apigw、order、stock、orderdb、stockdb、idp、psp だけである。
- 線は、モデルの `call` の線（8本）だけである。
- `call` の線は、出るノードが入るノードより左にある（上段への線を除く）。
- idp と psp は、それぞれ apigw と order の真上にある。
- lint の違反が0件である。
