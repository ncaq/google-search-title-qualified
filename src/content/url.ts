/**
 * URLデータをもらい、配下のURL表示を書き換えます。
 */
function replace(url: string, link: Element): void {
  // パーセントエンコーディングを解決
  const decoded = decodeURI(url);
  // URLが結構長い場合改行が発生してレイアウトがメチャクチャになる可能性が高いため書き換えません。
  if (decoded.length >= 70) {
    return;
  }
  // aの直下ではない部分のURLテキストを書き換えないと中途半端な書き換えになってしまうので、親の要素以下のciteを全書き換え。
  const div = link.parentElement;
  if (div == null) {
    throw new Error("div is null");
  }
  Array.from(div.querySelectorAll(".TbwUpd cite")).forEach((cite) => {
    // eslint-disable-next-line no-param-reassign
    cite.textContent = decoded;
  });
}

/**
 * 指定linkのURL表示を書き換えます。
 */
function replaceLinkUrl(link: Element): void {
  const href = link.getAttribute("href");
  if (href == null) {
    throw new Error("link don't have href");
  }
  replace(href, link);
}

/**
 * 検索結果ページのURL表示を書き換えます。
 */
export function replaceLinkUrls(links: Element[]): void {
  links.forEach((link) => replaceLinkUrl(link));
}