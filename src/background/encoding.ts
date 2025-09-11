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
export function detectEncoding(
  response: Response,
  d: Document,
): Encoding | undefined {
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
