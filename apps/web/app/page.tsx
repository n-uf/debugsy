import Link from "next/link";
import type React from "react";
import { liveSections } from "./_content/content";
import { jsonLdHtml } from "./_content/jsonld";
import { DebugsyLookMounted } from "./_components/debugsy-look-mounted";
import { PageShortcuts } from "./_components/page-shortcuts";
import { SiteRail } from "./_components/site-rail";
import { CAPABILITIES, SEO_LOGS } from "./_data/feature-log";
import { HOME_DESCRIPTION, HOME_H1 } from "./home-meta";
import {
  absoluteUrl,
  APP_ID,
  LIB_VERSION,
  LICENSE_NAME,
  LICENSE_URL,
  ORG_ID,
  ORG_NODE,
  REPO_URL,
  SITE_NAME,
  SITE_URL,
  WEBSITE_ID,
} from "./site";

// The home page's graph: the n-uf node itself, the website and the library as a SoftwareApplication.
const STRUCTURED_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    ORG_NODE,
    {
      "@type": "WebSite",
      "@id": WEBSITE_ID,
      url: SITE_URL,
      name: SITE_NAME,
      inLanguage: "en",
      publisher: { "@id": ORG_ID },
    },
    {
      "@type": "SoftwareApplication",
      "@id": APP_ID,
      name: SITE_NAME,
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Browser",
      url: SITE_URL,
      description: HOME_DESCRIPTION,
      softwareVersion: LIB_VERSION,
      license: LICENSE_URL,
      codeRepository: REPO_URL,
      image: absoluteUrl("/opengraph-image"),
      // No `offers`: no price is published for debugsy, so the data doesn't state one (not even 0).
      author: { "@id": ORG_ID },
      publisher: { "@id": ORG_ID },
      featureList: [
        "Structured debug logging by named debug points",
        "Which values changed between renders (useWhyDidYouUpdate)",
        "Render and mount count warnings (useRenderTracker)",
        "One ordered, virtualised log inside the page",
        "No telemetry and no network requests",
      ],
    },
  ],
};

/**
 * `<DebugsyLook>` ships as `position: fixed; bottom: 0; width: 100vw` and is
 * resizable. It publishes its live rendered height to `documentElement` as
 * `--debugsy-panel-h`, so the desktop chrome above can reserve exactly the
 * matching footprint and the two always sum to `100dvh` — no overlap, no
 * overflow. The fallback (`400px`) matches the panel's initial expanded
 * height for the first paint before the var is set. The panel is hidden on
 * mobile (`<DebugsyLookMounted />` returns null below `lg`), so no
 * reservation is needed there and the page is allowed to grow + scroll
 * naturally instead of being clipped to the viewport.
 */

