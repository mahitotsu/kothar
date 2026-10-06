---
id: X07
promises: [P12]
users: [描く人, 読む人]
approved_cycle: 1
---

# X07：コミットされた図が最新かを CI で確かめる

## 状況

X01 のモデルと `architecture.svg` がリポジトリにコミットされている。CI は、AI を使わない環境で動く。描く人は、モデルにノードと線を1つずつ足したが、図を描き直さずにプッシュしてしまった。

## 操作

CI で次のコマンドを実行する。

```
npx kothar lint architecture.kothar
npx kothar check architecture.kothar architecture.svg
```

## 見えるもの

- モデルとコミットされた図が食い違っているので、`check` は失敗の終了コードで終わり、CI が失敗する。
- メッセージから、コミットされた図がモデルから描いた図と違うこと、`render` で描き直せばよいことが分かる。
- 描き直してコミットし直すと、`lint` と `check` はどちらも成功の終了コードで終わり、CI が通る。
- 読む人は、CI が通ったプルリクエストの図が、モデルを正しく表していると信じてレビューできる。

## 例

[X07/](X07/)
