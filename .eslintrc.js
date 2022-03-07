module.exports = {
  root: true,
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
    "plugin:import/errors",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "plugin:import/warnings",
    "prettier",
  ],
  rules: {
    curly: ["error", "all"],
    // importは同じレイヤーならアルファベット順に
    "import/order": ["error", { alphabetize: { order: "asc" } }],
    "import/prefer-default-export": "off",
  },
};
