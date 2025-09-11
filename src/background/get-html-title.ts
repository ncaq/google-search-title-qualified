import { detectEncoding } from "./encoding";
import { domParser, encodingJapaneseTitle } from "./extract-title";
import { fetchPage } from "./fetch-page";

/** URLからHTMLを取得解析してタイトルを取得します */
export async function getHtmlTitle(url: string): Promise<string | undefined> {
  try {
    // HTMLを取得、パースして結果を返す。
    // 結果をまとめて加工したいため、内部関数に分ける。
    const getText = async () => {
      const response = await fetchPage(url);
      if (!response.ok) {
        throw new Error(
          `${url}: response is not ok ${JSON.stringify(response.statusText)}`,
        );
      }
      // encodingJapaneseはstringに完全になってないArrayを要求するため、blobでレスポンスを消費します。
      const blob = await response.blob();
      const text = await blob.text();
      const dom = domParser.parseFromString(text, "text/html");
      // エンコードを推定します。
      const encoding = detectEncoding(response, dom);
      // エンコードを取得できなかったら無を返します。
      if (encoding == null) {
        return undefined;
      }
      // UTF-8の場合変換は必要ありません。
      if (encoding === "UTF8") {
        return dom.querySelector("title")?.textContent ?? undefined;
      }
      // 他のエンコードでencoding-japaneseが対応しているものは変換を試みます。
      if (["SJIS", "EUCJP"].includes(encoding)) {
        return encodingJapaneseTitle(
          new Uint8Array(await blob.arrayBuffer()),
          encoding,
        );
      }
      return undefined;
    };
    // titleソースコード周囲にある空白は除去。
    // 改行は論理的な分割かもしれないし、
    // HTMLソースの幅の問題かもしれないので空白に変換する。
    return (await getText())?.trim().replaceAll(/\n+/g, " ");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getHtmlTitle error", err, url);
    return undefined;
  }
}
