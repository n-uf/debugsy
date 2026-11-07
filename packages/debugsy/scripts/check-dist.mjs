// Checks the built package (dist/) after `tsup`:
// - every module (index.js, core.js and their shared chunks) starts with the
//   "use client" directive (Next.js App Router);
// - none imports a CSS file or anything private (@n-uf/*): the CSS travels
//   inside the JavaScript;
// - they import only react, react-dom, react18-json-view, superjson and
//   each other (./chunk-*.js);
// - process.env.NODE_ENV is left for the app's bundler (not baked in);
// - core.js, with every chunk it loads, holds no panel: no DebugsyLook, no
//   panel markup (dbg-window), no react18-json-view;
// - the type definitions exist: index.d.ts declares the panel, core.d.ts
//   declares dsy and not the panel;
// - Node can import both entries, they share one dsy (one state), it can
//   server-render <DebugsyLook />, and the react18-json-view interop in
//   src/ui/ui-blocks/log-entry/formatters/json-view.ts still finds the
//   component under Node's own ESM loader.
// Exits 1 with a list of problems.

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const ALLOWED = /^(react|react-dom|react18-json-view|superjson)(\/|$)/;
const OWN_CHUNK = /^\.\/[\w.-]+\.js$/;
const problems = [];

/** A module's import specifiers (static, side-effect and require) */
const specifiersOf = (code) =>
  [
    ...code.matchAll(/(?:^|[\s;])(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']/g),
    ...code.matchAll(/(?:^|[\s;])import\s*["']([^"']+)["']/g),
    ...code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);

const jsFiles = existsSync(dist) ? readdirSync(dist).filter((f) => f.endsWith(".js")) : [];
const read = (file) => readFileSync(join(dist, file), "utf8");
const jsPath = join(dist, "index.js");
const corePath = join(dist, "core.js");
for (const entry of ["index.js", "core.js"]) {
  if (!jsFiles.includes(entry)) problems.push(`${entry}: missing`);
}

for (const file of jsFiles) {
  const code = read(file);
  if (!/^"use client";/.test(code)) problems.push(`${file}: does not start with "use client"`);
  for (const spec of new Set(specifiersOf(code))) {
    if (spec.endsWith(".css")) problems.push(`${file}: imports CSS (${spec})`);
    else if (spec.startsWith("@n-uf/")) problems.push(`${file}: imports ${spec}`);
    else if (!ALLOWED.test(spec) && !OWN_CHUNK.test(spec)) problems.push(`${file}: imports ${spec}, not an allowed dependency`);
  }
}

const allCode = jsFiles.map(read).join("\n");
if (jsFiles.length > 0 && !allCode.includes("process.env.NODE_ENV")) {
  problems.push("dist: process.env.NODE_ENV was replaced at build time");
}
// The shipped code must take react18-json-view's component from `.default`
// when Node hands over the CommonJS module object (json-view.ts), and use
// only that shim: a direct default import would crash under Node's loader.
const jsonViewImports = [...allCode.matchAll(/import\s+(\w+)\s+from\s*["']react18-json-view["']/g)].map((m) => m[1]);
if (jsonViewImports.length !== 1) {
  problems.push(`dist: expected one react18-json-view import (the json-view.ts shim), found ${jsonViewImports.length}`);
} else {
  const name = jsonViewImports[0];
  if (!allCode.includes(`${name}.default ?? ${name}`)) {
    problems.push("dist: the react18-json-view import is used without the .default interop");
  }
}

// core.js and every chunk it loads, transitively: no panel
if (jsFiles.includes("core.js")) {
  const seen = new Set();
  const queue = ["core.js"];
  while (queue.length > 0) {
    const file = queue.shift();
    if (seen.has(file) || !jsFiles.includes(file)) continue;
    seen.add(file);
    const code = read(file);
    for (const [marker, what] of [
      ["DebugsyLook", "the panel (DebugsyLook)"],
      ["dbg-window", "the panel's markup (dbg-window)"],
      ["react18-json-view", "the log view (react18-json-view)"],
    ]) {
      if (code.includes(marker)) problems.push(`core: ${file} holds ${what}`);
    }
    for (const spec of specifiersOf(code)) if (OWN_CHUNK.test(spec)) queue.push(spec.slice(2));
  }
}

const dtsPath = join(dist, "index.d.ts");
if (!existsSync(dtsPath)) problems.push("index.d.ts: missing");
else if (!readFileSync(dtsPath, "utf8").includes("DebugsyLook")) problems.push("index.d.ts: no DebugsyLook");
const coreDtsPath = join(dist, "core.d.ts");
if (!existsSync(coreDtsPath)) problems.push("core.d.ts: missing");
else {
  const types = readFileSync(coreDtsPath, "utf8");
  if (!types.includes("dsy")) problems.push("core.d.ts: no dsy");
  if (types.includes("DebugsyLook")) problems.push("core.d.ts: declares the panel");
}

if (problems.length === 0) {
  try {
    const { createElement } = await import("react");
    const { renderToString } = await import("react-dom/server");
    const lib = await import(pathToFileURL(jsPath).href);
    const core = await import(pathToFileURL(corePath).href);
    if (typeof core.dsy !== "object" || core.dsy === null) problems.push("core.js: no dsy");
    if ("DebugsyLook" in core) problems.push("core.js: exports the panel");
    // One state: the panel (root) shows what code logged through the core
    if (core.dsy !== lib.dsy) problems.push("core.js and index.js: two copies of dsy (two states)");
    if (core.registerModule !== lib.registerModule) problems.push("core.js and index.js: two module registries");
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
console.log("dist check: use client, NODE_ENV kept, no CSS or private imports, core without the panel, one shared state, types, Node import and server render ok");
