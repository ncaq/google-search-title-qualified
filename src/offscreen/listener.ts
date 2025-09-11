import * as t from "io-ts";

/**
 * Offscreen側のリスナー。
 * ここでは`DOMParser`などが使える。
 */
export async function listener(message: unknown): Promise<string | undefined> {
  // メッセージ内容がおかしい場合はエラー
  if (typeof message !== "string") {
    throw new Error(
      `message is not string, is ${typeof message}: ${JSON.stringify(message)}`,
    );
  }
  await Promise.resolve(); // 実装前のダミー。
  return undefined;
}
