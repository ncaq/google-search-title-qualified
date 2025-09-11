import { runtime } from "webextension-polyfill";
import { bootCacheManager } from "./cache";
import { initializeFetchAlarmListener } from "./fetch-page";
import { listener } from "./listener";

/**
 * バックグラウンド側のエントリーポイント。
 */
function main() {
  bootCacheManager();
  initializeFetchAlarmListener();
  runtime.onMessage.addListener(listener);
}

main();
