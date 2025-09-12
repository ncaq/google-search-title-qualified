import { bootCacheManager } from "./cache";
import { initializeFetchAlarmListener } from "./fetch-page";
import { onMessageListener } from "./on-message-listener";

/**
 * バックグラウンド側のエントリーポイント。
 */
function main() {
  bootCacheManager();
  initializeFetchAlarmListener();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
    onMessageListener(message, sendResponse),
  );
}

main();
