import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

/**
 * Opt-in local linking of libraries that live in other repos, for HMR.
 *
 * Off by default: package.json and the lockfile keep registry versions, so CI
 * and Vercel are unaffected. To develop a library live, point LOCAL_LIB_REPOS
 * at one or more sibling repo checkouts (comma-separated):
 *
 *   LOCAL_LIB_REPOS=/opt/projects/finfactory/pdf-n-docs pnpm dev
 *
 * Every package under <repo>/packages/* that ships TypeScript source is
 * aliased to that source, so edits hot-reload. An "exports" entry counts as
 * source when it has an "@n-uf/source" condition (libraries that publish a built
 * dist/, like @n-uf/doodl*, add one next to "import"/"require"), or when
 * its "default"/"import" target already points into ./src/ (libraries that
 * publish TypeScript as is). React is pinned to the app's copy so the linked
 * code never loads a second React (which breaks hooks).
 *
 *   LOCAL_LIB_REPOS=/opt/projects/n-uf/doodl pnpm --dir apps/web dev
 *   LOCAL_LIB_REPOS=/opt/projects/n-uf/angiospermae pnpm --dir apps/web dev   # stem, harbuz, kavun, papyrus
 */
export function localLibLinks(appDir, monorepoRoot) {
  const repos = (process.env.LOCAL_LIB_REPOS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((p) => path.resolve(p));

  if (repos.length === 0) {
    return { enabled: false, root: monorepoRoot, aliases: {}, packages: [] };
  }

  const aliases = {};
  const packages = [];

  for (const repo of repos) {
    const pkgsDir = path.join(repo, "packages");
    if (!fs.existsSync(pkgsDir)) {
      throw new Error(`LOCAL_LIB_REPOS: ${repo} has no packages/ folder`);
    }
    for (const entry of fs.readdirSync(pkgsDir)) {
      const pkgDir = path.join(pkgsDir, entry);
      const manifest = path.join(pkgDir, "package.json");
      if (!fs.existsSync(manifest)) continue;
      const pkg = JSON.parse(fs.readFileSync(manifest, "utf8"));
      if (!pkg.name || !fs.existsSync(path.join(pkgDir, "src"))) continue;

      // One exact alias per entry in the package's "exports" map, so linking
      // follows exactly what the package publishes. (Turbopack also accepts
      // "pkg/*" wildcard aliases, verified on Next 16.2, but exact entries
      // cannot drift from the exports map.)
      const exportsMap = pkg.exports ?? { ".": pkg.main ?? "./src/index.ts" };
      let linked = 0;
      for (const [subpath, target] of Object.entries(exportsMap)) {
        const file = sourceFile(target);
        if (!file || !fs.existsSync(path.join(pkgDir, file))) continue; // source exports only
        aliases[subpath === "." ? pkg.name : `${pkg.name}${subpath.slice(1)}`] = path.join(pkgDir, file);
        linked++;
      }
      if (linked > 0) packages.push(pkg.name);
    }
  }

  // One React for everyone: resolve from the app, not from the linked repo.
  const requireFromApp = createRequire(path.join(appDir, "package.json"));
  for (const mod of ["react", "react-dom"]) {
    const dir = path.dirname(requireFromApp.resolve(`${mod}/package.json`));
    aliases[mod] = dir;
  }

  // Turbopack only resolves and watches files under its root, so the root
  // must be a common ancestor of the monorepo and every linked repo.
  const root = [monorepoRoot, ...repos].reduce(commonAncestor);

  // Express alias targets relative to the app, as Turbopack documents them.
  for (const [key, target] of Object.entries(aliases)) {
    const rel = path.relative(appDir, target);
    aliases[key] = rel.startsWith(".") ? rel : `./${rel}`;
  }

  return { enabled: true, root, aliases, packages };
}

/**
 * The TypeScript source file an "exports" entry stands for, or null when the
 * entry only ships built output. Prefers the "@n-uf/source" condition, otherwise
 * falls back to a "default"/"import" target that points into ./src/.
 */
function sourceFile(target) {
  if (typeof target === "string") return target.startsWith("./src/") ? target : null;
  if (!target || typeof target !== "object") return null;
  if (typeof target["@n-uf/source"] === "string") return target["@n-uf/source"];
  const file = target.default ?? target.import;
  return typeof file === "string" && file.startsWith("./src/") ? file : null;
}

function commonAncestor(a, b) {
  const pa = a.split(path.sep);
  const pb = b.split(path.sep);
  const out = [];
  for (let i = 0; i < Math.min(pa.length, pb.length) && pa[i] === pb[i]; i++) {
    out.push(pa[i]);
  }
  return out.join(path.sep) || path.sep;
}
