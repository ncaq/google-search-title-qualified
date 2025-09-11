import { runtime } from "webextension-polyfill";
import {
  OffscreenMessage,
  OffscreenResponse,
} from "../offscreen/message-types";

/**
 * Offscreen Documentを作成または既存のものを使用。
 * Offscreen Document APIが利用できない場合は例外が発生する。
 * TypeScriptはAPIがグローバル変数に存在することを認識している。
 * コンパイル時と異なるランタイム型を検知したとき例外が発生する。
 */
async function ensureOffscreenDocument(): Promise<void> {
  const getContexts = chrome.runtime.getContexts;
  const existingContexts = await getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT" as chrome.runtime.ContextType],
  });
  if (existingContexts.length === 0) {
    const createDocument = chrome.offscreen.createDocument;
    await createDocument({
      url: runtime.getURL("/asset/offscreen/index.html"),
      reasons: ["DOM_PARSER"],
      justification: "Parse HTML to extract metadata",
    });
  }
}

/**
 * Offscreen Documentにメッセージを送信。
 */
export async function sendToOffscreen(
  message: OffscreenMessage,
): Promise<OffscreenResponse> {
  await ensureOffscreenDocument();
  const response = await runtime.sendMessage(JSON.stringify(message));
  if (!OffscreenResponse.is(response)) {
    throw new Error(
      `response is not OffscreenResponse: ${JSON.stringify(response)}`,
    );
  }
  return response;
}
