module.exports = {
  root: true,
  ignorePatterns: [".eslintrc.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: `${__dirname}/tsconfig.json`,
  },
  plugins: ["@typescript-eslint", "import"],
  extends: [
    "airbnb-base",
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:import/errors",
    "plugin:import/warnings",
    "prettier",
  ],
  rules: {
    "import/order": [
      "error",
      {
        alphabetize: { order: "asc" }, // importは同じレイヤーならアルファベット順に。
      },
    ],
    curly: ["error", "all"], // 副行括弧の省略禁止。

    "import/prefer-default-export": "off", // named importの方が分かり易い。
    "max-classes-per-file": "off", // 小さなクラスを複数書きたいことがある。
  },
};
