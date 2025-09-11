import { Dexie } from "dexie";

/** 全体データベース。 */
export const db = new Dexie("GSTQDatabase");
db.version(1).stores({
  titleCache: "url, createdAt",
});
