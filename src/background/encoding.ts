import { queryCharset, queryContentType } from "./dom-parser-client";

/** この拡張機能が対応するエンコーディング一覧です。 */
const encodings = ["UTF8", "SJIS", "EUCJP"] as const;
/** 対応エンコードを型付けします。 */
export type Encoding = (typeof encodings)[number];

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

/**
 * HTMLドキュメントから類推されるエンコードの手がかり。
 */
interface EncodingEvidence {
  html5Charset?: string;
  html4ContentType?: string;
}

/** エンコーディング判定用の正規表現に一致するか判断して、最初に一致したものを返します。 */
function testEncoding(source: string): Encoding | undefined {
  return encodings.find((encoding) => {
    const re = encodingsRegex.get(encoding);
    return re?.test(source);
  });
}

/**
 * HTMLドキュメントから類推されるエンコードの手がかりを取得します。
 */
async function queryEncodingEvidence(text: string): Promise<EncodingEvidence> {
  const html5Charset = await queryCharset(text);
  const html4ContentType = await queryContentType(text);
  return {
    html5Charset,
    html4ContentType,
  };
}

/**
 * HTTPとHTMLの情報から文字コードの推定を行います。
 * 複数のエンコーディングが指定されていて、
 * それぞれが矛盾している場合バグだと判断してundefinedを返します。
 */
export async function detectEncoding(
  headers: Headers,
  text: string,
): Promise<Encoding | undefined> {
  // 判定用の文字列を取得します。
  const httpContentType = headers.get("content-type") ?? "";
  const { html5Charset, html4ContentType } = await queryEncodingEvidence(text);
  // それぞれのソースから計算したエンコーディングを取得します。
  // 判定不能だったものは除外します。
  const testedEncodings = [httpContentType, html5Charset, html4ContentType]
    .filter((e) => e != null)
    .map((s) => testEncoding(s));
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
