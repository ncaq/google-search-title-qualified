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
  build: {
    overwriteDest: true,
  },
  ignoreFiles,
};
