// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import eslintPluginImportX from "eslint-plugin-import-x";
import { config, configs } from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitignorePath = path.resolve(__dirname, ".gitignore");

export default config(
  includeIgnoreFile(gitignorePath),
  eslintConfigPrettier,
  eslintPluginImportX.flatConfigs.recommended,
  eslintPluginImportX.flatConfigs.typescript,
  {
    rules: {
      "import-x/order": [
        "warn",
        { alphabetize: { order: "asc", orderImportKind: "asc" } },
      ],
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
        }),
      ],
    },
  },
  eslint.configs.recommended,
  ...configs.strictTypeChecked,
  ...configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          // TypeScriptルールでJavaScriptをlintする時はデフォルトのprojectを使用。
          allowDefaultProject: ["*.js", "*.jsx", "*.cjs", "*.mjs"],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
  // 妥当なルール改変。
  {
    rules: {
      // アンダースコアつきの引数は使わなくても無視する対象。
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
      // loggerを使う。
      "no-console": "warn",
      // 生のalertはなるべく避ける。
      "no-alert": "warn",
    },
  }
);
