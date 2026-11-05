/**
 * The blog and use-case pages: markdown files in apps/web/content/<section>/<slug>.md with front matter,
 * read and checked at build time. Any rule broken below fails the build with every problem listed, so a
 * page can't ship with a long title, a missing FAQ, made-up dates or a link to a page that doesn't exist.
 *
 * Front matter (the SEO brief's format):
 *   title (≤ 60), description (120–155), h1, mainKeyword, kind, published, updated (YYYY-MM-DD,
 *   updated ≥ published), author ("n-uf"), takeaways (3–5), faq (4–5 × {q, a}), sources (≥ 1 × {title,
 *   url, checked}), related (1–4 site paths), draft (optional, true or false; default false).
 *
 * Dates are real: `published` is the day the page went live (the day `draft: true` was flipped to
 * false, by .github/workflows/publish.yml), `updated` the last day its text changed in substance. The
 * sitemap and the structured data use them. A page that merges before its day carries `draft: true`
 * with the go-live day as `published` (and `updated` equal to it); only a draft may have a future date.
 *
 * Scheduled publishing: one rule decides whether a page is live, `isLive(e)` (draft isn't true). The
 * pages every other module sees come from `allEntries()` and its siblings: the live pages, plus the
 * drafts where `showDrafts()` (a dev server or a Vercel preview, never production or a local
 * `next build`). A live page must not link to a draft: the link checks run against the production view
 * whatever `showDrafts()` says, so a preview fails the way production would. A sentence that links to
 * a draft goes in a `{{live:/path}}…{{/live}}` block (see markdown.ts), which only shows once the
 * target is live; `related:` entries that are drafts are dropped from live pages.
 */
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { type Heading, normalizeSitePath, RESERVED_IDS, renderMarkdown } from "./markdown";

export type Section = "blog" | "use-cases";

export interface SectionInfo {
  readonly section: Section;
  readonly path: string;
  /** The index page's title, heading and description. */
  readonly title: string;
  readonly h1: string;
  readonly description: string;
  /** The small label shown above a card and in the breadcrumb. */
  readonly label: string;
  readonly kinds: readonly string[];
}

export const SECTIONS: Readonly<Record<Section, SectionInfo>> = {
  blog: {
    section: "blog",
    path: "/blog",
    title: "React debugging articles",
    h1: "Articles on debugging React",
    description:
      "Articles on debugging React apps: render loops, re-renders, effects and logs, with the exact error messages and the fixes, from the makers of debugsy.",
    label: "blog",
    kinds: ["how-to", "what-is", "comparison", "best-tools"],
  },
  "use-cases": {
    section: "use-cases",
    path: "/use-cases",
    title: "React debugging use cases",
    h1: "What you can debug with debugsy",
    description:
      "Use cases for debugsy, an in-app React debugging panel: each page takes one job, like finding why a component re-rendered, step by step.",
    label: "use case",
    kinds: ["use-case"],
  },
};

export interface Faq {
  readonly q: string;
  readonly a: string;
}
export interface Source {
  readonly title: string;
  readonly url: string;
  readonly checked: string;
}

export interface Entry {
  readonly section: Section;
  readonly slug: string;
  readonly path: string;
  readonly title: string;
  readonly description: string;
  readonly h1: string;
  readonly mainKeyword: string;
  readonly kind: string;
  readonly published: string;
  readonly updated: string;
  readonly author: string;
  readonly takeaways: readonly string[];
  readonly faq: readonly Faq[];
  readonly sources: readonly Source[];
  /** Not live yet: `published` is the go-live day. Only present on pages `showDrafts()` lets through. */
  readonly draft: boolean;
  readonly related: readonly string[];
  readonly html: string;
  readonly headings: readonly Heading[];
  readonly minutes: number;
}

const CONTENT_DIR = path.join(process.cwd(), "content");
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SLUG_FILE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
/** Pages that exist outside the content folders. */
const STATIC_PATHS = ["/"];

interface Raw {
  readonly section: Section;
  readonly slug: string;
  readonly file: string;
  readonly data: Record<string, unknown>;
  readonly body: string;
}

