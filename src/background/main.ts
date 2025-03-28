import { Sema } from "async-sema";
import sub from "date-fns/sub";
import { Dexie } from "dexie";
import encodingJapanese from "encoding-japanese";
import * as t from "io-ts";
import browser from "webextension-polyfill";

/** IndexedDBに格納するエントリ */
interface TitleCache {
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
}

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
  clearOldCache().catch((err: unknown) => {
    // eslint-disable-next-line no-console
    console.error("clearOldCache is error.", err);
  });
}

// 起動時にキャッシュ削除。
clearOldCacheFloating();
// 1日ごとにキャッシュ削除。
setInterval(clearOldCacheFloating, 24 * 60 * 60 * 1000);

/** この拡張機能が対応するエンコーディング一覧です。 */
const encodings = ["UTF8", "SJIS", "EUCJP"] as const;
/** 対応エンコードを型付けします。 */
type Encoding = (typeof encodings)[number];

/**
 * エンコードを判定するための正規表現マップです。
 * これにより、雑に文字コード推定を行います。
 * 本当はブラウザの自動判定機能が使いたいです、誰か方法を教えてください。
 */
const encodingsRegex = new Map<Encoding, RegExp>([
  ["UTF8", /UTF[-_]8/i],
  ["SJIS", /Shift[-_]JIS/i],
  ["EUCJP", /EUC[-_]JP/i],
]);

/** エンコーディング判定用の正規表現に一致するか判断して、最初に一致したものを返します。 */
function testEncoding(source: string): Encoding | undefined {
  return encodings.find((encoding) => {
    const re = encodingsRegex.get(encoding);
    return re?.test(source);
  });
}

/**
 * HTTPとHTMLの情報から文字コードの推定を行います。
 * 複数のエンコーディングが指定されていて、
 * それぞれが矛盾している場合バグだと判断してundefinedを返します。
 */
function detectEncoding(response: Response, d: Document): Encoding | undefined {
  // 判定用の文字列を取得します。
  const httpContentType = response.headers.get("content-type") ?? "";
  const html5Charset =
    d.querySelector("meta[charset]")?.getAttribute("charset") ?? "";
  const html4ContentType =
    d
      .querySelector('meta[http-equiv="Content-Type"]')
      ?.getAttribute("content") ?? "";
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
  return dom.querySelector("title")?.textContent ?? undefined;
}

/**
 * 求められるままネットワークコネクションを開きまくるとブラウザの動作に支障が出るため、
 * セマフォである程度制限します。
 * ページを複数開いても問題ないように、
 * ページ単体の制限よりある程度余裕を持たせます。
 */
const fetchSema = new Sema(3 * 3);

/** ネットワーク帯域を利用する関数を明示化してまとめます。 */
async function fetchPage(url: string): Promise<Response> {
  await fetchSema.acquire();
  try {
    const abortController = new AbortController();
    // ネットワーク通信は15秒でタイムアウト。
    // やたらと時間がかかるサイトはどうせろくでもないことが多い。
    const timeout = setTimeout(() => {
      abortController.abort();
    }, 15 * 1000);
    try {
      return await fetch(url, {
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
  } finally {
    fetchSema.release();
  }
}

const twitterOembed = t.type({
  html: t.string,
});

/** Twitterはブラウザ向けにはSSRしないため、専用のAPIを使ってタイトルを全取得します。 */
async function getTwitterTitle(urlString: string): Promise<string | undefined> {
  try {
    const url = new URL(urlString);
    // TwitterのURLやツイートのURLじゃない場合は`undefined`を返します。
    if (
      !(
        (url.hostname === "twitter.com" ||
          url.hostname === "mobile.twitter.com") &&
        /^\/\w+\/status\/\d+/.exec(url.pathname)
      )
    ) {
      return undefined;
    }
    const publish = new URL("https://publish.twitter.com/oembed");
    publish.searchParams.set("url", url.href);
    // textContentで表示するのでscriptは関係ないですが、余計なものなので取り除いておきます。
    publish.searchParams.set("omit_script", "t");
    // ブラウザの言語設定が反映されないと日時が英語になって辛いので設定します。
    publish.searchParams.set("lang", navigator.language || "en");
    const response = await fetchPage(publish.href);
    if (!response.ok) {
      throw new Error(
        `${publish.href}: response is not ok ${JSON.stringify(
          response.statusText
        )}`
      );
    }
    const j: unknown = await response.json();
    if (!twitterOembed.is(j)) {
      return undefined;
    }
    const dom = domParser.parseFromString(j.html, "text/html");
    // Twitterは改行などが反映されないと少し見苦しいので、
    // ちょっとした整形をする。
    // 本当はスニペットとして埋め込みたいのだが、
    // 外部コードを注入する拡張機能はポリシー的に弾かれるだろう。
    // 非破壊的に構築する方法が今ひとつ分からなかった、すぐに関数を離れるから問題ないだろう。
    Array.from(dom.querySelectorAll("br, p")).forEach((el) =>
      el.appendChild(document.createTextNode("\n"))
    );
    return dom.documentElement.textContent ?? undefined;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getTwitterTitle error", err, urlString);
    return undefined;
  }
}

/** URLからHTMLを取得解析してタイトルを取得します */
async function getHtmlTitle(url: string): Promise<string | undefined> {
  try {
    // HTMLを取得、パースして結果を返す。
    // 結果をまとめて加工したいため、内部関数に分ける。
    const getText = async () => {
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
        return dom.querySelector("title")?.textContent ?? undefined;
      }
      // 他のエンコードでencoding-japaneseが対応しているものは変換を試みます。
      if (["SJIS", "EUCJP"].includes(encoding)) {
        return encodingJapaneseTitle(
          new Uint8Array(await blob.arrayBuffer()),
          encoding
        );
      }
      return undefined;
    };
    // titleソースコード周囲にある空白は除去。
    // 改行は論理的な分割かもしれないし、
    // HTMLソースの幅の問題かもしれないので空白に変換する。
    return (await getText())?.trim().replaceAll(/\n+/g, " ");
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("getHtmlTitle error", err, url);
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
  const url = message;
  // PDFは読み込まない
  if (url.endsWith(".pdf")) {
    return undefined;
  }
  const cacheTitle = await getTitleCache(url);
  if (cacheTitle == null) {
    // TwitterのAPIかHTMLのtitleタグを取得。
    const title = (await getTwitterTitle(url)) ?? (await getHtmlTitle(url));
    // あえてPromiseの終了を待ちません。
    saveCache(url, title).catch((err: unknown) => {
      // eslint-disable-next-line no-console
      console.error("saveCache is error", err, url, title);
    });
    return title;
  }
  return cacheTitle;
}

browser.runtime.onMessage.addListener(listener);
