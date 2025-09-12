import { Sema } from "async-sema";
import { BackgroundResponse } from "../message";

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出ることと、
 * 閉じたページのタイトルを取得し続けるのは無駄なので、
 * ページ単位で制限を設けます。
 */
const fetchSema = new Sema(3);

/**
 * ページ内容のタイトルをセマフォの制限付きでbackgroundから取得します。
 * `try`に伴った`let`を書きたくなかったので分けました。
 */
async function fetchBackground(url: string): Promise<string | undefined> {
  await fetchSema.acquire();
  try {
    const newTitle: unknown = await chrome.runtime.sendMessage({
      target: "background",
      type: "getTitle",
      url,
    });
    if (!BackgroundResponse.is(newTitle)) {
      // プログラミングミスなので例外を投げます。
      throw new Error(
        `newTitle !== "string": typeof newTitle is ${typeof newTitle}, newTitle: ${JSON.stringify(
          newTitle,
        )}`,
      );
    }
    return newTitle ?? undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("fetchBackground is error.", err);
    return undefined;
  } finally {
    fetchSema.release();
  }
}

/**
 * ページ内容のタイトルをbackgroundから取得して、取得出来たものにタイトルを書き換えます。
 * @param url - 取得対象のページのURL、すぐデシリアライズしてメッセージとして送るのでstring
 * @param link - 検索結果部分のHTML要素
 */
async function replace(url: string, link: Element): Promise<void> {
  // backgroundから未省略のタイトルを取得します。
  const newTitle = await fetchBackground(url);
  // 非対応の場合などでタイトルが帰ってこないことがあり、その場合正常に終了します。
  if (newTitle == null) {
    return;
  }
  // 該当の検索結果からタイトル部分を表示するDOMを取得します。
  const titleElement = link.querySelector(".LC20lb");
  if (titleElement == null) {
    throw new Error("titleElement is null");
  }
  if (!(titleElement instanceof HTMLElement)) {
    throw new Error("titleElement is not HTMLElement");
  }
  // 省略記号によってタイトルの長さが水増しされていることがあるので、省略記号っぽいものは除去します。
  const oldTitle = titleElement.textContent
    ? titleElement.textContent.replace("...", "")
    : "";
  if (newTitle.length < oldTitle.length) {
    // 古いタイトルの方が長い場合取得失敗の可能性が高いので、置き換えを行いません。
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
  // 改行コードを反映させたいのでtextContentではなくinnerTextを使って代入する。
  titleElement.innerText = newTitle;
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
    await replace(href, link);
    return;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("replaceLinkTitle is error.", err, link);
    return undefined;
  }
}

/**
 * 複数の要素を順不同で置き換えます。
 */
export async function replaceLinkTitles(links: Element[]): Promise<void> {
  await Promise.all(links.map((link) => replaceLinkTitle(link)));
}
