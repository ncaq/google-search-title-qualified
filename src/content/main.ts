import { replaceLinkTitles } from "./title";
import { replaceLinkUrls } from "./url";

/**
 * 置き換える対象の検索結果要素一覧を取得します。
 * Googleの仕様変更に一番左右されそうな部分。
 */
function selectLinkElements(el: Element): Element[] {
  return Array.from(
    el.querySelectorAll('.tF2Cxc .yuRUbf a[href^="http"]:not(.fl)')
  );
}

/** エントリーポイント。 */
async function main(el: Element): Promise<void[]> {
  const links = selectLinkElements(el);
  const titleP = replaceLinkTitles(links);
  replaceLinkUrls(links);
  return titleP;
}

// エントリーポイントを実行します。
main(document.documentElement).catch((e) => {
  throw e;
});

// weAutoPagerizeに対応します。
document.addEventListener("AutoPagerize_DOMNodeInserted", (event) => {
  if (!(event.target instanceof Element)) {
    throw new Error(
      `AutoPagerize_DOMNodeInserted: event.target is not Element. ${JSON.stringify(
        event
      )}`
    );
  }
  main(event.target).catch((e) => {
    throw e;
  });
});
