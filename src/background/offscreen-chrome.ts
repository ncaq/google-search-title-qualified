import { Sema } from "async-sema";
import { runtime } from "webextension-polyfill";
import { OffscreenMessage, OffscreenResponse } from "../message";

/**
 * Offscreen Document作成のセマフォ。
 * 同時に1つの作成処理のみを許可。
 */
const offscreenSema = new Sema(1);

/**
 * Offscreen Documentの存在確認。
 * Chrome APIを使って実際の状態を確認。
 */
async function checkOffscreenDocumentExists(): Promise<boolean> {
  try {
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    return existingContexts.length > 0;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("checkOffscreenDocumentExists is error.", err);
    // APIが利用できない場合はfalseを返す
    return false;
  }
}

/**
 * Offscreen Documentを作成または既存のものを使用。
 * セマフォで同時作成を防ぐ。
 * Offscreenのリソースの管理はChrome側が行っているため、
 * こちらで明示的に削除は行わない。
 */
async function ensureOffscreenDocument(): Promise<void> {
  await offscreenSema.acquire();
  try {
    const exists = await checkOffscreenDocumentExists();
    if (!exists) {
      await chrome.offscreen.createDocument({
        url: chrome.runtime.getURL("/asset/offscreen/index.html"),
        reasons: ["DOM_PARSER"],
        justification: "Parse HTML to extract metadata",
      });
    }
  } finally {
    offscreenSema.release();
  }
}

/**
 * Offscreen Documentにメッセージを送信。
 */
export async function sendToOffscreen(
  message: OffscreenMessage,
): Promise<string | undefined> {
  await ensureOffscreenDocument();
  const response: unknown = await runtime.sendMessage(message);
  if (!OffscreenResponse.is(response)) {
    throw new Error(
      `response is not OffscreenResponse: ${JSON.stringify(response)}`,
    );
  }
  return response ?? undefined;
}
