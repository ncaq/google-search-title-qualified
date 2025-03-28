import { replaceLinkTitles } from "./title";

/**
 * CSSセレクタで気をつけていてもどうしてもGoogleのwebキャッシュなど不要なURLが集まってしまうのでフィルタリングをかけます。
 */
function isValidURL(el: Element): boolean {
  const href = el.getAttribute("href");
  if (href == null) {
    return false;
  }
  // 文字列をURLにしたり戻したりして無駄な気がしますが、
  // 要素の書き換えのためにElement自体を渡さないといけない場面が多すぎるので仕方がない。
  const url = new URL(href);
  if (url.hostname === "webcache.googleusercontent.com") {
    return false;
  }
  return true;
}

/**
 * 置き換える対象の検索結果要素一覧を取得します。
 * Googleの仕様変更に一番左右されそうな部分。
 */
function selectLinkElements(el: Element): Element[] {
  return Array.from(
    el.querySelectorAll('.yuRUbf a[href^="http"]:not(.fl)'),
  ).filter(isValidURL);
}

/** エントリーポイント。 */
async function main(el: Element): Promise<void> {
  return replaceLinkTitles(selectLinkElements(el));
}

// エントリーポイントを実行します。
main(document.documentElement).catch((e: unknown) => {
  throw e;
});

// weAutoPagerizeに対応します。
document.addEventListener("AutoPagerize_DOMNodeInserted", (event) => {
  if (!(event.target instanceof Element)) {
    throw new Error(
      `AutoPagerize_DOMNodeInserted: event.target is not Element. ${JSON.stringify(
        event,
      )}`,
    );
  }
  main(event.target).catch((e: unknown) => {
    throw e;
  });
});
