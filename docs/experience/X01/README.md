# X01 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [model.yaml](../../../benchmarks/sample-arch/model.yaml) | サンプル構成図のモデル（ベンチマークのものを使う） |
| [grammar.yaml](../../../benchmarks/sample-arch/grammar.yaml)、[vocabulary.yaml](../../../benchmarks/sample-arch/vocabulary.yaml) | モデルから参照する文法と語彙 |

## 期待する出力

座標の値は決めない。次を満たすことを期待する。

- SVG と、配置の結果の JSON の両方が出る。
- grammar.md の規則1〜7の違反が0件である。
- ピン留めは0件である。
- [handplaced.svg](../../../benchmarks/sample-arch/handplaced.svg) と並べて、要素の位置関係と線の意味が一致する。
