import punycode from "punycode";
import stringWidth from "string-width";

/**
 * URLデータをもらい、配下のURL表示を書き換えます。
 */
function replace(urlString: string, link: Element): void {
  // URLのオリジンを強調するために、パスとオリジンを分離します。
  const url = new URL(urlString);
  // プロトコルを取り出し。
  const { protocol } = url;
  // punycodeを解決。
  // Node.jsにAPIが含まれるようになったから非推奨だと言われるのですが、ブラウザで使う代替が存在しないので無視します。
  const host = punycode.toUnicode(url.host);
  // 見やすいoriginを生成
  const origin = `${protocol}://${host}`;
  // パーセントエンコーディングを解決します。
  // 一部だけ入力しても問題ないようです。
  const pathAndQuery = decodeURI(url.pathname + url.search);
  // URLが結構長い場合改行が発生してレイアウトがメチャクチャになる可能性が高いため書き換えません。
  if (stringWidth(origin + pathAndQuery) >= 70) {
    return;
  }
  // aの直下ではない部分のURLテキストを書き換えないと中途半端な書き換えになってしまうので、親の要素以下のciteを全書き換え。
  const div = link.parentElement;
  if (div == null) {
    throw new Error("div is null");
  }
  Array.from(div.querySelectorAll(".TbwUpd cite")).forEach((cite) => {
    // eslint-disable-next-line no-param-reassign
    cite.textContent = origin;
    const span = document.createElement("span");
    // Googleが標準で使っているCSSクラスを使用します。
    span.setAttribute("class", "dyjrff qzEoUe");
    span.textContent = pathAndQuery;
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
