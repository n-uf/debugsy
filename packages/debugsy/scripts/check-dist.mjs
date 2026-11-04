// Checks the built package (dist/) after `tsup`:
// - the bundle starts with the "use client" directive (Next.js App Router);
// - it imports no CSS file and nothing private (@n-uf/*): the CSS travels
//   inside the JavaScript;
// - it imports only react, react-dom, react18-json-view and superjson;
// - process.env.NODE_ENV is left for the app's bundler (not baked in);
// - the type definitions exist and declare the panel;
// - Node can import it and server-render <DebugsyLook />, and the
//   react18-json-view interop in src/ui/ui-blocks/log-entry/formatters/
//   json-view.ts still finds the component under Node's own ESM loader.
// Exits 1 with a list of problems.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const ALLOWED = /^(react|react-dom|react18-json-view|superjson)(\/|$)/;
const problems = [];

const jsPath = join(dist, "index.js");
if (!existsSync(jsPath)) {
  problems.push("index.js: missing");
} else {
  const code = readFileSync(jsPath, "utf8");
  if (!/^"use client";/.test(code)) problems.push('index.js: does not start with "use client"');
  if (!code.includes("process.env.NODE_ENV")) problems.push("index.js: process.env.NODE_ENV was replaced at build time");
  const specifiers = [
    ...code.matchAll(/(?:^|[\s;])(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']/g),
    ...code.matchAll(/(?:^|[\s;])import\s*["']([^"']+)["']/g),
    ...code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  for (const spec of new Set(specifiers)) {
    if (spec.endsWith(".css")) problems.push(`index.js: imports CSS (${spec})`);
    else if (spec.startsWith("@n-uf/")) problems.push(`index.js: imports ${spec}`);
    else if (!ALLOWED.test(spec)) problems.push(`index.js: imports ${spec}, not an allowed dependency`);
  }
}

const dtsPath = join(dist, "index.d.ts");
if (!existsSync(dtsPath)) problems.push("index.d.ts: missing");
else if (!readFileSync(dtsPath, "utf8").includes("DebugsyLook")) problems.push("index.d.ts: no DebugsyLook");

if (problems.length === 0) {
  try {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const lib = await import(pathToFileURL(jsPath).href);
    const html = renderToString(createElement(lib.DebugsyLook, { initialVisible: true, initialIsCompact: false }));
    if (!html.includes("dbg-window")) problems.push("server render: no .dbg-window in the HTML");
    const jv = await import("react18-json-view");
    const component = jv.default?.default ?? jv.default;
    const isComponent =
      typeof component === "function" ||
      (component !== null && typeof component === "object" && "$$typeof" in component);
    if (!isComponent) {
      problems.push("react18-json-view: the interop finds no component under Node's ESM loader");
    }
  } catch (error) {
    problems.push(`Node import or server render failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

if (problems.length > 0) {
  console.error(`dist check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("dist check: use client, NODE_ENV kept, no CSS or private imports, types, Node import and server render ok");
