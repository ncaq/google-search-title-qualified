import { runtime } from "webextension-polyfill";
import { bootCacheManager } from "./cache";
import { listener } from "./listener";

bootCacheManager();
runtime.onMessage.addListener(listener);
