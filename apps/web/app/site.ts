/**
 * The site's public address: canonical URL, Open Graph URL, robots.txt and the sitemap all use it.
 *
 * debugsy.dev is not registered (checked 2026-11-03), so it serves nothing; pointing the canonical
 * there told search engines to index an address that doesn't exist. If debugsy.dev is ever
 * registered and serves this site, switch SITE_URL to it and redirect debugsy.n-uf.com to it (301).
 */
export const SITE_URL = "https://debugsy.n-uf.com";
