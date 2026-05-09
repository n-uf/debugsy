import { nextJsConfig } from "@workspace/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default [
  { ignores: ["**/.next/**", "**/node_modules/**"] },
  ...nextJsConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
      "react/jsx-no-comment-textnodes": "off",
    },
  },
];
