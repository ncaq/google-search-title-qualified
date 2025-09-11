import { sendToOffscreen } from "./offscreen-client";

/**
 * `DOMParserが`使える場合はそのまま`title`を取得します。
 * それ以外の場合はOffscreen Documentを使って取得します。
 */
export async function queryTitle(text: string): Promise<string | undefined> {
  try {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return dom.querySelector("title")?.textContent ?? undefined;
  } catch (_err) {
    return await sendToOffscreen({
      target: "offscreen",
      type: "queryTitle",
      html: text,
    });
  }
}

/**
 * `DOMParser`が使える場合はそのまま`meta[charset]`を取得します。
 * それ以外の場合はOffscreen Documentを使って取得します。
 */
export async function queryCharset(text: string): Promise<string | undefined> {
  try {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return (
      dom.querySelector("meta[charset]")?.getAttribute("charset") ?? undefined
    );
  } catch (_err) {
    return await sendToOffscreen({
      target: "offscreen",
      type: "queryCharset",
      html: text,
    });
  }
}

/**
 * `DOMParser`が使える場合はそのまま`meta[http-equiv="Content-Type"]`を取得します。
 * それ以外の場合はOffscreen Documentを使って取得します。
 */
export async function queryContentType(
  text: string,
): Promise<string | undefined> {
  try {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(text, "text/html");
    return (
      dom
        .querySelector('meta[http-equiv="Content-Type"]')
        ?.getAttribute("content") ?? undefined
    );
  } catch (_err) {
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
 * `DOMParser`が使える場合はそのまま利用。
 * それ以外の場合はOffscreen Documentを使って取得します。
 */
export async function prettyTwitter(html: string): Promise<string | undefined> {
  try {
    const domParser = new DOMParser();
    const dom = domParser.parseFromString(html, "text/html");
    Array.from(dom.querySelectorAll("br, p")).forEach((el) =>
      el.appendChild(document.createTextNode("\n")),
    );
    return dom.documentElement.textContent || undefined;
  } catch (_err) {
    return await sendToOffscreen({
      target: "offscreen",
      type: "prettyTwitter",
      html,
    });
  }
}
