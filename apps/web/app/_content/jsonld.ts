import { absoluteUrl, ORG_ID, ORG_NODE, SITE_NAME, SITE_URL, WEBSITE_ID } from "../site";
import { type Entry, SECTIONS, type SectionInfo } from "./content";

type Node = Record<string, unknown>;

const WEBSITE_NODE: Node = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: SITE_NAME,
  inLanguage: "en",
  publisher: { "@id": ORG_ID },
};

function breadcrumbs(items: readonly { name: string; path: string }[]): Node {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

/** One page's graph: the n-uf node itself, the website, the page (Article or WebPage), its breadcrumbs and FAQ. */
export function entryGraph(e: Entry, imageUrl: string): Node {
  const url = absoluteUrl(e.path);
  const section = SECTIONS[e.section];
  const page: Node = {
    "@type": e.section === "blog" ? "Article" : "WebPage",
    "@id": `${url}#page`,
    url,
    name: e.title,
    headline: e.h1,
    description: e.description,
    datePublished: e.published,
    dateModified: e.updated,
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    image: imageUrl,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    mainEntityOfPage: url,
    keywords: e.mainKeyword,
  };
  const faq: Node = {
    "@type": "FAQPage",
    "@id": `${url}#faq`,
    mainEntity: e.faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG_NODE,
      WEBSITE_NODE,
      page,
      breadcrumbs([
        { name: SITE_NAME, path: "/" },
        { name: section.name, path: section.path },
        { name: e.h1, path: e.path },
      ]),
      faq,
    ],
  };
}

/** A section index: a CollectionPage holding the list of its pages. */
export function sectionGraph(s: SectionInfo, entries: readonly Entry[]): Node {
  const url = absoluteUrl(s.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      ORG_NODE,
      WEBSITE_NODE,
      {
        "@type": "CollectionPage",
        "@id": `${url}#page`,
        url,
        name: s.title,
        description: s.description,
        inLanguage: "en",
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: entries.map((e, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: absoluteUrl(e.path),
            name: e.h1,
          })),
        },
      },
      breadcrumbs([
        { name: SITE_NAME, path: "/" },
        { name: s.name, path: s.path },
      ]),
    ],
  };
}

/** For <script type="application/ld+json">: JSON with "<" escaped so text can't close the script tag. */
export function jsonLdHtml(graph: Node): string {
  return JSON.stringify(graph).replace(/</g, "\\u003c");
}
