import { isLeft } from "fp-ts/lib/Either";
import { BackgroundMessage, BackgroundResponse } from "../message";
import { getTitleCache, saveCache } from "./cache";
import { getHtmlTitle } from "./get-html-title";
import { getTwitterTitle } from "./get-twitter";

/** バックグラウンドプロセス全体のメッセージパッシングを受け取ります */
export function onMessageListener(
  message: unknown,
  sendResponse: (response: BackgroundResponse) => void,
): boolean | undefined {
  const decoded = BackgroundMessage.decode(message);
  if (isLeft(decoded)) {
    return false;
  }
  (async () => {
    sendResponse(await handleMessageListener(decoded.right));
  })().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error("onMessageListener is error.", err);
  });
  return true;
}

async function handleMessageListener(
  message: BackgroundMessage,
): Promise<BackgroundResponse> {
  const { url } = message;
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
