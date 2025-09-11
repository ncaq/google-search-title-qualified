import * as t from "io-ts";

export const getTitleMessage = t.type({
  target: t.literal("background"),
  type: t.literal("getTitle"),
  url: t.string,
});
export type GetTitleMessage = t.TypeOf<typeof getTitleMessage>;

export const BackgroundMessage = getTitleMessage;
export type BackgroundMessage = t.TypeOf<typeof BackgroundMessage>;
export const BackgroundResponse = t.union([t.string, t.undefined]);
export type BackgroundResponse = t.TypeOf<typeof BackgroundResponse>;

export const QueryTitleMessage = t.type({
  target: t.literal("offscreen"),
  type: t.literal("queryTitle"),
  html: t.string,
});
export type QueryTitleMessage = t.TypeOf<typeof QueryTitleMessage>;

export const QueryCharsetMessage = t.type({
  target: t.literal("offscreen"),
  type: t.literal("queryCharset"),
  html: t.string,
});
export type QueryCharsetMessage = t.TypeOf<typeof QueryCharsetMessage>;

export const QueryContentTypeMessage = t.type({
  target: t.literal("offscreen"),
  type: t.literal("queryContentType"),
  html: t.string,
});
export type QueryContentTypeMessage = t.TypeOf<typeof QueryContentTypeMessage>;

export const PrettyTwitterMessage = t.type({
  target: t.literal("offscreen"),
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
