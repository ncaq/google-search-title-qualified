import { extractTitle } from "./extract-title";
import { fetchPage } from "./fetch-page";

/** URLからHTMLを取得解析してタイトルを取得します */
export async function getHtmlTitle(url: string): Promise<string | undefined> {
  try {
    const response = await fetchPage(url);
    if (!response.ok) {
      throw new Error(
        `${url}: response is not ok ${JSON.stringify(response.statusText)}`,
      );
    }
    const title = await extractTitle(response);
    return title && cleanTitle(title);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getHtmlTitle error", err, url);
    return undefined;
  }
}

/**
 * titleソースコード周囲にある空白を除去。
 * 改行は論理的な分割かもしれないし、
 * HTMLソースの幅の問題かもしれないので、
 * 空白に変換します。
 */
function cleanTitle(title: string): string {
  return title.trim().replaceAll(/\n+/g, " ");
}
