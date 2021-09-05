import { replacePageTitle } from "./title";

/** エントリーポイント。 */
async function main(): Promise<void> {
  return replacePageTitle();
}

// 検索されるたびに実行します。
main().catch((e) => {
  throw e;
});
