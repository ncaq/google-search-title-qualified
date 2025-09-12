import { isLeft } from "fp-ts/lib/Either";
import { OffscreenMessage, OffscreenResponse } from "../message";

/**
 * Offscreen側のリスナー。
 * ここでは`DOMParser`などが使える。
 */
export function onMessageListener(
  message: unknown,
  sendResponse: (response: OffscreenResponse) => void,
): boolean | undefined {
  const decoded = OffscreenMessage.decode(message);
  if (isLeft(decoded)) {
    return false;
  }
  sendResponse(handleMessageListener(decoded.right));
  return false;
}

function handleMessageListener(message: OffscreenMessage): OffscreenResponse {
  const domParser = new DOMParser();
  const dom = domParser.parseFromString(message.html, "text/html");
  switch (message.type) {
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
