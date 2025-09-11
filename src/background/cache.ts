import sub from "date-fns/sub";
import type { Dexie } from "dexie";
import { db } from "./database";

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

/** タイトルをキャッシュするためのテーブル。 */
const titleCacheTable = db.table("titleCache") as Dexie.Table<
  TitleCache,
  string
>;

/** URLを使ってタイトルをキャッシュから取得します。 */
export async function getTitleCache(url: string): Promise<string | undefined> {
  return (await titleCacheTable.get(url))?.title;
}

/** キャッシュを保存します。 */
export async function saveCache(
  url: string,
  title: string | undefined,
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

/**
 * キャッシュ削除の間隔。
 * 1日ごとにキャッシュ削除を試みます。
 */
const cacheCleanupInterval = 24 * 60 * 60 * 1000;

/**
 * キャッシュ管理システムを起動する。
 * プログラムの起動時に有効になることを想定しています。
 **/
export function bootCacheManager(): void {
  // 起動時にキャッシュ削除。
  clearOldCacheFloating();
  // 1日ごとにキャッシュ削除。
  setInterval(clearOldCacheFloating, cacheCleanupInterval);
}
