// @ts-check

import * as fs from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dir = fs.readdirSync(__dirname);

const ignoreFiles = dir.filter(
  (file) =>
    !(
      ["asset", "dist", "LICENSE", "manifest.json"].includes(file) ||
      file.startsWith("icon")
    ),
);

export default {
  build: {
    overwriteDest: true,
  },
  ignoreFiles,
  run: {
    devtools: true,
    firefoxProfile: "google-search-title-qualified",
  },
};
