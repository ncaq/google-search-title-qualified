import { replaceLinkTitles } from "./title";
import { replaceLinkUrls } from "./url";

/**
 * 置き換える対象の検索結果要素一覧を取得します。
 * Googleの仕様変更に一番左右されそうな部分。
 */
function selectLinkElements(): Element[] {
  return Array.from(
    document.querySelectorAll('.tF2Cxc .yuRUbf a[href^="http"]:not(.fl)')
  );
}

/** エントリーポイント。 */
async function main(): Promise<void> {
  const links = selectLinkElements();
  const titleP = replaceLinkTitles(links);
  replaceLinkUrls(links);
  return titleP;
}

// エントリーポイントを実行します。
main().catch((e) => {
  throw e;
});
