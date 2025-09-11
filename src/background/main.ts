import { runtime } from "webextension-polyfill";
import "./cache";
import { listener } from "./listener";

runtime.onMessage.addListener(listener);
