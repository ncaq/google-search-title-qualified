import { browser } from "webextension-polyfill-ts";
import Dexie from "dexie";
import sub from "date-fns/sub";

/** IndexedDBに格納するエントリ */
type TitleCache = {
  /**
   * URLをユニークなプライマリキーにすることで変換する手間を節約。
   * ユニークキーから簡単に単一の値を取得する方法はDexieでは見つかりませんでした。
   */
  url: string;
  /**
   * 本体であるタイトルを格納。
   * 取得出来なかった場合も出来なかったことを保存。
   */
  title: string | undefined;
  /**
   * 定期的にキャッシュをクリアしてサイズを節約し、
   * データをある程度最新のものに保つために、
   * 生成日を保存してインデックスしておきます。
   */
  createdAt: Date;
};

/** 全体データベース。 */
const db = new Dexie("GSTQDatabase");
db.version(1).stores({
  titleCache: "url, createdAt",
});

/** タイトルをキャッシュするためのテーブル。 */
const titleCacheTable = db.table("titleCache") as Dexie.Table<
  TitleCache,
  string
>;

/** URLを使ってタイトルをキャッシュから取得します。 */
async function getTitleCache(url: string): Promise<string | undefined> {
  return (await titleCacheTable.get(url))?.title;
}

/** キャッシュを保存します。 */
async function saveCache(
  url: string,
  title: string | undefined
): Promise<string> {
  return titleCacheTable.add({ url, title, createdAt: new Date() });
}

/** 古いキャッシュを削除します。 */
async function clearOldCache(): Promise<number> {
  const now = new Date();
  // 一週間超えたものをデータ削除することにします。
  const expires = sub(now, { weeks: 1 });
  return titleCacheTable.where("createdAt").below(expires).delete();
}

/** floating asyncでキャッシュ削除。 */
function clearOldCacheFloating(): void {
  clearOldCache().catch((err) => {
    // eslint-disable-next-line no-console
    console.error("clearOldCache is error.", err);
  });
}

// 起動時にキャッシュ削除。
clearOldCacheFloating();
// 一時間ごとにキャッシュ削除。
setInterval(clearOldCacheFloating, 3600000);

/**
 * 雑に文字コード推定を行います。
 * 本当はブラウザの自動判定機能が使いたいです、誰か方法を教えてください。
 */
function detectIsUtf8(response: Response, d: Document): boolean {
  const re = /UTF[-_]8/i;
  return (
    // HTTP header
    re.test(response.headers.get("content-type") || "") ||
    // HTML5
    re.test(d.querySelector("meta[charset]")?.getAttribute("charset") || "") ||
    // HTML4
    re.test(
      d
        .querySelector('meta[http-equiv="Content-Type"]')
        ?.getAttribute("content") || ""
    ) ||
    // charsetが存在しない場合、規格上UTF-8になりますが、規格を守ってるサイトも多いと思うので、安全側に倒してfalseをfallbackにします。
    false
  );
}

const domParser = new DOMParser();

/** URLからHTMLを取得解析してタイトルを取得します */
async function getHtmlTitle(url: string): Promise<string | undefined> {
  const abortController = new AbortController();
  // ネットワーク通信は10秒でタイムアウト。
  // やたらと時間がかかるサイトはどうせろくでもないことが多い。
  const timeout = setTimeout(() => abortController.abort(), 10000);
  try {
    const response = await fetch(url, {
      // 妙なリクエストを送らないように制限を加えます(こちらで書かないと変なこと起きないと思いますが)
      mode: "no-cors",
      // 認証情報が不用意に送られないようにします。サイトの誤動作防止の意味が強い。
      credentials: "omit",
      // 出来るだけブラウザのキャッシュを使っていきます。
      cache: "force-cache",
      // リダイレクトを追うことを明示的に指定。
      redirect: "follow",
      // タイムアウト中断コントローラ。
      signal: abortController.signal,
    });
    if (!response.ok) {
      throw new Error(`${url}: response is not ok ${JSON.stringify(response)}`);
    }
    // htmlを直接要求できないのでtextで取得してDOMParserに送り込みます。
    const text = await response.text();
    const dom = domParser.parseFromString(text, "text/html");
    // UTF-8でない場合取得を諦めます。
    if (detectIsUtf8(response, dom)) {
      return dom.querySelector("title")?.textContent || undefined;
    }
    return undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("listener error", err);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

/** バックグラウンドプロセス全体のメッセージパッシングを受け取ります */
async function listener(message: unknown): Promise<string | undefined> {
  // メッセージ内容がおかしい場合はエラー
  if (typeof message !== "string") {
    throw new Error(
      `message is not string, is ${typeof message}: ${JSON.stringify(message)}`
    );
  }
  // PDFは読み込まない
  if (message.endsWith(".pdf")) {
    return undefined;
  }
  const url = message;
  const cacheTitle = await getTitleCache(url);
  if (cacheTitle == null) {
    const title = await getHtmlTitle(url);
    // あえてPromiseの終了を待ちません。
    saveCache(url, title).catch((err) => {
      // eslint-disable-next-line no-console
      console.error("saveCache is error", err);
    });
    return title;
  }
  return cacheTitle;
}

browser.runtime.onMessage.addListener(listener);
