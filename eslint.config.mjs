import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    rules: {
      "no-console": "warn",
      "prefer-const": "error",
      "no-await-in-loop": "warn",
      "no-duplicate-imports": "error",
    },
  },
  { ignores: ["dist", "webpack.config.js", "babel.config.js"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  eslintConfigPrettier,
];
