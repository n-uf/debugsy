import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
    setupFiles: ["test/setup.ts"],
    server: {
      // @n-uf/harbuz ships TypeScript source: let Vite transform it.
      deps: { inline: [/@n-uf\//] },
    },
  },
});
