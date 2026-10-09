# X10 の例

## 入力

| ファイル | 中身 |
| --- | --- |
| [docs/process.md](../../process.md) | 設計書 |
| [vocabulary.yaml](../../../benchmarks/process/vocabulary.yaml)、[grammar.yaml](../../../benchmarks/process/grammar.yaml) | 作業プロセスの語彙と文法 |

## 期待する出力

AI の出力は実行のたびに変わりうるので、座標や文字列の一致ではなく、次を満たすことを期待する。

- モデルのファイルが、モデルの JSON Schema と語彙の検査を通る。
- モデルに、座標とピン留めがない。
- モデルを、語彙と文法で描いた lint の違反が0件である。
- AI が描いた SVG と、同じモデルから CLI で描いた SVG が、バイト単位で一致する。
- 手で書いたモデル（[benchmarks/process/model.yaml](../../../benchmarks/process/model.yaml)）と比べた、ノード、線、属性の一致の度合いが、要件で決める下限以上である。比べ方は要件で決める。
