import { convert } from "encoding-japanese";
import { detectEncoding, type Encoding } from "./encoding";

/**
 * ページの取得結果を受け取り、そのページのタイトルを抽出します。
 * ページの取得結果の文字コードなどはまだ不明なので、blobを取得できるResponseを受け取ります。
 */
export async function extractTitle(
  response: Response,
): Promise<string | undefined> {
  // `encodingJapanese`は`string`に完全になってない`Array`を要求するため、`blob`でレスポンスを消費します。
  const blob = await response.blob();
  const text = await blob.text();
  const domParser = new DOMParser();
  const dom = domParser.parseFromString(text, "text/html");
  // エンコードを推定します。
  const encoding = detectEncoding(response.headers, text);
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
      encoding,
    );
  }
  // 対応していないエンコードの場合は無を返します。
  return undefined;
}

/**
 * encoding-japaneseが対応している文字コードのページのタイトルを取得します。
 */
function encodingJapaneseTitle(
  jp: Uint8Array,
  encoding: Encoding,
): string | undefined {
  const utf8 = convert(jp, {
    to: "UTF8",
    from: encoding,
  });
  const domParser = new DOMParser();
  const utf8Decoder = new TextDecoder();
  const dom = domParser.parseFromString(
    utf8Decoder.decode(new Uint8Array(utf8)),
    "text/html",
  );
  return dom.querySelector("title")?.textContent ?? undefined;
}
