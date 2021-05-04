import fetch from "node-fetch";
import fs from "fs/promises";

async function main(): Promise<void> {
  const response = await fetch("https://www.google.com/supported_domains");
  const text = await response.text();
  const urls = text
    .split("\n")
    .filter((domain) => domain.includes("google"))
    .map((domain) => `https://www${domain}/search*`);
  return fs.writeFile(
    "manifest.json",
    JSON.stringify(
      {
        manifest_version: 2,
        name: "google-search-title-to-qualified",
        version: "0.1.0",
        description:
          "Google will omit the title of the web page. With this add-on, the original title is used as much as possible.",
        applications: {
          gecko: {
            id: "google-search-title-to-qualified@ncaq.net",
            strict_min_version: "78.0",
          },
        },

        content_scripts: [
          {
            matches: urls,
            js: ["dist/content/main.js"],
          },
        ],
        permissions: [],
        background: {
          scripts: ["dist/background/main.js"],
        },
      },
      null,
      2
    )
  );
}

if (require.main === module) {
  main().catch((e) => {
    throw e;
  });
}
