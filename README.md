[![CircleCI](https://circleci.com/gh/ncaq/google-search-title-to-qualified.svg?style=svg)](https://circleci.com/gh/ncaq/google-search-title-to-qualified)

# google-search-title-to-qualified

Google will omit the title of the web page. With this add-on, the original title is used as much as possible.

![before](docs/before.png)

![after](docs/after.png)

# Japanese

Googleの検索結果のwebページタイトルは、
かなり短い基準で短縮されてしまいます。

別に改行されても良いので、
タイトルはフルで見たいです。
検索結果を一々開くのが面倒ですね。

また近年(いつ?)、
WikipediaやArchWikiのタイトルを意味不明に変換する事案がよく見られます。

参考: [Wikipediaページ、「Emacs」が「Emacs小指」と表示される - Google 検索セントラル コミュニティ](https://support.google.com/webmasters/thread/68265671/wikipedia%E3%83%9A%E3%83%BC%E3%82%B8%E3%80%81%E3%80%8Cemacs%E3%80%8D%E3%81%8C%E3%80%8Cemacs%E5%B0%8F%E6%8C%87%E3%80%8D%E3%81%A8%E8%A1%A8%E7%A4%BA%E3%81%95%E3%82%8C%E3%82%8B?hl=ja)

賢いなら問題ないのですが、
おおよそバカな変換をしてくるため、
もうサイトオリジナルの検索結果が欲しいです。

そこで、
検索結果ページを書き換えて、
なるべくサイトオリジナルのタイトルを反映させるブラウザ拡張を作ることにしました。
FirefoxとChromeに対応します。
