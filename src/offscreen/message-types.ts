import * as t from "io-ts";

// Offscreenへ送信するメッセージの型定義。

export const QueryTitleMessage = t.type({
  type: t.literal("queryTitle"),
  html: t.string,
});
export type QueryTitleMessage = t.TypeOf<typeof QueryTitleMessage>;

export const QueryCharsetMessage = t.type({
  type: t.literal("queryCharset"),
  html: t.string,
});
export type QueryCharsetMessage = t.TypeOf<typeof QueryCharsetMessage>;

export const QueryContentTypeMessage = t.type({
  type: t.literal("queryContentType"),
  html: t.string,
});
export type QueryContentTypeMessage = t.TypeOf<typeof QueryContentTypeMessage>;

export const PrettyTwitterMessage = t.type({
  type: t.literal("prettyTwitter"),
  html: t.string,
});
export type PrettyTwitterMessage = t.TypeOf<typeof PrettyTwitterMessage>;

export const OffscreenMessage = t.union([
  QueryTitleMessage,
  QueryCharsetMessage,
  QueryContentTypeMessage,
  PrettyTwitterMessage,
]);
export type OffscreenMessage = t.TypeOf<typeof OffscreenMessage>;

/**
 * Offscreenからの応答の型定義。
 */
export const OffscreenResponse = t.union([t.string, t.undefined]);
export type OffscreenResponse = t.TypeOf<typeof OffscreenResponse>;
