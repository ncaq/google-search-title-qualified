import * as t from "io-ts";
import { prettyTwitter } from "./dom-parser-client";
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
          url.hostname === "mobile.twitter.com" ||
          url.hostname === "x.com" ||
          url.hostname === "mobile.x.com") &&
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
      // eslint-disable-next-line no-console
      console.warn(
        `${publish.href}: response is not ok. Status: ${response.status.toString()}, StatusText: ${JSON.stringify(
          response.statusText,
        )}`,
      );
      return undefined;
    }
    const j: unknown = await response.json();
    if (!twitterOembed.is(j)) {
      // eslint-disable-next-line no-console
      console.warn(
        `${publish.href}: response is not twitterOembed. ${JSON.stringify(j)}`,
      );
      return undefined;
    }
    return await prettyTwitter(j.html);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getTwitterTitle error", err, urlString);
    return undefined;
  }
}
