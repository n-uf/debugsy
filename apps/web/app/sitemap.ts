import type { MetadataRoute } from "next";
import { entriesOf, liveSections } from "./_content/content";
import { absoluteUrl, SITE_URL } from "./site";

/**
 * Every indexable page. `lastModified` is a real change date or nothing: a content page's `updated`
 * from its front matter, and a section index's newest `updated`. The home page has none (a build time
 * isn't a change date).
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [{ url: SITE_URL }];
  for (const s of liveSections()) {
    const entries = entriesOf(s.section);
    const newest = entries.map((e) => e.updated).sort().at(-1);
    pages.push({ url: absoluteUrl(s.path), ...(newest ? { lastModified: newest } : {}) });
    for (const e of entries) pages.push({ url: absoluteUrl(e.path), lastModified: e.updated });
  }
  return pages;
}
