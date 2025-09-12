import { onMessageListener } from "./on-message-listener";

function main() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    sendResponse(onMessageListener(message));
    // 同期的に処理したのでfalseを返す。
    return false;
  });
}

main();
