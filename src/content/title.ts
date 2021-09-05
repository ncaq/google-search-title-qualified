import { browser } from "webextension-polyfill-ts";

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
  // 省略記号によってタイトルの長さが水増しされていることがあるので、省略記号っぽいものは除去します。
  const oldTitle = titleElement.textContent?.replace("...", "") || "";
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
export async function replaceLinkTitles(linksOrigin: Element[]): Promise<void> {
  // spliceするため、元の配列に破壊的変更が及びにくいようにするためにシャローコピー。
  const links = [...linksOrigin];
  // スクロールせずに表示されるであろうリンクは優先的に処理します。
  const linksForFirstView = links.splice(0, 10);
  // ファーストビューは非同期でfetchを同時に実行して速く取得を試みます。
  await Promise.all(
    linksForFirstView.map(async (link) => replaceLinkTitle(link))
  );
  // 残りはネットワークリソースをあまり消費しないようにあえて1件ずつ処理します。
  // eslint-disable-next-line no-restricted-syntax
  for (const link of links) {
    // eslint-disable-next-line no-await-in-loop
    await replaceLinkTitle(link);
  }
}