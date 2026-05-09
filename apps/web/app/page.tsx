import type React from "react";
import { DebugsyLookMounted } from "./_components/debugsy-look-mounted";
import { PageShortcuts } from "./_components/page-shortcuts";
import { ThemeSwitcherClient } from "./_components/theme-switcher-client";
import { CAPABILITIES, SEO_LOGS } from "./_data/feature-log";

/**
 * `<DebugsyLook>` ships as `position: fixed; bottom: 0; width: 100vw` and
 * extends to ~400px tall when open. Desktop reserves that footprint so the
 * chrome above never collides with the panel. The panel is hidden on
 * mobile (`<DebugsyLookMounted />` returns null below `lg`), so no
 * reservation is needed there and the page is allowed to grow + scroll
 * naturally instead of being clipped to the viewport.
 */

export default function HomePage(): React.ReactElement {
  return (
    <main
      className="dbg-surface flex min-h-dvh w-screen flex-col lg:h-dvh lg:overflow-hidden"
      style={{ color: "rgb(var(--color-chrome-text))" }}
    >
      <h1 className="sr-only">
        debugsy — real-time React debugging panel with dependency tracking and
        circuit breakers
      </h1>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:h-[calc(100dvh-400px)] lg:grid-cols-[260px_1fr]">
        <LeftRail />
        <MainStage />
      </div>

      {/* Reserved footprint for the desktop-only `<DebugsyLook>` panel. */}
      <div
        aria-hidden="true"
        className="hidden shrink-0 lg:block lg:h-[400px]"
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
      {/* wordmark */}
      <div className="flex flex-col gap-1.5">
        <span
          className="font-mono text-[20px] font-semibold leading-none tracking-tight"
          style={{ color: "rgb(var(--color-chrome-text))" }}
        >
          debugsy
        </span>
        <span
          className="font-mono text-[10px] tracking-wide"
          style={{ color: "rgb(var(--color-chrome-text-muted))" }}
        >
          v2 · mit · 0 deps · 12 kb
        </span>
        <span
          className="font-mono text-[10px] tracking-wide"
          style={{ color: "rgb(var(--color-chrome-text-muted))" }}
        >
          by{" "}
          <a
            className="hover:underline"
            style={{ color: "rgb(var(--color-chrome-text))" }}
            href="https://pdfized.com"
            rel="noopener noreferrer"
            target="_blank"
          >
            PDFized.com
          </a>
        </span>
      </div>

      {/* nav */}
      <nav
        aria-label="primary"
        className="flex flex-col gap-0.5 font-mono text-[11px]"
      >
        <a
          className="hover:underline"
          style={{ color: "rgb(var(--color-chrome-text))" }}
          href="#docs"
        >
          docs
        </a>
        <a
          className="hover:underline"
          style={{ color: "rgb(var(--color-chrome-text-muted))" }}
          href="#source"
        >
          source
        </a>
        <a
          className="hover:underline"
          style={{ color: "rgb(var(--color-chrome-text-muted))" }}
          href="#changelog"
        >
          changelog
        </a>
      </nav>

      {/* shortcuts */}
      <PageShortcuts />

      {/* theme */}
      <ThemeSwitcherClient />
    </aside>
  );
}

// =============================================================================
// MAIN STAGE — hero + modules table (mirrors screenshot's file table)
// =============================================================================

