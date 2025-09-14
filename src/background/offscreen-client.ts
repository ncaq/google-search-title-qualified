import { OffscreenMessage } from "../message";

/** esbuild側で定義されているターゲット変数。 */
declare const __BROWSER_TARGET__: "firefox" | "chrome";

import { sendToOffscreen as sendToOffscreenChrome } from "./offscreen-chrome";

/**
 * Offscreen Documentにメッセージを送信。
 * FirefoxではOffscreen APIがサポートされていないため、
 * 警告を防ぐために別の関数に分けている。
 */
export function sendToOffscreen(
  message: OffscreenMessage,
): Promise<string | undefined> {
  if (__BROWSER_TARGET__ === "firefox") {
    throw new Error("Offscreen API is not supported in Firefox.");
  } else {
    return sendToOffscreenChrome(message);
  }
}
