import type { Metadata } from "next";
import Link from "next/link";
import type React from "react";
import { type Entry, findByPath, SECTIONS } from "../../_content/content";
import { entryGraph, jsonLdHtml } from "../../_content/jsonld";
import { absoluteUrl, SITE_NAME } from "../../site";

/** Where the page's generated share card lives (its opengraph-image route). */
export const imageUrlOf = (e: Entry): string => absoluteUrl(`${e.path}/opengraph-image`);

export function entryMetadata(e: Entry): Metadata {
  return {
    title: { absolute: e.title },
    description: e.description,
    alternates: { canonical: e.path },
    authors: [{ name: "n-uf", url: "https://n-uf.com" }],
    openGraph: {
      type: "article",
      url: absoluteUrl(e.path),
      siteName: SITE_NAME,
      title: e.title,
      description: e.description,
      locale: "en_US",
      publishedTime: e.published,
      modifiedTime: e.updated,
      authors: ["https://n-uf.com"],
    },
    twitter: { card: "summary_large_image", title: e.title, description: e.description },
  };
}

function relatedCard(p: string): { label: string; title: string } {
  if (p === "/") return { label: "home", title: "What debugsy is and how to set it up" };
  const section = Object.values(SECTIONS).find((s) => s.path === p);
  if (section) return { label: section.label, title: section.h1 };
  const e = findByPath(p);
  return e ? { label: SECTIONS[e.section].label, title: e.h1 } : { label: "", title: p };
}

const day = (iso: string): string =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

/** A blog article or a use-case page, laid out as in the approved sketch. */
export function EntryPage({ entry: e }: { readonly entry: Entry }): React.ReactElement {
  const section = SECTIONS[e.section];
  const next = e.headings.length + 1;
  const num = (n: number): string => String(n).padStart(2, "0");
  const toc = [
    ...e.headings.map((h) => ({ id: h.id, text: h.text })),
    { id: "questions", text: "Questions" },
    { id: "sources", text: "Sources" },
  ];

  return (
    <div className="ct-page">
      <article>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(entryGraph(e, imageUrlOf(e))) }}
        />
        <ol className="ct-crumbs" aria-label="breadcrumb">
          <li>
            <Link href="/">debugsy</Link>
          </li>
          <li>
            <Link href={section.path}>{section.section === "blog" ? "blog" : "use cases"}</Link>
          </li>
          <li aria-current="page">{e.h1}</li>
        </ol>
        <h1>{e.h1}</h1>
        <p className="ct-byline">
          <span>
            by <b>n-uf</b>
          </span>
          <span>
            published <time dateTime={e.published}>{day(e.published)}</time>
          </span>
          {e.updated !== e.published ? (
            <span>
              updated <time dateTime={e.updated}>{day(e.updated)}</time>
            </span>
          ) : null}
          <span>{e.minutes} min read</span>
        </p>

        <div className="ct-takeaways">
          <p className="ct-label">Key takeaways</p>
          <ul>
            {e.takeaways.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>

        <div className="ct-prose" dangerouslySetInnerHTML={{ __html: e.html }} />

        <aside className="ct-cta" aria-label="install debugsy">
          <div>
            <p>
              debugsy runs inside your own app and logs the values you pass to its hooks. It
              installs from GitHub Packages, which asks for a token with read:packages.
            </p>
            <pre>
              <code>pnpm add @n-uf/debugsy</code>
            </pre>
          </div>
          <Link className="ct-cta-link" href="/">
            install debugsy
          </Link>
        </aside>

        <section className="ct-faq" aria-labelledby="questions">
          <h2 id="questions" className="ct-section-head">
            <span className="sec-num" aria-hidden="true">
              {num(next)}
            </span>
            Questions
          </h2>
          {e.faq.map((f, i) => (
            <details key={f.q} open={i === 0}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </section>

        <section aria-labelledby="sources">
          <h2 id="sources" className="ct-section-head">
            <span className="sec-num" aria-hidden="true">
              {num(next + 1)}
            </span>
            Sources
          </h2>
          <ol className="ct-sources">
            {e.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} rel="noopener">
                  {s.title}
                </a>{" "}
                · checked {s.checked}
              </li>
            ))}
          </ol>
          <ul className="ct-cards" aria-label="related pages">
            {e.related.map((p) => {
              const c = relatedCard(p);
              return (
                <li key={p}>
                  <Link className="ct-card" href={p}>
                    <small>{c.label}</small>
                    <strong>{c.title}</strong>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </article>

      <nav className="ct-toc" aria-label="on this page">
        <p className="ct-label">On this page</p>
        {toc.map((t) => (
          <a key={t.id} href={`#${t.id}`}>
            {t.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
