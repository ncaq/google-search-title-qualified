import { isLeft } from "fp-ts/lib/Either";
import { BackgroundMessage } from "../message";
import { getTitleCache, saveCache } from "./cache";
import { getHtmlTitle } from "./get-html-title";
import { getTwitterTitle } from "./get-twitter";

/** バックグラウンドプロセス全体のメッセージパッシングを受け取ります */
export async function listener(message: unknown): Promise<string | undefined> {
  const decoded = BackgroundMessage.decode(message);
  if (isLeft(decoded)) {
    return;
  }
  const validMessage = decoded.right;
  const { url } = validMessage;
  // PDFは読み込まない
  if (url.endsWith(".pdf")) {
    return undefined;
  }
  const cacheTitle = await getTitleCache(url);
  if (cacheTitle == null) {
    // TwitterのAPIかHTMLのtitleタグを取得。
    const title = (await getTwitterTitle(url)) ?? (await getHtmlTitle(url));
    // あえてPromiseの終了を待たずに非同期でキャッシュを保存します。
    saveCache(url, title).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("saveCache is error", err, url, title);
    });
    return title;
  }
  return cacheTitle;
}
