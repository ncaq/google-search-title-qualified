const fs = require("fs");

const dir = fs.readdirSync(__dirname);

const ignoreFiles = dir.filter(
  (file) =>
    !(
      ["dist", "LICENSE", "manifest.json"].includes(file) ||
      file.startsWith("icon")
    )
);

module.exports = {
  verbose: true,
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
