import { getTitleCache, saveCache } from "./cache";
import { getHtmlTitle } from "./get-html-title";
import { getTwitterTitle } from "./get-twitter";

/** バックグラウンドプロセス全体のメッセージパッシングを受け取ります */
export async function listener(message: unknown): Promise<string | undefined> {
  // メッセージ内容がおかしい場合はエラー
  if (typeof message !== "string") {
    throw new Error(
      `message is not string, is ${typeof message}: ${JSON.stringify(message)}`,
    );
  }
  const url = message;
  // PDFは読み込まない
  if (url.endsWith(".pdf")) {
    return undefined;
  }
  const cacheTitle = await getTitleCache(url);
  if (cacheTitle == null) {
    // TwitterのAPIかHTMLのtitleタグを取得。
    const title = (await getTwitterTitle(url)) ?? (await getHtmlTitle(url));
    // あえてPromiseの終了を待ちません。
    saveCache(url, title).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("saveCache is error", err, url, title);
    });
    return title;
  }
  return cacheTitle;
}