function readSection(section: Section, problems: string[]): Raw[] {
  const dir = path.join(CONTENT_DIR, section);
  if (!fs.existsSync(dir)) return [];
  const out: Raw[] = [];
  for (const name of fs.readdirSync(dir).sort()) {
    if (name.startsWith(".")) continue;
    const file = `content/${section}/${name}`;
    if (!SLUG_FILE.test(name)) {
      // A review copy (.draft.md, .review.md) or a stray file would otherwise turn into a page.
      problems.push(`${file}: only <slug>.md files belong here (lower-case words and hyphens)`);
      continue;
    }
    const src = fs.readFileSync(path.join(dir, name), "utf8");
    const m = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(src);
    if (!m) {
      problems.push(`${file}: no front matter (--- … ---) at the top`);
      continue;
    }
    let data: unknown;
    try {
      // CORE_SCHEMA keeps dates as the strings they're written as.
      data = yaml.load(m[1]!, { schema: yaml.CORE_SCHEMA });
    } catch (e) {
      problems.push(`${file}: front matter isn't valid YAML (${(e as Error).message.split("\n")[0]})`);
      continue;
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      problems.push(`${file}: front matter must be a mapping`);
      continue;
    }
    out.push({ section, slug: name.slice(0, -3), file, data: data as Record<string, unknown>, body: m[2]! });
  }
  return out;
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/** A real calendar day written YYYY-MM-DD (2026-02-31 fails: it doesn't round-trip). */
const isDay = (s: string): boolean =>
  DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;

/**
 * Main keywords that pages outside the content folders own (the SEO plan's sheet); a content page
 * can't take them.
 */
const RESERVED_KEYWORDS: Readonly<Record<string, string>> = { "react debug panel": "the home page" };

function build(): readonly Entry[] {
  const problems: string[] = [];
  // Today in UTC, which is never earlier than the Pacific date a page's `published` is written in.
  const today = new Date().toISOString().slice(0, 10);
  if (fs.existsSync(CONTENT_DIR)) {
    for (const name of fs.readdirSync(CONTENT_DIR)) {
      if (!name.startsWith(".") && !(name in SECTIONS)) {
        problems.push(`content/${name}: not a section (only ${Object.keys(SECTIONS).join(" and ")})`);
      }
    }
  }
  const raws = [...readSection("use-cases", problems), ...readSection("blog", problems)];

  const pagePaths = new Set<string>(STATIC_PATHS);
  const contentPaths = new Set<string>();
  const draftPaths = new Set<string>();
  for (const r of raws) {
    const p = `${SECTIONS[r.section].path}/${r.slug}`;
    pagePaths.add(p);
    contentPaths.add(p);
    if (r.data.draft === true) draftPaths.add(p);
  }
  const sectionPaths = new Set<string>();
  for (const s of Object.values(SECTIONS)) {
    if (raws.some((r) => r.section === s.section)) {
      pagePaths.add(s.path);
      sectionPaths.add(s.path);
    }
  }
  /**
   * Not on the production site yet: a draft, or a section index with no live page. The link checks
   * and the `{{live:}}` blocks use this whatever `showDrafts()` says.
   */
  const hiddenInProduction = (p: string): boolean =>
    draftPaths.has(p) ||
    (sectionPaths.has(p) &&
      !raws.some((r) => SECTIONS[r.section].path === p && r.data.draft !== true));
  const drafts = showDrafts();

  const entries: Entry[] = [];
  const keywordOwner = new Map<string, string>();

  for (const r of raws) {
    const d = r.data;
    const p = (msg: string): void => {
      problems.push(`${r.file}: ${msg}`);
    };
    const title = str(d.title);
    const description = str(d.description);
    const h1 = str(d.h1);
    const mainKeyword = str(d.mainKeyword);
    const kind = str(d.kind);
    const published = str(d.published);
    const updated = str(d.updated);
    const author = str(d.author);

    if (!title || title.length > 60) p(`title is ${title.length} characters (1–60)`);
    if (description.length < 120 || description.length > 155) {
      p(`description is ${description.length} characters (120–155)`);
    }
    if (!h1) p("h1 is missing");
    if (!mainKeyword) p("mainKeyword is missing");
    if (!SECTIONS[r.section].kinds.includes(kind)) {
      p(`kind "${kind}" isn't one of ${SECTIONS[r.section].kinds.join(", ")}`);
    }
    if (d.draft !== undefined && typeof d.draft !== "boolean") p(`draft is "${String(d.draft)}" (true or false)`);
    const draft = d.draft === true;
    if (!isDay(published)) p(`published "${published}" isn't a real YYYY-MM-DD day`);
    if (!isDay(updated)) p(`updated "${updated}" isn't a real YYYY-MM-DD day`);
    if (draft) {
      // A draft's `published` is the day it goes live; there's nothing to have updated yet.
      if (isDay(published) && isDay(updated) && updated !== published) {
        p(`a draft's updated (${updated}) must equal published (${published}), its go-live day`);
      }
    } else {
      if (isDay(published) && isDay(updated) && updated < published) {
        p(`updated (${updated}) is before published (${published})`);
      }
      for (const [name, day] of [["published", published], ["updated", updated]] as const) {
        if (isDay(day) && day > today) {
          p(`${name} ${day} is in the future; only a page with draft: true may have a future date`);
        }
      }
    }
    if (author !== "n-uf") p(`author is "${author}" (the byline is n-uf)`);

    const owner = keywordOwner.get(mainKeyword.toLowerCase()) ?? RESERVED_KEYWORDS[mainKeyword.toLowerCase()];
    if (mainKeyword && owner) p(`mainKeyword "${mainKeyword}" is already ${owner}'s: one main keyword per page`);
    keywordOwner.set(mainKeyword.toLowerCase(), r.file);

    const takeaways = Array.isArray(d.takeaways) ? d.takeaways.map(str).filter(Boolean) : [];
    if (takeaways.length < 3 || takeaways.length > 5) p(`takeaways: ${takeaways.length} (3–5)`);

    const faq: Faq[] = [];
    if (Array.isArray(d.faq)) {
      for (const f of d.faq) {
        const q = str((f as Record<string, unknown>)?.q);
        const a = str((f as Record<string, unknown>)?.a);
        if (!q || !a) p("faq: every entry needs q and a");
        else faq.push({ q, a });
      }
    }
    if (faq.length < 4 || faq.length > 5) p(`faq: ${faq.length} questions (4–5)`);

    const sources: Source[] = [];
    if (Array.isArray(d.sources)) {
      for (const s of d.sources) {
        const o = (s ?? {}) as Record<string, unknown>;
        const src = { title: str(o.title), url: str(o.url), checked: str(o.checked) };
        if (!src.title || !/^https:\/\//.test(src.url) || !isDay(src.checked) || src.checked > today) {
          p(`sources: "${src.title || src.url}" needs a title, an https url and checked: a real YYYY-MM-DD day, not in the future`);
        } else sources.push(src);
      }
    }
    if (sources.length === 0) p("sources: none (every external fact needs one)");

    const related = Array.isArray(d.related) ? d.related.map(str).filter(Boolean).map(normalizeSitePath) : [];
    if (related.length < 1 || related.length > 4) p(`related: ${related.length} paths (1–4)`);
    for (const rel of related) if (!pagePaths.has(rel)) p(`related: ${rel} isn't a page on this site`);
    const self = `${SECTIONS[r.section].path}/${r.slug}`;
    if (related.includes(self)) p("related: lists the page itself");

    // Two renderings: `rendered` with every `{{live:}}` block shown (what the page will be once its
    // targets are live: the structure and link checks run on it), and `production` as the live site
    // shows it today (no block whose target is hidden), which the draft-link check runs on.
    const rendered = renderMarkdown(r.body);
    const production = renderMarkdown(r.body, 1, (t) => !hiddenInProduction(t));
    for (const lp of rendered.liveProblems) p(lp);
    for (const t of new Set(rendered.liveTargets)) {
      if (!contentPaths.has(t)) p(`{{live:${t}}}: ${t} isn't a blog or use-case page on this site`);
      else if (t === self) p(`{{live:${t}}}: the block is on that page itself`);
    }
    if (!draft) {
      for (const l of new Set(production.internalLinks)) {
        if (!hiddenInProduction(l)) continue;
        p(
          draftPaths.has(l)
            ? `links to ${l}, which is a draft (not live yet): wrap the sentence in {{live:${l}}}…{{/live}} so it only shows once ${l} is live`
            : `links to ${l}, which has no live page yet: wrap the sentence in {{live:<first page's path>}}…{{/live}}`,
        );
      }
    }
    if (rendered.h1Count > 0) {
      p(`the body has ${rendered.h1Count} h1 (#, ===== or <h1>); the page's only h1 comes from front matter`);
    }
    for (const l of rendered.relativeLinks) p(`link "${l}" is relative; write site links as /path`);
    const ids = new Set<string>([...rendered.ids, ...RESERVED_IDS]);
    for (const h of rendered.hashLinks) if (!ids.has(h)) p(`link to #${h}, which no heading on the page has`);
    const perTarget = new Map<string, number>();
    for (const l of rendered.internalLinks) {
      if (!pagePaths.has(l)) p(`link to ${l}, which isn't a page on this site`);
      if (l === self) p("links to itself");
      perTarget.set(l, (perTarget.get(l) ?? 0) + 1);
    }
    for (const [t, n] of perTarget) if (n > 2) p(`${n} links to ${t} (at most 2 per target)`);
    for (const alt of rendered.imageAlts) {
      if (!alt || alt.length > 60) p(`image alt "${alt}" is ${alt.length} characters (1–60)`);
    }

    // What the site renders: with drafts shown (dev, previews) everything; in production a live page
    // loses the blocks and `related` cards that point at drafts.
    const shown = drafts ? rendered : production;
    entries.push({
      section: r.section,
      slug: r.slug,
      path: self,
      title,
      description,
      h1,
      mainKeyword,
      kind,
      published,
      updated,
      author,
      takeaways,
      faq,
      sources,
      draft,
      related: drafts ? related : related.filter((rel) => !hiddenInProduction(rel)),
      html: shown.html,
      headings: shown.headings,
      minutes: Math.max(1, Math.round(shown.words / 230)),
    });
  }

  if (problems.length > 0) {
    throw new Error(`Content checks failed (apps/web/content):\n  - ${problems.join("\n  - ")}`);
  }
  return entries;
}

let cache: { readonly sig: string; readonly entries: readonly Entry[] } | undefined;

const newestFirst = (a: Entry, b: Entry): number => (a.published < b.published ? 1 : a.published > b.published ? -1 : 0);

/** The content files' names and change times: a new or edited page changes it. */
function signature(): string {
  const parts: string[] = [];
  for (const s of Object.keys(SECTIONS)) {
    const dir = path.join(CONTENT_DIR, s);
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) parts.push(`${s}/${name}:${fs.statSync(path.join(dir, name)).mtimeMs}`);
  }
  if (fs.existsSync(CONTENT_DIR)) parts.push(...fs.readdirSync(CONTENT_DIR));
  return parts.sort().join("|");
}

