// @ts-check

import path from "node:path";
import { fileURLToPath } from "node:url";
import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import tseslint from "typescript-eslint";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gitignorePath = path.resolve(__dirname, ".gitignore");

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  eslintConfigPrettier,
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
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
