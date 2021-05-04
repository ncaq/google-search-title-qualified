import { browser } from "webextension-polyfill-ts";

/** backgroundから取得して差し替えます */
async function replace(url: string, link: Element): Promise<void> {
  const newTitle: unknown = await browser.runtime.sendMessage(url);
  if (typeof newTitle !== "string") {
    throw new Error(JSON.stringify(newTitle));
  }
  const titleElement = link.querySelector(".LC20lb");
  if (titleElement == null) {
    throw new Error("タイトル要素が見つかりませんでした");
  }
  titleElement.textContent = newTitle;
}

async function main(): Promise<void[]> {
  const links = Array.from(document.querySelectorAll(".yuRUbf a"));
  return Promise.all(
    links.map(async (link) => {
      const url = link.getAttribute("href");
      if (url == null) {
        throw new Error(JSON.stringify(link));
      }
      return replace(url, link);
    })
  );
}

main().catch((e) => {
  throw e;
});
