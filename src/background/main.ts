import { runtime } from "webextension-polyfill";
import { bootCacheManager } from "./cache";
import { listener } from "./listener";

/**
 * バックグラウンド側のエントリーポイント。
 */
function main() {
  bootCacheManager();
  runtime.onMessage.addListener(listener);
}

main();