function MainStage(): React.ReactElement {
  return (
    <section
      aria-label="debugsy"
      className="flex min-h-0 flex-col gap-4 px-5 py-4 lg:overflow-hidden lg:px-8 lg:py-5 xl:px-12 xl:py-6"
    >
      {/* ── Intro: spec block ────────────────────────────────────── */}
      <header className="flex flex-col gap-2.5 font-mono">
        <h2
          className="m-0 text-[15px] font-semibold leading-tight tracking-tight lg:text-[16px]"
          style={{ color: "rgb(var(--color-chrome-text))" }}
        >
          debugsy{" "}
          <span style={{ color: "rgb(var(--color-chrome-text-muted))" }}>
            v2 —
          </span>{" "}
          in-process React inspector
        </h2>

        <dl
          className="m-0 grid max-w-4xl grid-cols-[max-content_1fr] gap-x-3 gap-y-1 text-[12px] leading-snug"
          style={{ color: "rgb(var(--color-chrome-text))" }}
        >
          <SpecRow label="what">
            React component, mounted inside your tree — not a browser extension,
            not a separate app.
          </SpecRow>
          <SpecRow label="traces">
            re-render cause — identity churn, dep mutation, prop churn, context
            cascade — down to the offending key.
          </SpecRow>
          <SpecRow label="reads as">
            one ordered log: renders, effects, state, fetch. No DevTools /
            Profiler / Console juggling.
          </SpecRow>
          <SpecRow label="cost">
            ~12 kB gzip · 0 runtime deps · sub-ms init.
          </SpecRow>
          <SpecRow label="in prod">
            safe to keep mounted — no telemetry, no network, no global hooks.
            Tree-shake with <code>NODE_ENV=production</code> for zero cost.
          </SpecRow>
        </dl>
      </header>

      {/* ── Capabilities — masonry-packed, sized to content, no wasted rows ── */}
      <ol className="m-0 min-h-0 flex-1 list-none gap-0 overflow-hidden p-0 [column-fill:balance] columns-1 gap-x-3 sm:columns-2 xl:columns-3">
        <CapabilityBlock num="01" label="Install + mount">
          <Tok kind="comment">// shell</Tok>
          {"\n"}
          <Tok kind="sh">$</Tok> pnpm add @workspace/debugsy
          {"\n"}
          <Tok kind="comment">
            // app root — ↓ panel below = this same component
          </Tok>
          {"\n"}
          <Tok kind="kw">import</Tok> {"{ DebugsyLook }"}{" "}
          <Tok kind="kw">from</Tok> <Tok kind="str">"@workspace/debugsy"</Tok>
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
            // (point, message, data?, tags?) · .log .warn .error .critical ·
            .time / .timeEnd
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
          <Tok kind="str">"render.loop"</Tok>, <Tok kind="str">"runaway"</Tok>)
        </CapabilityBlock>

        <CapabilityBlock num="04" label="Re-render cause tracing">
          <Tok kind="comment">
            // shallow-equality diff over the watched bag,{"\n"}
            // emitted as a debug log entry on every commit.
          </Tok>
          {"\n"}
          <Tok kind="fn">useWhyDidYouUpdate</Tok>(<Tok kind="str">"Form"</Tok>,{" "}
          {"{ values, errors, onSubmit }"})
        </CapabilityBlock>

        <CapabilityBlock num="05" label="Reference instability detection">
          <Tok kind="comment">
            // counts renders, tracks identity-stability of deps,{"\n"}
            // alerts when renderThreshold or mountThreshold is hit.
          </Tok>
          {"\n"}
          <Tok kind="fn">useRenderTracker</Tok>(<Tok kind="str">"Modal"</Tok>,
          [open, items, onClose], {"{"}
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

        <CapabilityBlock num="06" label="Zero production cost">
          <Tok kind="comment">
            // tree-shaken when NODE_ENV=production. no runtime,{"\n"}
            // no global hooks, no telemetry, no network.
          </Tok>
          {"\n"}
          <Tok kind="kw">if</Tok> (process.env.NODE_ENV !=={" "}
          <Tok kind="str">"production"</Tok>) {"{"}
          {"\n  "}
          <Tok kind="kw">await</Tok> <Tok kind="fn">import</Tok>(
          <Tok kind="str">"@workspace/debugsy/dev"</Tok>){"\n"}
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
    <li className="m-0 mb-3 flex break-inside-avoid flex-col gap-1">
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
}

function SpecRow({ label, children }: SpecRowProps): React.ReactElement {
  return (
    <>
      <dt
        className="text-right text-[10px] uppercase tracking-[0.2em]"
        style={{ color: "rgb(var(--color-chrome-text-muted))" }}
      >
        {label}
      </dt>
      <dd className="m-0">{children}</dd>
    </>
  );
}
