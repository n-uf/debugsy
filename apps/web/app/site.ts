/**
 * The site's public address: canonical URL, Open Graph URL, robots.txt and the sitemap all use it.
 *
 * debugsy.dev is registered but has no DNS records, so it serves nothing; pointing the canonical
 * there told search engines to index an address that doesn't load. When debugsy.dev serves this
 * site, switch SITE_URL to it and redirect debugsy.n-uf.com to it (301).
 */
export const SITE_URL = "https://debugsy.n-uf.com";
