"use client";

import { DebugsyLook, getDebugsy } from "@n-uf/debugsy";
import type React from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import "../_lib/register-demo-modules";
import { OPEN_PANEL_EVENT } from "./open-panel-button";

const DESKTOP_VIEWPORT_QUERY = "(min-width: 1024px)";
/** Scrolled this far, the panel folds to its tray; back above UNFOLD_AT it opens again. */
const FOLD_AT = 200;
const UNFOLD_AT = 80;

interface SeedLog {
  readonly point: string;
  readonly message: string;
  readonly level: "info" | "warn" | "error" | "critical";
  readonly data?: Record<string, unknown>;
}

/**
 * The sample log, following the page's own example: the Auth module's session and refresh points,
 * logged with the calls the page shows (debug.log, dsy.warn, getDebugsy().error, window.debugsy.critical).
 */
const SEED_LOGS: readonly SeedLog[] = [
  { point: "session", message: "synced", level: "info", data: { userId: 42 } },
  { point: "refresh", message: "renewed", level: "info", data: { expiresIn: 3600 } },
  { point: "session", message: "expired", level: "warn", data: { ttl: 0 } },
  { point: "refresh", message: "5xx", level: "error", data: { status: 503 } },
  { point: "refresh", message: "failed", level: "critical" },
];

let seeded = false;

/** Turns on the demo's points and logs the sample once per page load. */
function seedOnce(): void {
  if (seeded) return;
  seeded = true;
  const debug = getDebugsy();
  debug.enable("session");
  debug.enable("refresh");
  debug.enable("dependencies");
  // The sample's error lines would otherwise be mirrored to the browser console as errors.
  const mirrored = debug.isConsoleEnabled();
  debug.setConsoleEnabled(false);
  try {
    for (const e of SEED_LOGS) debug.log(e.point, e.message, e.data, e.level, ["auth"]);
  } finally {
    debug.setConsoleEnabled(mirrored);
  }
}

/**
 * Desktop: the panel opens under the hero, folds to its tray once the reader scrolls on, and opens
 * again back at the top. The moment the reader uses the panel or its keys, it stays as they leave it.
 *
 * Folding swaps the open panel for a freshly mounted one already in its tray (a new element, not a
 * resized one), so the browser doesn't count it as a layout shift; resizing the panel did (0.17 each
 * way). The logs live in debugsy's own store, so the new panel shows the same ones.
 */
function useFoldOnScroll(enabled: boolean): boolean {
  const [folded, setFolded] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let touched = false;

    const onScroll = (): void => {
      if (touched) return;
      if (window.scrollY > FOLD_AT) setFolded(true);
      else if (window.scrollY < UNFOLD_AT) setFolded(false);
    };
    const onKey = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      if (((e.metaKey || e.ctrlKey) && (k === "d" || k === "k")) || e.key === "Escape") touched = true;
    };
    const onPointer = (e: PointerEvent): void => {
      if (e.target instanceof Element && e.target.closest(".dbg-root, .g-keys")) touched = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    // A reload or a resize to desktop can start mid-page: fold right away instead of on the next scroll.
    const first = requestAnimationFrame(onScroll);
    return () => {
      cancelAnimationFrame(first);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [enabled]);

  return folded;
}

function subscribeDesktop(onChange: () => void): () => void {
  const mql = window.matchMedia(DESKTOP_VIEWPORT_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function DebugsyLookInner({ foldOnScroll }: { readonly foldOnScroll: boolean }): React.ReactElement {
  useEffect(seedOnce, []);
  const folded = useFoldOnScroll(foldOnScroll);
  return (
    <DebugsyLook
      key={folded ? "tray" : "open"}
      initialVisible
      initialIsCompact={folded}
      closeOnClickOutside={false}
    />
  );
}

/**
 * The live panel. On desktops it is part of the page from the start; on phones and tablets it mounts
 * only when the reader asks (the "Open the live panel" button), so they pay nothing for it otherwise.
 * The server renders nothing here, so the first paint is the same for everyone.
 */
export function DebugsyLookMounted(): React.ReactElement | null {
  const isDesktop = useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches,
    () => false,
  );
  const [openCount, setOpenCount] = useState(0);
  const listening = useRef(false);

  useEffect(() => {
    if (listening.current) return;
    listening.current = true;
    const open = (): void => setOpenCount((n) => n + 1);
    window.addEventListener(OPEN_PANEL_EVENT, open);
    return () => {
      listening.current = false;
      window.removeEventListener(OPEN_PANEL_EVENT, open);
    };
  }, []);

  if (isDesktop) return <DebugsyLookInner foldOnScroll />;
  // A fresh mount per request, so the panel opens again after the reader closed it.
  if (openCount > 0) return <DebugsyLookInner key={openCount} foldOnScroll={false} />;
  return null;
}
