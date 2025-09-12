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
    const getContexts = chrome.runtime.getContexts;
    const existingContexts = await getContexts({
      contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
    });
    return existingContexts.length > 0;
  } catch {
    // APIが利用できない場合はfalseを返す
    return false;
  }
}

/**
 * Offscreen Documentを作成または既存のものを使用。
 * セマフォで同時作成を防ぐ。
 */
async function ensureOffscreenDocument(): Promise<void> {
  await offscreenSema.acquire();
  try {
    const exists = await checkOffscreenDocumentExists();
    if (!exists) {
      const createDocument = chrome.offscreen.createDocument;
      await createDocument({
        url: runtime.getURL("/asset/offscreen/index.html"),
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
  const response = await runtime.sendMessage(message);
  if (!OffscreenResponse.is(response)) {
    throw new Error(
      `response is not OffscreenResponse: ${JSON.stringify(response)}`,
    );
  }
  return response ?? undefined;
}
