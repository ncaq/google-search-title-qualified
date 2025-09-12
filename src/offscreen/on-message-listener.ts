import { isLeft } from "fp-ts/lib/Either";
import { OffscreenMessage, OffscreenResponse } from "../message";

/**
 * Offscreen Document向けのメッセージかを同期的に判定し、
 * 該当する場合は同期的に処理して`false`を返します。
 * 該当しない場合は`false`を返して他のリスナーに委譲します。
 */
export function onMessageListener(
  message: unknown,
  sendResponse: (response: OffscreenResponse) => void,
): boolean {
  const decoded = OffscreenMessage.decode(message);
  if (isLeft(decoded)) {
    // Offscreen向けのメッセージではないので、他のリスナーに委譲。
    return false;
  }
  // Offscreen向けのメッセージなので同期的に処理
  sendResponse(handleMessage(decoded.right));
  // 同期応答を行ったのでfalseを返す。
  return false;
}

/**
 * Offscreenメッセージを同期的に処理します。
 * DOMParserを使ったHTML解析を行います。
 */
function handleMessage(message: OffscreenMessage): OffscreenResponse {
  const domParser = new DOMParser();
  const dom = domParser.parseFromString(message.html, "text/html");
  switch (message.type) {
    case "queryTitle": {
      const title = dom.querySelector("title")?.textContent ?? undefined;
      return title;
    }
    case "queryCharset": {
      return (
        dom.querySelector("meta[charset]")?.getAttribute("charset") ?? undefined
      );
    }
    case "queryContentType": {
      return (
        dom
          .querySelector('meta[http-equiv="Content-Type"]')
          ?.getAttribute("content") ?? undefined
      );
    }
    case "prettyTwitter": {
      Array.from(dom.querySelectorAll("br, p")).forEach((el) =>
        el.appendChild(document.createTextNode("\n")),
      );
      return dom.documentElement.textContent || undefined;
    }
  }
}
