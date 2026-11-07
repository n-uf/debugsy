"use client";

import type React from "react";
import { useSyncExternalStore } from "react";
import { PAGE_SHORTCUTS, type PageShortcut } from "../_data/feature-log";

const MAC_PLATFORM_REGEX = /mac|iphone|ipad|ipod|darwin/i;

interface NavigatorUAData {
  readonly platform?: string;
}

/**
 * Picks the first non-empty string from `candidates`. Critical: a plain `??`
 * chain (`a ?? b ?? c`) treats `""` as a valid value, so an empty string from
 * `navigator.userAgentData.platform` (returned by some Chromium contexts
 * with reduced fingerprinting / certain embedded webviews) short-circuits
 * the fallback and breaks Mac detection. This helper falls through on both
 * nullish AND empty values.
 */
function firstNonEmpty(
  ...candidates: ReadonlyArray<string | undefined>
): string {
  for (const c of candidates) {
    if (typeof c === "string" && c.length > 0) return c;
  }
  return "";
}

/**
 * Detects whether the current device uses the macOS modifier convention
 * (⌘) versus the Windows/Linux one (Ctrl). Tries the modern Chromium
 * `userAgentData.platform`, then the legacy `navigator.platform`, then the
 * full user-agent string. Empty strings are skipped — see `firstNonEmpty`.
 */
function detectMacPlatform(): boolean {
  if (typeof navigator === "undefined") return true;
  const uad = (navigator as Navigator & { userAgentData?: NavigatorUAData })
    .userAgentData;
  const candidate = firstNonEmpty(
    uad?.platform,
    navigator.platform,
    navigator.userAgent,
  );
  if (candidate.length === 0) return true;
  return MAC_PLATFORM_REGEX.test(candidate);
}

/**
 * Synthesize the same `KeyboardEvent` debugsy's internal
 * `useKeyboardShortcuts` listener binds on `document`, so a click on the
 * on-page row drives the panel through the exact same code path as the
 * real keystroke. Sets both `metaKey` and `ctrlKey` because debugsy's
 * matcher accepts either (`event.metaKey || event.ctrlKey`), keeping the
 * click usable on macOS and Windows/Linux alike.
 */
function triggerShortcut(s: PageShortcut): void {
  if (typeof document === "undefined") return;
  const event = new KeyboardEvent("keydown", {
    key: s.eventKey,
    metaKey: s.meta,
    ctrlKey: s.meta,
    bubbles: true,
    cancelable: true,
  });
  document.dispatchEvent(event);
}

// =============================================================================
// `useSyncExternalStore` binding for platform detection.
//
// Platform never changes within a session, so `subscribe` is a no-op
// (returns an empty unsubscribe). `getServerSnapshot` returns `true` so the
// server-rendered HTML matches the first client render and avoids a
// hydration mismatch on the modifier glyph; the snapshot is then re-read on
// the client to swap to the real platform value with no layout shift.
//
// This avoids the setState-in-effect pattern (`react-hooks/set-state-in-
// effect`) which the lint rule blocks at zero warnings.
// =============================================================================

const subscribePlatform = (): (() => void) => () => {};
const getServerPlatformSnapshot = (): boolean => true;

export function PageShortcuts(): React.ReactElement {
  const isMac = useSyncExternalStore(
    subscribePlatform,
    detectMacPlatform,
    getServerPlatformSnapshot,
  );

  const modifierGlyph = isMac ? "cmd" : "ctrl";
  const modifierWord = isMac ? "command" : "control";

  return (
    <ul aria-label="keyboard shortcuts" className="g-keys-list">
      {PAGE_SHORTCUTS.map((s) => (
        <li key={s.key}>
          <button
            type="button"
            onClick={() => triggerShortcut(s)}
            aria-label={`${s.meta ? `${modifierWord} ` : ""}${s.key} — ${s.label}`}
          >
            <kbd>
              {s.meta ? <span aria-hidden="true">{modifierGlyph} </span> : null}
              {s.key}
            </kbd>
            <span>{s.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
