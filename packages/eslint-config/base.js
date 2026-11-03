import js from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import onlyWarn from "eslint-plugin-only-warn";
import turboPlugin from "eslint-plugin-turbo";
import tseslint from "typescript-eslint";

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    plugins: {
      turbo: turboPlugin,
    },
    rules: {
      "turbo/no-undeclared-env-vars": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      // Insights tier boundary (insights/README.md): product code may import
      // only @pdfized/insights-events, never the tier's other packages.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@pdfized/insights-*", "!@pdfized/insights-events"],
              message:
                "Product code may import only @pdfized/insights-events from the insights tier.",
            },
            // A package's internals are private: import its entry points
            // (package.json "exports"), never @workspace/<pkg>/src/...
            // The packages in the (?!...) list still have deep importers;
            // drop each one once they are gone.
            {
              regex: "^@workspace/(?!(debugsy|pdf-surface|surface-ui)/)[^/]+/src(/|$)",
              message:
                "Deep import into a package's internals. Use its entry points instead (for surface: @workspace/surface, /ui, /devtools, /testing).",
            },
          ],
        },
      ],
    },
  },
  {
    plugins: {
      onlyWarn,
    },
  },
  {
    ignores: ["dist/**"],
  },
];
