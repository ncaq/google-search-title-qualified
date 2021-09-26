import browser from "webextension-polyfill";

/**
 * ページ内容のタイトルをbackgroundから取得して、取得出来たものにタイトルを書き換えます。
 * @param url - 取得対象のページのURL、すぐデシリアライズしてメッセージとして送るのでstring
 * @param link - 検索結果部分のHTML要素
 */
async function replace(url: string, link: Element): Promise<void> {
  // backgroundから未省略のタイトルを取得します
  const newTitle: unknown = await browser.runtime.sendMessage(url);
  // 非対応の場合などでタイトルが帰ってこないことがあり、その場合正常に終了します。
  if (newTitle == null) {
    return;
  }
  // タイトルがstringではない場合プログラミングミスなので例外を投げます。
  if (typeof newTitle !== "string") {
    throw new Error(
      `newTitle !== "string": typeof newTitle is ${typeof newTitle}, newTitle: ${JSON.stringify(
        newTitle
      )}`
    );
  }
  // 該当の検索結果からタイトル部分を表示するDOMを取得します。
  const titleElement = link.querySelector(".LC20lb");
  if (titleElement == null) {
    throw new Error("titleElement is null");
  }
  const u = new URL(url);
  if (
    (u.hostname === "twitter.com" || u.hostname === "mobile.twitter.com") &&
    /^\/\w+\/status\/\d+/.exec(u.pathname)
  ) {
    titleElement.innerHTML = newTitle;
    const script = document.createElement("script");
    script.src = "https://platform.twitter.com/widgets.js";
    script.async = true;
    document.getElementsByTagName("head")[0].appendChild(script);
    return;
  }
  // 省略記号によってタイトルの長さが水増しされていることがあるので、省略記号っぽいものは除去します。
  const oldTitle = titleElement.textContent?.replace("...", "") || "";
  if (newTitle.length < oldTitle.length) {
    // 古いタイトルの方が長い場合取得失敗の可能性が高いので、置き換えを行いません
    return;
  }
  // リンクが異常に長いことがあります。
  // 間違えてtitleタグが閉じられてないとか、
  // HTMLじゃないものをHTMLとして認識してしまっていると言ったケースです。
  // その場合置き換えを行いません。
  // 異常な長さを検出することが目的なので日本語と英語の長さの違いなどは考慮しません。
  if (newTitle.length > 500) {
    return;
  }
  titleElement.textContent = newTitle;
}

/**
 * 要素を置き換える関数を呼び出します。
 */
async function replaceLinkTitle(link: Element): Promise<void> {
  try {
    const href = link.getAttribute("href");
    if (href == null) {
      throw new Error("link don't have href");
    }
    return await replace(href, link);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("replaceLinkTitle is error.", err, link);
    return undefined;
  }
}

/**
 * 複数の要素を順不同で置き換えます。
 */
export async function replaceLinkTitles(links: Element[]): Promise<void[]> {
  return Promise.all(links.map((link) => replaceLinkTitle(link)));
}
