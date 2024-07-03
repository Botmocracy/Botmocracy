// @ts-check

import globals from "globals";
import pluginJs from "@eslint/js";
import prettierConfig from "eslint-config-prettier";
import tseslint from "typescript-eslint";

export default tseslint.config(
  pluginJs.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      // "@typescript-eslint/ban-ts-comment": "off",
      // "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      // "@typescript-eslint/no-non-null-assertion": "off",
      // "capitalized-comments": "off",
      // "id-length": "off",
      // "new-cap": "off",
      // "no-magic-numbers": "off",
      // "no-ternary": "off",
      // "no-undefined": "off",
      // "no-useless-assignment": "off",
      // "one-var": "off",
      // radix: "off",
      // "sort-keys": "off",
    },
  },
  prettierConfig,
);
