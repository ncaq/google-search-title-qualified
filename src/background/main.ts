import { browser } from "webextension-polyfill-ts";

/** バックグラウンドプロセス全体のメッセージパッシングを受け取ります */
async function listener(message: unknown): Promise<string | undefined> {
  // メッセージ内容がおかしい場合はエラー
  if (typeof message !== "string") {
    throw new Error(`message is not URL: ${JSON.stringify(message)}`);
  }
  const response = await fetch(message, {
    // 妙なリクエストを送らないように制限を加えます(こちらで書かないと変なこと起きないと思いますが)
    mode: "no-cors",
    // 認証情報が不用意に送られないようにします。サイトの誤動作防止の意味が強い。
    credentials: "omit",
    // 出来るだけブラウザのキャッシュを使っていきます
    cache: "force-cache",
    // リダイレクトを追うことを明示的に指定
    redirect: "follow",
  });
  if (!response.ok) {
    throw new Error(`response is not ok ${JSON.stringify(response)}`);
  }
  // htmlを直接要求できないのでtextで取得してDOMParserに送り込みます
  const text = await response.text();
  const dom = new DOMParser().parseFromString(text, "text/html");
  return dom.querySelector("title")?.textContent || undefined;
}

browser.runtime.onMessage.addListener(listener);
