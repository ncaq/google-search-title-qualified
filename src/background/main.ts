import { browser } from "webextension-polyfill-ts";

async function listener(message: unknown): Promise<string | undefined | null> {
  if (typeof message !== "string") {
    throw new Error(JSON.stringify(message));
  }
  const response = await fetch(message);
  if (!response.ok) {
    throw new Error(JSON.stringify(response));
  }
  const text = await response.text();
  const dom = new DOMParser().parseFromString(text, "text/html");
  return dom.querySelector("title")?.textContent;
}

browser.runtime.onMessage.addListener(listener);
