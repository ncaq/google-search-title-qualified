import { onMessageListener } from "./on-message-listener";

function main() {
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) =>
    onMessageListener(message, sendResponse),
  );
}

main();
