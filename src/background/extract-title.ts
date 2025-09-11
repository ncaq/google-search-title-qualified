import { convert } from "encoding-japanese";
import type { Encoding } from "./encoding";

/** バックグラウンドscript全体でDOMParserを使い回します。新規に生成していくのとどっちが早いのかは正直知りません。 */
export const domParser = new DOMParser();

/** Uint8Arrayとして取り扱った非Unicode文字列をstringに戻すためのインスタンスを持ち回します。 */
const utf8Decoder = new TextDecoder();

/** encoding-japaneseが対応している文字コードのページのタイトルを取得します。 */
export function encodingJapaneseTitle(
  jp: Uint8Array,
  encoding: Encoding,
): string | undefined {
  const utf8 = convert(jp, {
    to: "UTF8",
    from: encoding,
  });
  const dom = domParser.parseFromString(
    utf8Decoder.decode(new Uint8Array(utf8)),
    "text/html",
  );
  return dom.querySelector("title")?.textContent ?? undefined;
}