export default function HomePage(): React.ReactElement {
  return (
    <main
      className="dbg-surface dbg-lock flex min-h-dvh w-screen flex-col lg:h-dvh lg:overflow-hidden"
      style={{ color: "rgb(var(--color-chrome-text))" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(STRUCTURED_DATA) }}
      />

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:h-[calc(100dvh-var(--debugsy-panel-h,400px))] lg:grid-cols-[260px_1fr]">
        <LeftRail />
        <MainStage />
      </div>

      {/* Reserved footprint for the desktop-only `<DebugsyLook>` panel —
          height kept in sync with the panel's actual rendered height via the
          `--debugsy-panel-h` CSS var the panel publishes on mount. */}
      <div
        aria-hidden="true"
        className="hidden shrink-0 lg:block lg:h-(--debugsy-panel-h,400px)"
      />

      <DebugsyLookMounted />

      {/* SEO mirror — capabilities (search-indexable feature list) */}
      <section aria-hidden="true" className="sr-only">
        <h2>Major features</h2>
        <ol>
          {CAPABILITIES.map((c) => (
            <li key={c.num}>
              <strong>
                {c.num} — {c.title}.
              </strong>{" "}
              {c.summary}
            </li>
          ))}
        </ol>
        <h2>Live debug log (sample)</h2>
        <ol>
          {SEO_LOGS.map((e, i) => (
            <li key={`${e.timestamp}-${i}`}>
              <time dateTime={e.timestamp}>{e.timestamp}</time>{" "}
              <span>[{e.point}]</span> {e.message}
              {e.tags.length > 0 ? ` — ${e.tags.join(", ")}` : ""}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

// =============================================================================
// LEFT RAIL
// =============================================================================

function LeftRail(): React.ReactElement {
  return (
    <aside
      aria-label="sidebar"
      className="hidden min-h-0 flex-col gap-6 overflow-hidden border-r px-5 py-6 lg:flex"
      style={{
        background: "rgb(var(--color-chrome-bg))",
        borderColor: "rgb(var(--color-chrome-border))",
      }}
    >
      {/* The same rail as the content pages (site-rail.tsx), so nothing moves between pages. */}
      <SiteRail />
    </aside>
  );
}

// =============================================================================
// MAIN STAGE — hero + modules table (mirrors screenshot's file table)
// =============================================================================

function MainStage(): React.ReactElement {
  // No bottom padding on desktop: the code cards clip themselves, so padding
  // left a blank band between the last visible card and the panel's top edge.
  return (
    <section
      aria-label="debugsy"
      className="flex min-h-0 flex-col gap-3 px-5 py-4 lg:overflow-hidden lg:px-8 lg:pt-5 lg:pb-0 xl:px-12 xl:pt-6"
    >
      {/* ── Intro: spec block ────────────────────────────────────── */}
      <header className="flex flex-col gap-1 font-mono">
        {/* The h1 holds only the title; the name and version sit beside it. */}
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span
            className="text-[15px] font-semibold leading-tight tracking-tight lg:text-[16px]"
            style={{ color: "rgb(var(--color-chrome-text))" }}
          >
            debugsy{" "}
            <span style={{ color: "rgb(var(--color-chrome-text-muted))" }}>
              {LIB_VERSION} —
            </span>
          </span>
          <h1
            className="m-0 text-[15px] font-semibold leading-tight tracking-tight lg:text-[16px]"
            style={{ color: "rgb(var(--color-chrome-text))" }}
          >
            {HOME_H1}
          </h1>
        </div>

        {/* The panel's keys, one row under the title; desktop only, like the panel. */}
        <div className="hidden lg:block">
          <PageShortcuts />
        </div>

        <dl
          className="m-0 grid max-w-4xl grid-cols-[max-content_1fr] gap-x-3 gap-y-0.5 text-[12px] leading-snug"
          style={{ color: "rgb(var(--color-chrome-text))" }}
        >
          <SpecRow label="what">
            React component, mounted inside your tree — not a browser extension,
            not a separate app.
          </SpecRow>
          <SpecRow label="traces">
            which value changed since the last render, key by key, for the
            values you hand to <code>useWhyDidYouUpdate</code> (Deps on).
          </SpecRow>
          <SpecRow label="reads as">
            one ordered log: your debug points, changed values and render-count
            warnings, in the page you're debugging.
          </SpecRow>
          <SpecRow label="needs">
            React 19 · GitHub Packages (<code>@n-uf</code> scope) ·{" "}
            {LICENSE_NAME}
          </SpecRow>
          <SpecRow label="in prod">
            no telemetry, no network requests. It doesn't remove itself: load
            it only in development to keep it out of production builds.
          </SpecRow>
          {/* On desktop the rail links the sections, and the one-screen layout has no room
              for another row above the code blocks; phones and tablets get the links here. */}
          {liveSections().length > 0 ? (
            <SpecRow label="read" className="lg:hidden">
              {liveSections().map((s, i) => (
                <span key={s.path}>
                  {i > 0 ? " · " : null}
                  <Link className="underline underline-offset-2" href={s.path}>
                    {s.section === "blog"
                      ? "articles on React debugging"
                      : "debugging use cases"}
                  </Link>
                </span>
              ))}
            </SpecRow>
          ) : null}
        </dl>
      </header>

      {/* ── Capabilities — a grid, so a card never splits across columns: cards 01–03 sit
          side by side, each heading above its code, and when the panel leaves less height the
          list clips at the bottom instead of spilling sideways into hidden columns. ── */}
      <ol className="m-0 grid min-h-0 flex-1 list-none content-start items-start grid-cols-1 gap-x-3 overflow-hidden p-0 sm:grid-cols-2 xl:grid-cols-3">
        <CapabilityBlock num="01" label="Install + mount">
          <Tok kind="comment">// .npmrc (GitHub Packages)</Tok>
          {"\n"}
          @n-uf:registry=https://npm.pkg.github.com
          {"\n"}
          <Tok kind="sh">$</Tok> pnpm add @n-uf/debugsy
          {"\n"}
          <Tok kind="comment">
            // app root — ↓ panel below = this same component
          </Tok>
          {"\n"}
          <Tok kind="kw">import</Tok> {"{ DebugsyLook }"}{" "}
          <Tok kind="kw">from</Tok> <Tok kind="str">"@n-uf/debugsy"</Tok>
          {"\n"}
          <Tok kind="punc">{"<"}</Tok>
          <Tok kind="tag">DebugsyLook</Tok> <Tok kind="punc">/</Tok>
          <Tok kind="punc">{">"}</Tok>
        </CapabilityBlock>

        <CapabilityBlock num="02" label="Logs config">
          <Tok kind="fn">registerModule</Tok>(<Tok kind="str">"auth"</Tok>,
          {" {"}
          {"\n  label:       "}
          <Tok kind="str">"Auth"</Tok>
          {","}
          {"\n  emoji:       "}
          <Tok kind="str">"🔐"</Tok>
          {","}
          {"\n  description: "}
          <Tok kind="str">"session · login · refresh"</Tok>
          {","}
          {"\n  "}
          <Tok kind="comment">{"// each key → debug point: auth.<key>"}</Tok>
          {"\n  points: {"}
          {"\n    session: { emoji: "}
          <Tok kind="str">"🔑"</Tok>
          {", label: "}
          <Tok kind="str">"Session"</Tok>
          {" },"}
          {"\n    login:   { emoji: "}
          <Tok kind="str">"→"</Tok>
          {",  label: "}
          <Tok kind="str">"Login"</Tok>
          {"   },"}
          {"\n    refresh: { emoji: "}
          <Tok kind="str">"↻"</Tok>
          {",  label: "}
          <Tok kind="str">"Refresh"</Tok>
          {" },"}
          {"\n  },"}
          {"\n})"}
        </CapabilityBlock>

        <CapabilityBlock num="03" label="Logging">
          <Tok kind="comment">
            // (point, message, data?, tags?){"\n"}
            // .log .warn .error .critical, .time / .timeEnd
          </Tok>
          {"\n"}
          <Tok kind="comment">// hook · stable, in components</Tok>
          {"\n"}
          <Tok kind="kw">const</Tok> debug = <Tok kind="fn">useDebugsy</Tok>()
          {"\n"}
          debug.<Tok kind="fn">log</Tok>(<Tok kind="str">"rt.conn"</Tok>,{" "}
          <Tok kind="str">"synced"</Tok>, {"{ roomId }"}){"\n"}
          <Tok kind="comment">// const · eager, anywhere</Tok>
          {"\n"}
          <Tok kind="fn">dsy</Tok>.<Tok kind="fn">warn</Tok>(
          <Tok kind="str">"auth.session"</Tok>, <Tok kind="str">"expired"</Tok>,{" "}
          {"{ ttl }"}){"\n"}
          <Tok kind="comment">// fn · lazy, anywhere</Tok>
          {"\n"}
          <Tok kind="fn">getDebugsy</Tok>().<Tok kind="fn">error</Tok>(
          <Tok kind="str">"api.fetch"</Tok>, <Tok kind="str">"5xx"</Tok>, err)
          {"\n"}
          <Tok kind="comment">// global · browser console</Tok>
          {"\n"}
          window.<Tok kind="fn">debugsy</Tok>.<Tok kind="fn">critical</Tok>(
          <Tok kind="str">"auth.refresh"</Tok>, <Tok kind="str">"failed"</Tok>)
        </CapabilityBlock>

        <CapabilityBlock num="04" label="Which value changed">
          <Tok kind="comment">
            // compares each value you pass with the last{"\n"}
            // render and logs the keys that changed (Deps on).
          </Tok>
          {"\n"}
          <Tok kind="fn">useWhyDidYouUpdate</Tok>(<Tok kind="str">"Form"</Tok>,{" "}
          {"{ values, errors, onSubmit }"})
        </CapabilityBlock>

        <CapabilityBlock num="05" label="Render count warnings">
          <Tok kind="comment">
            // counts renders and mounts; at a threshold it logs{"\n"}
            // a warning and calls you back; it won't stop renders.
          </Tok>
          {"\n"}
          <Tok kind="fn">useRenderTracker</Tok>(<Tok kind="str">"Modal"</Tok>,{" "}
          {"{"}
          {"\n  "}renderThreshold: 10,{"   "}
          <Tok kind="comment">{"// default"}</Tok>
          {"\n  "}mountThreshold:{"  "}3,{"    "}
          <Tok kind="comment">{"// default"}</Tok>
          {"\n  "}onExcessiveRenders: (info) =&gt; debug.
          <Tok kind="fn">warn</Tok>(<Tok kind="str">"render.rate"</Tok>,{" "}
          <Tok kind="str">"hot"</Tok>, info),
          {"\n"}
          {"})"}
        </CapabilityBlock>

        <CapabilityBlock num="06" label="Keep it out of production">
          <Tok kind="comment">
            // no telemetry, no network requests. It doesn't remove{"\n"}
            // itself from builds, so load it in development only.
          </Tok>
          {"\n"}
          <Tok kind="kw">if</Tok> (process.env.NODE_ENV !=={" "}
          <Tok kind="str">"production"</Tok>) {"{"}
          {"\n  "}
          <Tok kind="kw">await</Tok> <Tok kind="fn">import</Tok>(
          <Tok kind="str">"@n-uf/debugsy"</Tok>){"\n"}
          {"}"}
        </CapabilityBlock>
      </ol>
    </section>
  );
}

type TokKind = "sh" | "comment" | "kw" | "fn" | "str" | "tag" | "punc";

const TOK_COLOR: Record<TokKind, string> = {
  sh: "rgb(var(--color-chrome-text-muted))",
  comment: "rgb(var(--color-chrome-text-muted))",
  kw: "rgb(var(--color-info))",
  fn: "rgb(var(--color-chrome-text))",
  str: "rgb(var(--color-success))",
  tag: "rgb(var(--color-chrome-text))",
  punc: "rgb(var(--color-chrome-text-muted))",
};

interface TokProps {
  readonly kind: TokKind;
  readonly children: React.ReactNode;
}

function Tok({ kind, children }: TokProps): React.ReactElement {
  const weight = kind === "fn" || kind === "tag" ? 600 : undefined;
  return (
    <span style={{ color: TOK_COLOR[kind], fontWeight: weight }}>
      {children}
    </span>
  );
}

interface CapabilityBlockProps {
  readonly num: string;
  readonly label: string;
  readonly children: React.ReactNode;
}

function CapabilityBlock({
  num,
  label,
  children,
}: CapabilityBlockProps): React.ReactElement {
  return (
    <li className="m-0 mb-3 flex flex-col gap-1">
      <h3 className="m-0 flex items-baseline gap-1.5">
        <span aria-hidden="true" className="dbg-cap-num">
          {num}
        </span>
        <span
          aria-hidden="true"
          className="dbg-cap-num"
          style={{ opacity: 0.55 }}
        >
          ·
        </span>
        <span
          className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em]"
          style={{ color: "rgb(var(--color-chrome-text))" }}
        >
          {label}
        </span>
      </h3>
      <pre
        className="m-0 overflow-x-auto rounded-sm border px-2.5 py-1.5 text-[11px] leading-normal"
        style={{
          borderColor: "rgb(var(--color-chrome-border))",
          background: "rgb(var(--color-chrome-button))",
          color: "rgb(var(--color-chrome-text))",
        }}
      >
        <code>{children}</code>
      </pre>
    </li>
  );
}

interface SpecRowProps {
  readonly label: string;
  readonly children: React.ReactNode;
  /** Extra classes for both cells, e.g. "lg:hidden" for a row only small screens need. */
  readonly className?: string;
}

function SpecRow({
  label,
  children,
  className = "",
}: SpecRowProps): React.ReactElement {
  return (
    <>
      <dt
        className={`text-right text-[10px] uppercase tracking-[0.2em] ${className}`}
        style={{ color: "rgb(var(--color-chrome-text-muted))" }}
      >
        {label}
      </dt>
      <dd className={`m-0 ${className}`}>{children}</dd>
    </>
  );
}
