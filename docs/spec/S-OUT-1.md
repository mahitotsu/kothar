---
id: S-OUT-1
status: 確定
satisfies: [R-RENDER-2, R-PIN-2]
grounds: [packages/core/test/acceptance.test.ts, packages/cli/test/cli.test.ts]
---

# S-OUT-1：配置の結果の JSON

配置の結果を、次の形の JSON で出力する。

| キー | 中身 |
| --- | --- |
| `nodes` | ノードごとに、ID（`id`）、領域の名前（`region`）、中心の座標（`x`、`y`）、幅（`width`）、高さ（`height`）、ピン留めしたか（`pinned`） |
| `edges` | 線ごとに、出る ID（`from`）、入る ID（`to`）、線の種類（`kind`）、スタイル（`style`）、経路の点列（`points`）、ラベルの文字と左上の座標と大きさ（`label`） |
| `groups` | グループごとに、ID（`id`）、枠の左上の座標（`x`、`y`）、幅（`width`）、高さ（`height`） |
| `pins` | ピン留めの数（`count`）と、ピン留めしたノードの ID（`nodes`） |

配列はモデルに書いた順、キーは上の順で出力する。
