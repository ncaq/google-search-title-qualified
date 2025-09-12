import { isLeft } from "fp-ts/lib/Either";
import { BackgroundMessage, BackgroundResponse } from "../message";
import { getTitleCache, saveCache } from "./cache";
import { getHtmlTitle } from "./get-html-title";
import { getTwitterTitle } from "./get-twitter";

/**
 * バックグラウンド向けのメッセージかを同期的に判定し、
 * 該当する場合は非同期処理を開始してtrueを返します。
 * 該当しない場合はfalseを返して他のリスナーに委譲します。
 */
export function onMessageListener(
  message: unknown,
  sendResponse: (response: BackgroundResponse) => void,
): boolean {
  const decoded = BackgroundMessage.decode(message);
  if (isLeft(decoded)) {
    // バックグラウンド向けのメッセージではないので、他のリスナーに委譲
    return false;
  }
  // バックグラウンド向けのメッセージなので非同期処理を開始
  handleMessage(decoded.right)
    .then(sendResponse)
    .catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("onMessageListener is error.", err);
      sendResponse(undefined);
    });
  // 非同期応答を行うことをChromeに通知
  return true;
}

/**
 * バックグラウンドメッセージを非同期で処理します。
 */
async function handleMessage(
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
