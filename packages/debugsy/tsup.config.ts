import { defineConfig } from "tsup";

/**
 * The published build: one ES module for the package root, with type
 * definitions. The panel's CSS is TypeScript strings in the source, so it
 * travels inside the JavaScript; there is no CSS output.
 *
 * - ES module only. The library keeps module-level state (the debug point
 *   registry, settings, the display queue), and an app that loaded both an
 *   ES and a CommonJS copy would get two of each. Node 22.12+ can require()
 *   it; bundlers import it.
 * - Bundling drops the per-file "use client" directives, so the output gets
 *   one at the top (the banner): Next.js App Router treats the whole package
 *   as client code, which is where a debug panel and its hooks run.
 * - platform "neutral": esbuild leaves `process.env.NODE_ENV` alone (on
 *   "browser" it would bake in "development"), so the app's bundler decides
 *   whether development-only warnings run.
 * - Dependencies and peer dependencies stay external (tsup's default).
 */
export default defineConfig({
  entry: { index: "index.ts" },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2022",
  platform: "neutral",
  banner: { js: '"use client";' },
});
