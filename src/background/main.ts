import sub from "date-fns/sub";
import Dexie from "dexie";
import encodingJapanese from "encoding-japanese";
import browser from "webextension-polyfill";

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
  return titleCacheTable.put({ url, title, createdAt: new Date() });
}

/** 古いキャッシュを削除します。 */
async function clearOldCache(): Promise<number> {
  const now = new Date();
  // 一週間超えたものをデータ削除することにします。
  const expires = sub(now, { weeks: 1 });
  // eslint-disable-next-line no-console
  console.log("cache count: before", await titleCacheTable.count());
  const result = titleCacheTable.where("createdAt").below(expires).delete();
  // eslint-disable-next-line no-console
  console.log("cache count: after", await titleCacheTable.count());
  return result;
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

/** この拡張機能が対応するエンコーディング一覧です。 */
const encodings = ["UTF8", "SJIS", "EUCJP"] as const;
/** 対応エンコードを型付けします。 */
type Encoding = typeof encodings[number];

/**
 * エンコードを判定するための正規表現マップです。
 * これにより、雑に文字コード推定を行います。
 * 本当はブラウザの自動判定機能が使いたいです、誰か方法を教えてください。
 */
const encodingsRegex: Map<Encoding, RegExp> = new Map([
  ["UTF8", /UTF[-_]8/i],
  ["SJIS", /Shift[-_]JIS/i],
  ["EUCJP", /EUC[-_]JP/i],
]);

/** エンコーディング判定用のの正規表現に一致するか判断して、最初に一致したものを返します。 */
function testEncoding(source: string): Encoding | undefined {
  return encodings.find((encoding) => {
    const re = encodingsRegex.get(encoding);
    return re != null && re.test(source);
  });
}

/**
 * HTTPとHTMLの情報から文字コードの推定を行います。
 * 複数のエンコーディングが指定されていて、
 * それぞれが矛盾している場合バグだと判断してundefinedを返します。
 */
function detectEncoding(response: Response, d: Document): Encoding | undefined {
  // 判定用の文字列を取得します。
  const httpContentType = response.headers.get("content-type") || "";
  const html5Charset =
    d.querySelector("meta[charset]")?.getAttribute("charset") || "";
  const html4ContentType =
    d
      .querySelector('meta[http-equiv="Content-Type"]')
      ?.getAttribute("content") || "";
  // それぞれのソースから計算したエンコーディングを取得します。
  // 判定不能だったものは除外します。
  const testedEncodings = [httpContentType, html5Charset, html4ContentType]
    .map((s) => testEncoding(s))
    .filter((e): e is NonNullable<typeof e> => e != null);
  // Setを使って重複を除外します。
  const encodingsSet = new Set(testedEncodings);
  // 要素数が1の時のみ正しい結果だと判別します。
  // 要素数が0の時 == charsetなどが存在しない場合、
  // HTML最新規格ではUTF-8になりますが、
  // そもそも最新規格を参照していないサイトも多いと思うので不明としておきます。
  if (encodingsSet.size === 1) {
    // encodingsSetのサイズが1以上であれば、元となった配列にも要素が必ずあるはずです。
    return testedEncodings[0];
  }
  return undefined;
}

/** バックグラウンドscript全体でDOMParserを使い回します。新規に生成していくのとどっちが早いのかは正直知りません。 */
const domParser = new DOMParser();

/** Uint8Arrayとして取り扱った非Unicode文字列をstringに戻すためのインスタンスを持ち回します。 */
const utf8Decoder = new TextDecoder();

/** encoding-japaneseが対応している文字コードのページのタイトルを取得します。 */
function encodingJapaneseTitle(
  jp: Uint8Array,
  encoding: Encoding
): string | undefined {
  const utf8 = encodingJapanese.convert(jp, {
    to: "UTF8",
    from: encoding,
  });
  const dom = domParser.parseFromString(
    utf8Decoder.decode(new Uint8Array(utf8)),
    "text/html"
  );
  return dom.querySelector("title")?.textContent || undefined;
}

/** ネットワーク帯域を利用する関数を明示化してまとめます */
function fetchPage(url: string): Promise<Response> {
  const abortController = new AbortController();
  // ネットワーク通信は30秒でタイムアウト。
  // やたらと時間がかかるサイトはどうせろくでもないことが多い。
  const timeout = setTimeout(() => abortController.abort(), 30 * 1000);
  try {
    return fetch(url, {
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
  } finally {
    clearTimeout(timeout);
  }
}

/** URLからHTMLを取得解析してタイトルを取得します */
async function getHtmlTitle(url: string): Promise<string | undefined> {
  try {
    const response = await fetchPage(url);
    if (!response.ok) {
      throw new Error(
        `${url}: response is not ok ${JSON.stringify(response.statusText)}`
      );
    }
    // encodingJapaneseはstringに完全になってないArrayを要求するため、blobでレスポンスを消費します。
    const blob = await response.blob();
    const text = await blob.text();
    const dom = domParser.parseFromString(text, "text/html");
    // エンコードを推定します。
    const encoding = detectEncoding(response, dom);
    // エンコードを取得できなかったら無を返します。
    if (encoding == null) {
      return undefined;
    }
    // UTF-8の場合変換は必要ありません。
    if (encoding === "UTF8") {
      return dom.querySelector("title")?.textContent || undefined;
    }
    // 他のエンコードでencoding-japaneseが対応しているものは変換を試みます。
    if (["SJIS", "EUCJP"].includes(encoding)) {
      return encodingJapaneseTitle(
        new Uint8Array(await blob.arrayBuffer()),
        encoding
      );
    }
    return undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("listener error", err, url);
    return undefined;
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
      console.error("saveCache is error", err, url, title);
    });
    return title;
  }
  return cacheTitle;
}

browser.runtime.onMessage.addListener(listener);
