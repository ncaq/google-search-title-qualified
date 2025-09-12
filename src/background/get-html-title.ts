import { extractTitle } from "./extract-title";
import { fetchPage } from "./fetch-page";

/** URLからHTMLを取得解析してタイトルを取得します */
export async function getHtmlTitle(url: string): Promise<string | undefined> {
  try {
    const response = await fetchPage(url);
    if (!response.ok) {
      // eslint-disable-next-line no-console
      console.warn(
        `${url}: response is not ok. Status: ${response.status.toString()}, StatusText: ${JSON.stringify(response.statusText)}`,
      );
      return undefined;
    }
    const title = await extractTitle(response);
    if (title == null) {
      // eslint-disable-next-line no-console
      console.warn(`extractTitle returned undefined. url: ${url}`);
      return undefined;
    }
    return cleanTitle(title);
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
