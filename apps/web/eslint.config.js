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
      // External links open in a new tab with rel="noopener" and keep the referrer, so the sites
      // we link to (GitHub, n-uf.com) can see the visits come from here.
      "react/jsx-no-target-blank": ["warn", { allowReferrer: true }],
    },
  },
];
