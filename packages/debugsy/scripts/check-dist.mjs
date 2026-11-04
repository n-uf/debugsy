// Checks the built package (dist/) after `tsup`:
// - both bundles start with the "use client" directive (Next.js App Router);
// - they import no CSS file and nothing private (@n-uf/*): the CSS travels
//   inside the JavaScript;
// - they import only react, react-dom, react18-json-view and superjson;
// - the type definitions exist and declare the panel.
// Exits 1 with a list of problems.

import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dist = join(dirname(fileURLToPath(import.meta.url)), "..", "dist");
const ALLOWED = /^(react|react-dom|react18-json-view|superjson)(\/|$)/;
const problems = [];

for (const file of ["index.js", "index.cjs"]) {
  const path = join(dist, file);
  if (!existsSync(path)) {
    problems.push(`${file}: missing`);
    continue;
  }
  const code = readFileSync(path, "utf8");
  if (!/^"use client";/.test(code)) problems.push(`${file}: does not start with "use client"`);
  const specifiers = [
    ...code.matchAll(/(?:^|[\s;])(?:import|export)\s[^"';]*?from\s*["']([^"']+)["']/g),
    ...code.matchAll(/(?:^|[\s;])import\s*["']([^"']+)["']/g),
    ...code.matchAll(/require\(\s*["']([^"']+)["']\s*\)/g),
  ].map((m) => m[1]);
  for (const spec of new Set(specifiers)) {
    if (spec.endsWith(".css")) problems.push(`${file}: imports CSS (${spec})`);
    else if (spec.startsWith("@n-uf/")) problems.push(`${file}: imports ${spec}`);
    else if (!ALLOWED.test(spec)) problems.push(`${file}: imports ${spec}, not an allowed dependency`);
  }
}

for (const file of ["index.d.ts", "index.d.cts"]) {
  const path = join(dist, file);
  if (!existsSync(path)) problems.push(`${file}: missing`);
  else if (!readFileSync(path, "utf8").includes("DebugsyLook")) problems.push(`${file}: no DebugsyLook`);
}

if (problems.length > 0) {
  console.error(`dist check failed:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}
console.log("dist check: use client, no CSS or private imports, types present");
