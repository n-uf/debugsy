import { config } from "@workspace/eslint-config/react-internal";

/** @type {import("eslint").Linter.Config} */
export default [
  ...config,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-wrapper-object-types": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "react-hooks/purity": "off",
      "react-hooks/refs": "off",
      "react-hooks/exhaustive-deps": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "prefer-const": "off",
      "no-prototype-builtins": "off",
      "react-hooks/rules-of-hooks": "off",
      "react-hooks/use-memo": "off",
      "react/display-name": "off",
      "@typescript-eslint/no-require-imports": "off",
      "turbo/no-undeclared-env-vars": "off",
    },
  },
];
