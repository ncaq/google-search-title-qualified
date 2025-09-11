import { runtime } from "webextension-polyfill";
import { listener } from "./listener";

function main() {
  runtime.onMessage.addListener(listener);
}

main();