/** The one rule for "live": a page is live unless its front matter says `draft: true`. */
export const isLive = (e: Pick<Entry, "draft">): boolean => !e.draft;

/**
 * Whether drafts are visible (with a "Scheduled for" badge and noindex): a dev server and Vercel
 * previews. Vercel production and a local `next build` hide them (a draft has no page there).
 */
export function showDrafts(): boolean {
  return process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview";
}

/** Every page, drafts included, newest first. Throws (failing the build) when any page breaks a rule. */
function everyEntry(): readonly Entry[] {
  // Read once, and again only when a file changed (so a dev server shows edits without a restart).
  const sig = signature();
  if (cache?.sig !== sig) cache = { sig, entries: [...build()].sort(newestFirst) };
  return cache.entries;
}

/**
 * The pages the site shows, newest first: the live ones, plus the drafts where `showDrafts()`. Every
 * list, route, sitemap, nav and link goes through this (or `entriesOf`, `getEntry`, `findByPath`,
 * which use it), so a draft appears nowhere in production.
 */
export function allEntries(): readonly Entry[] {
  const all = everyEntry();
  return showDrafts() ? all : all.filter(isLive);
}

export function entriesOf(section: Section): readonly Entry[] {
  return allEntries().filter((e) => e.section === section);
}

export function getEntry(section: Section, slug: string): Entry | undefined {
  return allEntries().find((e) => e.section === section && e.slug === slug);
}

export function findByPath(p: string): Entry | undefined {
  return allEntries().find((e) => e.path === p);
}

export interface TocLink {
  readonly id: string;
  readonly text: string;
}

/** A page's "On this page" list: its section headings, then the questions and the sources. */
export function entryToc(e: Entry): readonly TocLink[] {
  return [
    ...e.headings.map((h) => ({ id: h.id, text: h.text })),
    { id: "questions", text: "Questions" },
    { id: "sources", text: "Sources" },
  ];
}

/** The sections that have at least one visible page (an empty section has no index page and no nav link). */
export function liveSections(): readonly SectionInfo[] {
  return (["use-cases", "blog"] as const).filter((s) => entriesOf(s).length > 0).map((s) => SECTIONS[s]);
}
