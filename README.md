[![CircleCI](https://circleci.com/gh/ncaq/google-search-title-qualified.svg?style=svg)](https://circleci.com/gh/ncaq/google-search-title-qualified)
[![Mozilla Add-on](https://img.shields.io/amo/users/google-search-title-qualified.svg)](https://addons.mozilla.org/firefox/addon/google-search-title-qualified/)

# google-search-title-qualified

Google will omit the title of the web page. With this add-on, the original title is used as much as possible.

[Firefox Add-ons](https://addons.mozilla.org/firefox/addon/google-search-title-qualified/)

For Chrome is under review.

# Japanese

検索結果ページを書き換えて、
なるべくサイトオリジナルのタイトルを反映させるブラウザ拡張を作りました。
FirefoxとChromeに対応します。

## 開発理由

### 短縮させたくない

Googleの検索結果のwebページタイトルは、
かなり短い基準で短縮されてしまいます。

別に改行されても良いので、
タイトルはフルで見たいです。
検索結果を一々開くのが面倒なのです。

### Googleのタイトル謎解釈対策

また近年(いつ?)、
WikipediaやArchWikiのタイトルを意味不明に変換する事案がよく見られます。

参考: [Wikipediaページ、「Emacs」が「Emacs小指」と表示される - Google 検索セントラル コミュニティ](https://support.google.com/webmasters/thread/68265671/wikipedia%E3%83%9A%E3%83%BC%E3%82%B8%E3%80%81%E3%80%8Cemacs%E3%80%8D%E3%81%8C%E3%80%8Cemacs%E5%B0%8F%E6%8C%87%E3%80%8D%E3%81%A8%E8%A1%A8%E7%A4%BA%E3%81%95%E3%82%8C%E3%82%8B?hl=ja)

賢いなら問題ないのですが、
おおよそバカな変換をしてくるため、
サイトオリジナルの検索結果が欲しいです。

### スパムサイト対策

[iorate/uBlacklist: Blocks specific sites from appearing in Google search results](https://github.com/iorate/uBlacklist)
に、
[ncaq/uBlacklistRule: uBlacklist向けのルールです。](https://github.com/ncaq/uBlacklistRule/)
を適用してスパムサイトをなるべくブロックしていますが、
スパムサイトは筍のように増えるので、
全てブロックするのは困難です。

フルのタイトルを見ることで、
開く前からスパムサイトだと気が付ける可能性が増えます。

## 注意事項

このアドオンは検索すると結果ページほぼ全てにアクセスしてtitle要素を取ってくるため、
データ通信量が増えます。

トップレベルのHTMLしか取得しないので、
意外とそこまで通信量は増えませんが、
モバイル回線を使っている場合には注意が必要です。

# screenshot

## before

![before](docs/before.png)

## after

![after](docs/after.png)
