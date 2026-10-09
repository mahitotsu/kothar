# 作業項目

次に何をするかの一覧。書き方は [docs/README.md](docs/README.md) の「作業項目」を参照。

- 次の ID：T19

## T3：アイコンの扱いを決める

- 関連：[PR/FAQ](docs/prfaq.md)
- 完了条件：扱うフェーズがゲートで決まっている

AWS などのアイコンを同梱するか、利用者が用意するか。PR/FAQ の利用者向けの FAQ では「まだ決めていません。MVP では箱とラベルだけで描きます」と答えている。

## T9：CLI を npm に公開する

- 関連：[ADR 0005](docs/adr/0005-implementation-language.md)、[ADR 0013](docs/adr/0013-plugin-engine-delivery.md)、[PR/FAQ](docs/prfaq.md)
- 完了条件：扱うフェーズがゲートで決まっている

PR/FAQ は `npx kothar` で CLI を使うと書いている。Node.js は `node_modules` の中の TypeScript を扱わないので、公開するには JavaScript にする手順が要る（検証 0007）。プラグインは、ADR 0013 で npm への公開を前提にしなくなった。

## T13：前回の配置を手がかりにして、線を足したときのノードの動きを小さくする

- 関連：[R-DET-2](docs/requirements/R-DET-2.md)、[S-LAYOUT-3](docs/spec/S-LAYOUT-3.md)
- 完了条件：扱うフェーズがゲートで決まっている

線を1本足すと、本流と下段のノードの順は保たれるが、足した線に関係しないノードも動く（X06 では3つのノードが 57px）。図の差分のレビュー（P6）では、関係しないノードの動きは差分の雑音になる。render が前回の配置の結果（JSON）を ELK の対話モードに手がかりとして渡し、動きを小さくする方法が考えられる。検証から要る。

## T14：本流のノードの横の間隔をそろえる

- 関連：[R-LAYOUT-5](docs/requirements/R-LAYOUT-5.md)、[計画](docs/plan.md) の品質の評価（見た目）
- 完了条件：扱うフェーズがゲートで決まっている

R-LAYOUT-5 の確認（2026-10-07）で、手で描いた元の図のほうが、横の配置が等間隔で見やすいという指摘があった。ELK は層ごとに幅の違う間隔で置くので、本流のノードの横の間隔がそろわない。

## T15：SVG が GitHub、Firefox、Safari で表示できるかを確かめる

- 関連：[R-READ-1](docs/requirements/R-READ-1.md)、[ADR 0010](docs/adr/0010-font-embedding.md)、[検証 0005](docs/spikes/0005-human-review.md)
- 完了条件：扱うフェーズがゲートで決まっている

フェーズ1では、R-READ-1 の表示先を、確かめられた Chrome と Edge にした。PR/FAQ の P4（Kothar を知らなくても読める）と、ADR 0010 の見直す条件（埋め込んだフォントで表示されないブラウザが1つでもあれば見直す）のために、GitHub のファイルの表示、Firefox、Safari でも確かめる。

## T17：帯の名前が線と重ならないようにする

- 関連：[S-OUT-2](docs/spec/S-OUT-2.md)、[作業プロセスのサイクルの図](docs/images/process-cycle.svg)
- 完了条件：扱うフェーズがゲートで決まっている

作業プロセスのサイクルの図で、下段の帯の名前「収束のループの作業」が破線に重なっている。帯の名前の候補の位置がすべて、線かグループの枠線と重なる。リンターは帯の名前の重なりを検査していない。
