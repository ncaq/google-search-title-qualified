import fs from "node:fs/promises";
import path from "node:path";

const targets = ["firefox", "chrome"] as const;
type Target = (typeof targets)[number];
function isTarget(value: string): value is Target {
  return targets.includes(value as Target);
}

/** Googleの公式情報から検索ドメインを取ってきます。 */
async function selectGoogleSearchUrls(): Promise<string[]> {
  const response = await fetch("https://www.google.com/supported_domains");
  const text = await response.text();
  return text
    .split("\n")
    .filter((domain) => domain.includes("google"))
    .map((domain) => `https://www${domain}/search*`);
}

/**
 * Firefox用に拡張したManifestV3型。
 */
interface FirefoxManifestV3
  extends Omit<chrome.runtime.ManifestV3, "background"> {
  browser_specific_settings: {
    gecko: {
      id: string;
      strict_min_version?: string;
    };
  };
  background?: {
    scripts: string[];
  };
}

async function newBaseManifest(): Promise<chrome.runtime.ManifestV3> {
  return {
    manifest_version: 3,
    name: "google-search-title-qualified",
    version: "0.14.1",
    description:
      "Google will omit the title of the web page. With this add-on, the original title is used as much as possible.",
    icons: {
      48: "icon-48.png",
      96: "icon-96.png",
      128: "icon-128.png",
    },
    content_scripts: [
      {
        js: ["dist/content/main.js"],
        matches: await selectGoogleSearchUrls(),
      },
    ],
    host_permissions: ["<all_urls>"],
    permissions: ["alarms", "storage"],
  };
}

async function newFirefoxManifest(): Promise<FirefoxManifestV3> {
  const baseManifest = await newBaseManifest();
  return {
    ...baseManifest,
    ...{
      browser_specific_settings: {
        gecko: {
          id: "google-search-title-qualified@ncaq.net",
          strict_min_version: "115.0",
        },
      },
      background: {
        scripts: ["dist/background/main.js"],
      },
    },
  };
}

async function newChromeManifest(): Promise<chrome.runtime.ManifestV3> {
  const baseManifest = await newBaseManifest();
  return {
    ...baseManifest,
    permissions: [...(baseManifest.permissions ?? []), "offscreen"],
    background: {
      service_worker: "dist/background/main.js",
    },
    web_accessible_resources: [
      {
        resources: ["asset/offscreen/index.html", "dist/offscreen/main.js"],
        matches: ["<all_urls>"],
      },
    ],
  };
}

async function newManifest(
  target: Target,
): Promise<chrome.runtime.ManifestV3 | FirefoxManifestV3> {
  switch (target) {
    case "firefox":
      return newFirefoxManifest();
    case "chrome":
      return newChromeManifest();
  }
}

/** manifest.jsonを生成して書き込みます。 */
async function writeManifestJson(target: Target): Promise<void> {
  const manifest = await newManifest(target);
  const outputDir = path.join("build", target);
  await fs.mkdir(outputDir, { recursive: true });
  return fs.writeFile(
    path.join(outputDir, "manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
}

// ts-nodeとかで実行させます。
if (require.main === module) {
  const target = process.argv[2];
  if (!isTarget(target)) {
    // eslint-disable-next-line no-console
    console.error("Usage: ts-node manifest.json.make.ts [firefox|chrome]");
    process.exit(1);
  }
  writeManifestJson(target).catch((e: unknown) => {
    throw e;
  });
}
