import { defineConfig } from "tsup";

/**
 * The published build: one ESM file and one CommonJS file for the package
 * root, with type definitions. The panel's CSS is TypeScript strings in the
 * source, so it travels inside the JavaScript; there is no CSS output.
 *
 * Bundling drops the per-file "use client" directives, so the output gets
 * one at the top (the banner): Next.js App Router treats the whole package
 * as client code, which is where a debug panel and its hooks run.
 *
 * Dependencies and peer dependencies stay external (tsup's default).
 */
export default defineConfig({
  entry: { index: "index.ts" },
  format: ["esm", "cjs"],
  outExtension: ({ format }) => ({ js: format === "esm" ? ".js" : ".cjs" }),
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  platform: "browser",
  banner: { js: '"use client";' },
});
