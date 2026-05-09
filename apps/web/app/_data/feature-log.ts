/**
 * Static, server-side data consumed by the homepage chrome (left rail,
 * editorial main stage, SEO log mirror).
 *
 * The actual interactive debugsy panel at the bottom is driven by the
 * real `<DebugsyLook>` component plus the live registry — see
 * `app/_components/debugsy-look-mounted.tsx`.
 */

const SURFACE_ID = "3f06a121-ea73-430b-8b3b-2cfc7a6b18f";

// =============================================================================
// SEO log mirror — server-rendered into an `sr-only` <ol> so crawlers see
// the same content humans see in the live debugsy panel.
// =============================================================================

export interface SeoLog {
  readonly timestamp: string;
  readonly point: string;
  readonly message: string;
  readonly tags: readonly string[];
}

export const SEO_LOGS: readonly SeoLog[] = [
  {
    timestamp: "22:26:42",
    point: "pdf-surf.realtime.broadcast",
    message: "state:quanta:state",
    tags: ["surface", "broadcast"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `synced surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "synced"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `connect surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connect"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `connecting surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connecting"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `connected surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connected"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `connect surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connect"],
  },
  {
    timestamp: "22:26:43",
    point: "pdf-surf.realtime.conn",
    message: `connected surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connected"],
  },
  {
    timestamp: "22:26:48",
    point: "pdf-surf.realtime.room",
    message: `acquire surface:${SURFACE_ID}`,
    tags: ["surface", "room", "acquire"],
  },
];

// =============================================================================
// Capabilities — major features advertised on the homepage. Used both for
// the editorial grid in <MainStage> and the SEO mirror at the bottom.
// =============================================================================

export interface Capability {
  readonly num: string;
  readonly title: string;
  readonly summary: string;
}

export const CAPABILITIES: readonly Capability[] = [
  {
    num: "01",
    title: "Unified Log Surface",
    summary:
      "Single chronological stream for renders, effects, state, and network. No tab juggling between DevTools, Profiler, and Console.",
  },
  {
    num: "02",
    title: "Re-render Cause Tracing",
    summary:
      "Pinpoints the exact prop, context, or state change that triggered each commit — down to the offending key.",
  },
  {
    num: "03",
    title: "Reference Instability Detection",
    summary:
      "Flags inline objects, arrays, and callbacks re-created on every render before they cascade into child re-renders.",
  },
  {
    num: "04",
    title: "Effect Dependency Diff",
    summary:
      "Before/after view of every useEffect, useMemo, and useCallback dep mutation, with shallow-equality reasoning.",
  },
  {
    num: "05",
    title: "Render Budget Breakers",
    summary:
      "Auto-interrupts runaway render loops in development; configurable thresholds per module.",
  },
  {
    num: "06",
    title: "Zero Production Cost",
    summary:
      "Tree-shaken when NODE_ENV=production. No runtime, no bundle weight, no hooks left behind.",
  },
];

// =============================================================================
// Keyboard shortcuts surfaced in the left rail. Each entry carries the visual
// label + the `KeyboardEvent.key` value + meta-modifier flag so click handlers
// can synthesize the exact event debugsy's internal `useKeyboardShortcuts`
// listener already binds on `document` — no new API surface required.
// =============================================================================

export interface PageShortcut {
  /** Glyph rendered inside the kbd button (e.g. "d", "esc"). */
  readonly key: string;
  /** `KeyboardEvent.key` value to dispatch (e.g. "d", "Escape"). */
  readonly eventKey: string;
  /** Whether the shortcut requires Cmd/Ctrl. */
  readonly meta: boolean;
  /** Human-readable action label rendered next to the key. */
  readonly label: string;
}

export const PAGE_SHORTCUTS: readonly PageShortcut[] = [
  { key: "d", eventKey: "d", meta: true, label: "toggle" },
  { key: "k", eventKey: "k", meta: true, label: "clear" },
  { key: "esc", eventKey: "Escape", meta: false, label: "close" },
];
