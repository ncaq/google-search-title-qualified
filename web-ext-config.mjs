// @ts-check

import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dir = fs.readdirSync(__dirname);

const ignoreFiles = dir.filter(
  (file) =>
    !(
      ["dist", "LICENSE", "manifest.json"].includes(file) ||
      file.startsWith("icon")
    )
);

export default {
  build: {
    overwriteDest: true,
    filename: "google-search-title-qualified.zip",
  },
  ignoreFiles,
  run: {
    devtools: true,
    firefoxProfile: "google-search-title-qualified",
  },
};
