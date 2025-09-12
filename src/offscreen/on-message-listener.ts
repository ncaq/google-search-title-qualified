import { isLeft } from "fp-ts/lib/Either";
import { OffscreenMessage } from "../message";

/**
 * Offscreen側のリスナー。
 * ここでは`DOMParser`などが使える。
 */
export function onMessageListener(message: unknown): string | undefined {
  const decoded = OffscreenMessage.decode(message);
  if (isLeft(decoded)) {
    // 無関係なメッセージは無視。
    return undefined;
  }
  const validMessage = decoded.right;

  const domParser = new DOMParser();
  const dom = domParser.parseFromString(validMessage.html, "text/html");
  switch (validMessage.type) {
    case "queryTitle": {
      const title = dom.querySelector("title")?.textContent ?? undefined;
      // eslint-disable-next-line no-console
      console.log("Offscreen found title:", title);
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
