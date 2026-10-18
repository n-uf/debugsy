import path from "node:path";
import { fileURLToPath } from "node:url";
import { localLibLinks } from "../../scripts/local-lib-links.mjs";

const appDir = path.dirname(fileURLToPath(import.meta.url));
// Opt-in: LOCAL_LIB_REPOS=/path/to/repo pnpm dev  (see scripts/local-lib-links.mjs)
const links = localLibLinks(appDir, path.resolve(appDir, "../.."));
if (links.enabled) {
  console.log(`[local-lib-links] live source for: ${links.packages.join(", ")}`);
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Monorepo root; widened to a common ancestor when LOCAL_LIB_REPOS links another repo.
  outputFileTracingRoot: links.root,
  transpilePackages: [
    "@n-uf/pdf-doodl",
    "@n-uf/pdf-doodl-react",
    "@workspace/debugsy",
    "@workspace/harbuz",
  ],
  turbopack: {
    root: links.root,
    // Local library links (empty unless LOCAL_LIB_REPOS is set)
    resolveAlias: { ...links.aliases },
  },
};

export default nextConfig;
