import { bootCacheManager } from "./cache";
import { onMessageListener } from "./on-message-listener";

/**
 * バックグラウンド側のエントリーポイント。
 */
function main() {
  bootCacheManager();
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
    onMessageListener(message, sendResponse),
  );
}

main();
