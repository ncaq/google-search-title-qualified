module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: `${__dirname}/tsconfig.json`,
  },
  extends: [
    "airbnb-typescript/base",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:import/errors",
    "plugin:import/typescript",
    "plugin:import/warnings",
    "prettier",
  ],
  plugins: ["@mysticatea", "@typescript-eslint", "import"],
  rules: {
    "@mysticatea/block-scoped-var": "error",
    "@mysticatea/no-instanceof-array": "error",
    "@mysticatea/no-instanceof-wrapper": "error",
    "@mysticatea/no-literal-call": "error",
    "@mysticatea/no-this-in-static": "error",
    "@mysticatea/no-use-ignored-vars": "error",
    "@mysticatea/no-useless-rest-spread": "error",
    curly: ["error", "all"],
    "sort-imports": ["error", { ignoreDeclarationSort: true }],
    "import/prefer-default-export": 0,
  },
};
