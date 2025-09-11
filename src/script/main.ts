import { runtime } from "webextension-polyfill";
import { bootCacheManager } from "../background/cache";
import { listener } from "../background/listener";

/**
 * FirefoxなどのWebExtension APIのscriptsのエントリポイントです。
 * WebExtension APIではDomParserなどが依然として使えます。
 */
function main() {
  bootCacheManager();
  runtime.onMessage.addListener(listener);
}

main();
