import JsonViewImport from "react18-json-view";

/**
 * react18-json-view is `"type": "module"` but points `main` at a CommonJS
 * build and has no `exports` map. Bundlers hand us the component; Node's own
 * ES module loader (server rendering without a bundler, Vitest or Jest with
 * external dependencies) hands us the CommonJS module object instead, with
 * the component on `.default`. Take whichever is the component.
 */
export const JsonView: typeof JsonViewImport =
  (JsonViewImport as unknown as { default?: typeof JsonViewImport }).default ??
  JsonViewImport;
