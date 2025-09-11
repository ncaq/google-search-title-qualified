import { isLeft } from "fp-ts/lib/Either";
import { PathReporter } from "io-ts/lib/PathReporter";
import { OffscreenMessage } from "./message-types";

/**
 * Offscreen側のリスナー。
 * ここでは`DOMParser`などが使える。
 */
export function listener(message: unknown): string | undefined {
  // JSONメッセージをパースしてバリデーション。
  if (typeof message !== "string") {
    throw new Error(`Message is not a string: ${typeof message}`);
  }

  const json: unknown = JSON.parse(message);
  const decoded = OffscreenMessage.decode(json);

  if (isLeft(decoded)) {
    throw new Error(
      `Invalid message format: ${PathReporter.report(decoded).join(", ")}`,
    );
  }
  const validMessage = decoded.right;

  const domParser = new DOMParser();
  const dom = domParser.parseFromString(validMessage.html, "text/html");

  switch (validMessage.type) {
    case "queryTitle": {
      return dom.querySelector("title")?.textContent ?? undefined;
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
