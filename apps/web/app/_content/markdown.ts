import { Marked, Renderer, type Tokens } from "marked";
import { SITE_URL } from "../site";

export interface Heading {
  readonly id: string;
  readonly text: string;
  /** Two-digit section number shown before an h2 ("01"), as on the home page's capability blocks. */
  readonly num: string;
}

export interface Rendered {
  readonly html: string;
  /** The h2 sections, in order, for "on this page" and the numbering. */
  readonly headings: readonly Heading[];
  /** Site-internal link targets, normalised (no trailing slash, no #hash), one entry per link. */
  readonly internalLinks: readonly string[];
  /** `#id` links within the page, to check against `ids`. */
  readonly hashLinks: readonly string[];
  /** Links that are neither site paths, `#` anchors nor absolute URLs (`blog/x`, `../x`): always a mistake. */
  readonly relativeLinks: readonly string[];
  /** Every id the body gives a heading. */
  readonly ids: readonly string[];
  /** h1 elements in the body (markdown `#`, a Setext heading or raw HTML): there must be none. */
  readonly h1Count: number;
  /** Images' alt texts, to check their length. */
  readonly imageAlts: readonly string[];
  /** Words of running text (code blocks excluded), for the reading time. */
  readonly words: number;
}

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const stripTags = (s: string): string =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");

/** Ids the page layout uses for its own sections after the body (entry-page.tsx). */
export const RESERVED_IDS = ["questions", "sources"] as const;

/** The live host; a link written as a full URL on it is treated as a site path. */
const OWN_ORIGIN = SITE_URL;

export const slugify = (s: string): string =>
  stripTags(s)
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** "/blog/x/" and "/blog/x/#y" → "/blog/x"; "/" stays "/". */
export function normalizeSitePath(href: string): string {
  const bare = href.split("#")[0]!.split("?")[0]!;
  return bare.length > 1 ? bare.replace(/\/+$/, "") : bare;
}

/** Render one page's markdown body. Section numbers continue from `firstNum` (1-based). */
export function renderMarkdown(source: string, firstNum = 1): Rendered {
  const headings: Heading[] = [];
  const internalLinks: string[] = [];
  const hashLinks: string[] = [];
  const relativeLinks: string[] = [];
  const imageAlts: string[] = [];
  const usedIds = new Set<string>(RESERVED_IDS);
  const bodyIds: string[] = [];
  let h1Count = 0;

  const uniqueId = (raw: string): string => {
    const base = raw || "section";
    let id = base;
    for (let i = 2; usedIds.has(id); i += 1) id = `${base}-${i}`;
    usedIds.add(id);
    bodyIds.push(id);
    return id;
  };

  const marked = new Marked({
    gfm: true,
    renderer: {
      heading({ tokens, depth }: Tokens.Heading): string {
        const inner = this.parser.parseInline(tokens);
        const id = uniqueId(slugify(inner));
        if (depth === 1) h1Count += 1;
        if (depth === 2) {
          const num = String(firstNum + headings.length).padStart(2, "0");
          headings.push({ id, text: stripTags(inner), num });
          return `<h2 id="${id}"><span class="sec-num" aria-hidden="true">${num}</span>${inner}</h2>\n`;
        }
        return `<h${depth} id="${id}">${inner}</h${depth}>\n`;
      },
      link({ href: rawHref, title, tokens }: Tokens.Link): string {
        const inner = this.parser.parseInline(tokens);
        const t = title ? ` title="${escapeHtml(title)}"` : "";
        // A full URL on the live host is a site path written the long way.
        const href =
          rawHref === OWN_ORIGIN || rawHref.startsWith(`${OWN_ORIGIN}/`)
            ? rawHref.slice(OWN_ORIGIN.length) || "/"
            : rawHref;
        if (href.startsWith("/") && !href.startsWith("//")) {
          const path = normalizeSitePath(href);
          internalLinks.push(path);
          const hash = href.includes("#") ? `#${href.split("#")[1]}` : "";
          return `<a href="${escapeHtml(path + hash)}"${t}>${inner}</a>`;
        }
        if (href.startsWith("#")) {
          hashLinks.push(href.slice(1));
          return `<a href="${escapeHtml(href)}"${t}>${inner}</a>`;
        }
        if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) relativeLinks.push(href);
        return `<a href="${escapeHtml(href)}"${t} rel="noopener">${inner}</a>`;
      },
      code({ text, lang }: Tokens.Code): string {
        const l = (lang ?? "").trim().split(/\s+/)[0] ?? "";
        const cls = l ? ` class="language-${escapeHtml(l)}"` : "";
        return `<pre><code${cls}>${escapeHtml(text)}</code></pre>\n`;
      },
      table(token: Tokens.Table): string {
        return `<div class="table-wrap">${Renderer.prototype.table.call(this, token)}</div>\n`;
      },
      paragraph({ tokens }: Tokens.Paragraph): string {
        // An image on its own line becomes a <figure>, which can't sit inside a <p>.
        if (tokens.length === 1 && tokens[0]?.type === "image") {
          return `${this.parser.parseInline(tokens)}\n`;
        }
        return `<p>${this.parser.parseInline(tokens)}</p>\n`;
      },
      image({ href, title, text }: Tokens.Image): string {
        imageAlts.push(text);
        const caption = title ? `<figcaption>${escapeHtml(title)}</figcaption>` : "";
        return `<figure><img src="${escapeHtml(href)}" alt="${escapeHtml(text)}" loading="lazy" decoding="async">${caption}</figure>`;
      },
    },
  });

  const html = marked.parse(source, { async: false });
  // Raw HTML passes through marked, so count <h1> in the output too (a markdown h1 is counted above).
  const rawH1 = (html.match(/<h1[\s>]/gi) ?? []).length;
  const prose = source.replace(/```[\s\S]*?```/g, " ");
  const words = prose.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
  return {
    html,
    headings,
    internalLinks,
    hashLinks,
    relativeLinks,
    ids: bodyIds,
    h1Count: Math.max(h1Count, rawH1),
    imageAlts,
    words,
  };
}
