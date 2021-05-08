import fetch from "node-fetch";
import fs from "fs/promises";

/** Googleの公式情報から検索ドメインを取ってきます。 */
async function selectGoogleSearchUrls(): Promise<string[]> {
  const response = await fetch("https://www.google.com/supported_domains");
  const text = await response.text();
  return text
    .split("\n")
    .filter((domain) => domain.includes("google"))
    .map((domain) => `https://www${domain}/search*`);
}

/** manifest.jsonを生成して書き込みます。 */
async function writeManifestJson(): Promise<void> {
  return fs.writeFile(
    "manifest.json",
    JSON.stringify(
      {
        manifest_version: 2,
        name: "google-search-title-qualified",
        version: "0.2.2",
        description:
          "Google will omit the title of the web page. With this add-on, the original title is used as much as possible.",
        applications: {
          gecko: {
            id: "google-search-title-qualified@ncaq.net",
            strict_min_version: "78.0",
          },
        },

        icons: {
          "48": "icon-48.png",
          "96": "icon-96.png",
          "128": "icon-128.png",
        },

        permissions: ["<all_urls>"],
        background: {
          scripts: ["dist/background/main.js"],
        },
        content_scripts: [
          {
            js: ["dist/content/main.js"],
            matches: await selectGoogleSearchUrls(),
          },
        ],
      },
      null,
      2
    )
  );
}

// ts-nodeとかで実行させます。
if (require.main === module) {
  writeManifestJson().catch((e) => {
    throw e;
  });
}
