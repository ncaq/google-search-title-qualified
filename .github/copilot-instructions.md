# For LLM Instructions

## 出力設定

日本語で応答してください。
しかしコードのコメントなどは元の言語のままにしてください。

全角記号より半角記号を優先して使ってください。
特に全角括弧は禁止。

## 重要コマンド

### フォーマット

```console
yarn fix
```

### リント

```console
yarn lint
```

## ファイル

### `manifest.json`

`manifest.json`はGitリポジトリに含めていません。
gitignoreしています。

ビルドするときに、
`manifest.json.make.ts`をyarnのランナーで実行して`manifest.json`を生成しています。

なぜそうしているのかと言うと、
`content_scripts`をGoogleの検索結果ページだけで実行したいのですが、
Googleの所有するドメインをスクリプトで収集して実行場所を最新の最小限の状態にしたいからです。

まあ最近は`google.com`だけに統一されるという話があるので、
もうその必要はないのかもしれませんが、
とにかくそういう理由で`manifest.json`はプログラムで生成しています。

## 対応ブラウザのバージョン

FirefoxのサポートされているESRバージョンを最小限サポートして、
バンドラーなどの設定はそれに合わせます。

ChromeはLTS的なバージョンを使っている人がほとんどいないと思うのと、
Firefoxの最新版ならともかくFirefoxのESRに比べてChromeの最新版がJavaScriptの新機能をサポートしていないことはほとんどないので、
最新版想定であまり考慮していません。
