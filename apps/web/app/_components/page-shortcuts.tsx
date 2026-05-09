"use client";

import type React from "react";
import { useState } from "react";
import { PAGE_SHORTCUTS, type PageShortcut } from "../_data/feature-log";

const MAC_PLATFORM_REGEX = /Mac|iPhone|iPad|iPod/i;

/**
 * Detects whether the current device uses the macOS modifier convention
 * (⌘) versus the Windows/Linux one (Ctrl). Tries `userAgentData.platform`
 * first (modern, Chromium-only), falls back to the deprecated-but-still-
 * universal `navigator.platform`, and finally to the user-agent string.
 * Defaults to `true` (Mac) on the server so SSR and the first hydration
 * agree; the value is reconciled in `useEffect` after mount.
 */
function detectMacPlatform(): boolean {
  if (typeof navigator === "undefined") return true;
  const ua = navigator as Navigator & {
    userAgentData?: { platform?: string };
  };
  const candidate =
    ua.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent;
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

export function PageShortcuts(): React.ReactElement {
  const [isMac] = useState(() => detectMacPlatform());

  const modifierGlyph = isMac ? "⌘" : "ctrl";
  const modifierWord = isMac ? "command" : "control";

  return (
    <ul
      aria-label="keyboard shortcuts"
      className="m-0 flex flex-col gap-0.5 p-0"
    >
      {PAGE_SHORTCUTS.map((s) => (
        <li key={s.key} className="m-0 p-0">
          <button
            type="button"
            onClick={() => triggerShortcut(s)}
            aria-label={`${s.meta ? `${modifierWord} ` : ""}${s.key} — ${s.label}`}
            className="group grid w-full cursor-pointer grid-cols-[56px_1fr] items-center gap-3 rounded-sm py-1 pr-2 text-left font-mono text-[12px] focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgb(var(--color-chrome-text)/0.4)]"
          >
            <span
              className="inline-flex items-baseline justify-center gap-1 rounded border px-1.5 py-0.5 font-mono font-semibold uppercase tracking-wide transition-colors group-hover:bg-chrome-button-hover group-active:bg-[rgb(var(--color-chrome-button-pressed))] group-active:text-[rgb(var(--color-chrome-button-pressed-text))]"
              style={{
                borderColor: "rgb(var(--color-chrome-border))",
                background: "rgb(var(--color-chrome-button))",
                color: "rgb(var(--color-chrome-text))",
              }}
            >
              {s.meta && (
                <span
                  aria-hidden="true"
                  className="text-[9.5px] tracking-normal"
                  style={{ color: "rgb(var(--color-chrome-text-muted))" }}
                >
                  {modifierGlyph}
                </span>
              )}
              <span className="text-[11px] leading-none">{s.key}</span>
            </span>
            <span
              className="transition-colors group-hover:text-chrome"
              style={{ color: "rgb(var(--color-chrome-text-muted))" }}
            >
              {s.label}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}
