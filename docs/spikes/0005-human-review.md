# 検証 0005：人の確認と読み手の理解度テスト（フェーズ1）

- 実施日：2026-10-07
- 関連する ADR：[0001](../adr/0001-layout-approach.md)、[0010](../adr/0010-font-embedding.md)、[0011](../adr/0011-bundled-font.md)
- 検証のコード：なし

## 目的

フェーズ1の要件のうち、検証の方法が人の確認と読み手の理解度テストのものを確かめる。

| 要件 | 検証の方法 |
| --- | --- |
| [R-LAYOUT-5](../requirements/R-LAYOUT-5.md) | 人の確認 |
| [R-READ-1](../requirements/R-READ-1.md) | 人の確認 |
| [R-READ-2](../requirements/R-READ-2.md) | 読み手の理解度テスト |

## 方法

X01 の例の入力（[benchmarks/sample-arch/model.yaml](../../benchmarks/sample-arch/model.yaml)）を、コミット 971c9d1 のエンジンで描いた SVG（[evidence/0005-human-review/x01.svg](evidence/0005-human-review/x01.svg)）を使った。確かめたのは責任者である。

| 要件 | 手順 |
| --- | --- |
| R-LAYOUT-5 | 描いた SVG を、手で描いた元の図（[handplaced.svg](../../benchmarks/sample-arch/handplaced.svg)）と並べ、要件の検証に挙げた4つの点が一致するかを見た |
| R-READ-1 | 描いた SVG を、Kothar を入れていない環境の Chrome と Edge で開いた |
| R-READ-2 | [X05 の例](../experience/X05/README.md) の7つの問いを、文法の説明と描いた SVG だけを渡した読み手に答えさせた |

## 結果

| 要件 | 結果 |
| --- | --- |
| R-LAYOUT-5 | 4つの点は一致した。合格 |
| R-READ-1 | Chrome と Edge で表示された。合格 |
| R-READ-2 | 読み手は7問すべてに正しく答えた。正答率は 100% で、手で描いた図の正答率以上である。合格 |

## 観察

1. **R-LAYOUT-5 の確認で、手で描いた元の図のほうが、横の配置が等間隔で見やすいという指摘があった。**

## 限界

- **R-READ-1 は、GitHub のファイルの表示、Firefox、Safari では確かめていない。**
- **R-READ-2 の読み手が人か LLM かと、手で描いた図での正答率は、記録していない。** 描いた図の正答率が 100% なので、合格の条件は手で描いた図の正答率によらず満たす。
- **確かめた図は X01 の1枚だけである。**
