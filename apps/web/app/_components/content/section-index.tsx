import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";
import { entriesOf, type Section, SECTIONS } from "../../_content/content";
import { jsonLdHtml, sectionGraph } from "../../_content/jsonld";
import { absoluteUrl, SITE_NAME } from "../../site";

export function sectionMetadata(section: Section): Metadata {
  const s = SECTIONS[section];
  return {
    title: { absolute: s.title },
    description: s.description,
    alternates: { canonical: s.path },
    openGraph: {
      type: "website",
      url: absoluteUrl(s.path),
      siteName: SITE_NAME,
      title: s.title,
      description: s.description,
      locale: "en_US",
    },
    twitter: { card: "summary_large_image", title: s.title, description: s.description },
  };
}

/** A section's index: every page in it, newest first. A section with no pages has no index (404). */
export function SectionIndex({ section }: { readonly section: Section }): React.ReactElement {
  const s = SECTIONS[section];
  const entries = entriesOf(section);
  if (entries.length === 0) notFound();
  return (
    <div className="ct-index">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(sectionGraph(s, entries)) }}
      />
      <ol className="ct-crumbs" aria-label="breadcrumb">
        <li>
          <Link href="/">debugsy</Link>
        </li>
        <li aria-current="page">{section === "blog" ? "blog" : "use cases"}</li>
      </ol>
      <h1>{s.h1}</h1>
      <p className="ct-lede">{s.description}</p>
      <ul className="ct-cards">
        {entries.map((e) => (
          <li key={e.path}>
            <Link className="ct-card" href={e.path}>
              <small>
                {e.kind.replace("-", " ")} · {e.draft ? "scheduled for " : null}
                <time dateTime={e.published}>{e.published}</time>
              </small>
              <strong>{e.h1}</strong>
              <span>{e.description}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
