import stringWidth from "string-width";

/**
 * URLデータをもらい、配下のURL表示を書き換えます。
 */
function replace(urlString: string, link: Element): void {
  // URLのオリジンを強調するために、パスとオリジンを分離します。
  const url = new URL(urlString);
  // パーセントエンコーディングを解決
  const pathname = decodeURI(url.pathname);
  // URLが結構長い場合改行が発生してレイアウトがメチャクチャになる可能性が高いため書き換えません。
  if (stringWidth(url.origin + pathname) >= 80) {
    return;
  }
  // aの直下ではない部分のURLテキストを書き換えないと中途半端な書き換えになってしまうので、親の要素以下のciteを全書き換え。
  const div = link.parentElement;
  if (div == null) {
    throw new Error("div is null");
  }
  Array.from(div.querySelectorAll(".TbwUpd cite")).forEach((cite) => {
    // eslint-disable-next-line no-param-reassign
    cite.textContent = url.origin;
    const span = document.createElement("span");
    // Googleが標準で使っているCSSクラスを使用します。
    span.setAttribute("class", "dyjrff qzEoUe");
    span.textContent = pathname;
    cite.append(span);
  });
}

/**
 * 指定linkのURL表示を書き換えます。
 */
function replaceLinkUrl(link: Element): void {
  try {
    const href = link.getAttribute("href");
    if (href == null) {
      throw new Error("link don't have href");
    }
    replace(href, link);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("replaceLinkUrl is error.", err, link);
  }
}

/**
 * 検索結果ページのURL表示を書き換えます。
 */
export function replaceLinkUrls(links: Element[]): void {
  links.forEach((link) => replaceLinkUrl(link));
}
