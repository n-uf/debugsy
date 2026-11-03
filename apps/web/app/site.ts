import pkg from "../../../packages/debugsy/package.json" with { type: "json" };

/**
 * The site's public address: canonical URL, Open Graph URL, robots.txt and the sitemap all use it.
 *
 * debugsy.dev is not registered (checked 2026-11-03), so it serves nothing; pointing the canonical
 * there told search engines to index an address that doesn't exist. If debugsy.dev is ever
 * registered and serves this site, switch SITE_URL to it and redirect debugsy.n-uf.com to it (301).
 */
export const SITE_URL = "https://debugsy.n-uf.com";

export const SITE_NAME = "debugsy";
export const REPO_URL = "https://github.com/n-uf/debugsy";
export const CHANGELOG_URL = `${REPO_URL}/blob/main/packages/debugsy/CHANGELOG.md`;
export const LICENSE_URL = `${REPO_URL}/blob/main/LICENSE`;
export const LICENSE_NAME = "PolyForm Perimeter 1.0.1";

/** The library's published version (calendar YY.M.R), read from its package.json at build time. */
export const LIB_VERSION: string = pkg.version;

/**
 * n-uf, who makes debugsy: the same node, with the same id, on every n-uf site, so search engines
 * see one maker. Every page carries the node itself (not only a reference to its id).
 */
export const ORG_ID = "https://n-uf.com/#org";
export const ORG_NODE = {
  "@type": "Organization",
  "@id": ORG_ID,
  name: "n-uf",
  url: "https://n-uf.com",
  sameAs: ["https://github.com/n-uf"],
} as const;

export const WEBSITE_ID = `${SITE_URL}/#website`;
export const APP_ID = `${SITE_URL}/#app`;

/** An absolute URL on the live host for a site path ("/" stays the bare host). */
export function absoluteUrl(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}
