import * as t from "io-ts";
import { domParser } from "./extract-title";
import { fetchPage } from "./fetch-page";

const twitterOembed = t.type({
  html: t.string,
});

/** Twitterはブラウザ向けにはSSRしないため、専用のAPIを使ってタイトルを全取得します。 */
export async function getTwitterTitle(
  urlString: string,
): Promise<string | undefined> {
  try {
    const url = new URL(urlString);
    // TwitterのURLやツイートのURLじゃない場合は`undefined`を返します。
    if (
      !(
        (url.hostname === "twitter.com" ||
          url.hostname === "mobile.twitter.com") &&
        /^\/\w+\/status\/\d+/.exec(url.pathname)
      )
    ) {
      return undefined;
    }
    const publish = new URL("https://publish.twitter.com/oembed");
    publish.searchParams.set("url", url.href);
    // textContentで表示するのでscriptは関係ないですが、余計なものなので取り除いておきます。
    publish.searchParams.set("omit_script", "t");
    // ブラウザの言語設定が反映されないと日時が英語になって辛いので設定します。
    publish.searchParams.set("lang", navigator.language || "en");
    const response = await fetchPage(publish.href);
    if (!response.ok) {
      throw new Error(
        `${publish.href}: response is not ok ${JSON.stringify(
          response.statusText,
        )}`,
      );
    }
    const j: unknown = await response.json();
    if (!twitterOembed.is(j)) {
      return undefined;
    }
    const dom = domParser.parseFromString(j.html, "text/html");
    // Twitterは改行などが反映されないと少し見苦しいので、
    // ちょっとした整形をする。
    // 本当はスニペットとして埋め込みたいのだが、
    // 外部コードを注入する拡張機能はポリシー的に弾かれるだろう。
    // 非破壊的に構築する方法が今ひとつ分からなかった、すぐに関数を離れるから問題ないだろう。
    Array.from(dom.querySelectorAll("br, p")).forEach((el) =>
      el.appendChild(document.createTextNode("\n")),
    );
    return dom.documentElement.textContent || undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getTwitterTitle error", err, urlString);
    return undefined;
  }
}
