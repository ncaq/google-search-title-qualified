import { browser } from "webextension-polyfill-ts";

/**
 * 置き換える対象の検索結果要素一覧を取得します。
 * Googleの仕様変更に一番左右されそうな部分。
 */
function selectLinkElements(): Element[] {
  return (
    Array.from(document.querySelectorAll(".yuRUbf a"))
      // CSSクラスだけで検索結果URLだと特定できないので特定のものを除外します。
      .filter((a) => {
        const href = a.getAttribute("href");
        return (
          // TypeScriptの型システムを説得
          typeof href === "string" &&
          // Googleの内部リンクを除外
          href !== "#" &&
          // ウェブキャッシュへのリンクを除外
          !href.startsWith("https://webcache.googleusercontent.com/")
        );
      })
  );
}

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
      `newTitle !== "string": newTitle: ${JSON.stringify(newTitle)}`
    );
  }
  // 該当の検索結果からタイトル部分を表示するDOMを取得します。
  const titleElement = link.querySelector(".LC20lb");
  if (titleElement == null) {
    throw new Error("titleElement is null");
  }
  const oldTitle = titleElement.textContent || "";
  if (newTitle.length < oldTitle.length) {
    // 古いタイトルの方が長い場合取得失敗の可能性が高いので、置き換えを行いません
    return;
  }
  titleElement.textContent = newTitle;
}

/**
 * 要素を置き換える関数を呼び出します。
 */
async function replaceLinkTitle(link: Element): Promise<void> {
  const href = link.getAttribute("href");
  if (href == null) {
    throw new Error(`link don't have href: link: ${JSON.stringify(link)}`);
  }
  return replace(href, link);
}

/**
 * 複数の要素を順不同で置き換えます。
 */
async function replaceLinkTitles(links: Element[]): Promise<void[]> {
  return Promise.all(
    links.map(async (link) =>
      replaceLinkTitle(link).catch((err) => {
        // eslint-disable-next-line no-console
        console.error(err);
      })
    )
  );
}

/** エントリーポイント。 */
async function main(): Promise<void[]> {
  return replaceLinkTitles(selectLinkElements());
}

// 検索されるたびに実行します。
main().catch((e) => {
  throw e;
});
