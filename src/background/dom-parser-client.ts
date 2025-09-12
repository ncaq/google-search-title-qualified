import { sendToOffscreen } from "./offscreen-client";

/**
 * `DOMParser`が実際に正しく動作するかをチェックします。
 * ChromeのManifest V3のService Workerでは`DOMParser`は存在するが、
 * `parseFromString`の結果に対して`querySelector`等が正しく動作しません。
 * FirefoxのWebExtension APIなどでは動作します。
 */
function checkDOMParser(): boolean {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString("<title>test</title>", "text/html");
    const title = doc.querySelector("title")?.textContent;
    // 正常に動作していればtitleは"test"になるはず
    return title === "test";
  } catch {
    return false;
  }
}

/**
 * `DOMParser`が実際に正しく動作するかを一度だけチェックしてキャッシュします。
 */
const workDOMParser: boolean = checkDOMParser();

/**
 * `title`を取得します。
 */
export async function queryTitle(text: string): Promise<string | undefined> {
  if (workDOMParser) {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return dom.querySelector("title")?.textContent ?? undefined;
  } else {
    return await sendToOffscreen({
      target: "offscreen",
      type: "queryTitle",
      html: text,
    });
  }
}

/**
 * `meta[charset]`を取得します。
 */
export async function queryCharset(text: string): Promise<string | undefined> {
  if (workDOMParser) {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return (
      dom.querySelector("meta[charset]")?.getAttribute("charset") ?? undefined
    );
  } else {
    return await sendToOffscreen({
      target: "offscreen",
      type: "queryCharset",
      html: text,
    });
  }
}

/**
 * `meta[http-equiv="Content-Type"]`を取得します。
 */
export async function queryContentType(
  text: string,
): Promise<string | undefined> {
  if (workDOMParser) {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return (
      dom
        .querySelector('meta[http-equiv="Content-Type"]')
        ?.getAttribute("content") ?? undefined
    );
  } else {
    return await sendToOffscreen({
      target: "offscreen",
      type: "queryContentType",
      html: text,
    });
  }
}

/**
 * Twitterは改行などが反映されないと少し見苦しいので、
 * ちょっとした整形をする。
 * 本当はスニペットとして埋め込みたいのだが、
 * 外部コードを注入する拡張機能はポリシー的に弾かれるだろう。
 * 非破壊的に構築する方法が今ひとつ分からなかった、すぐに関数を離れるから問題ないだろう。
 */
export async function prettyTwitter(html: string): Promise<string | undefined> {
  if (workDOMParser) {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(html, "text/html");
    Array.from(dom.querySelectorAll("br, p")).forEach((el) =>
      el.appendChild(document.createTextNode("\n")),
    );
    return dom.documentElement.textContent || undefined;
  } else {
    return await sendToOffscreen({
      target: "offscreen",
      type: "prettyTwitter",
      html,
    });
  }
}
