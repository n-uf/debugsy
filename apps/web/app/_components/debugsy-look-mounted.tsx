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
  for (const e of SEED_LOGS) debug.log(e.point, e.message, e.data, e.level, ["auth"]);
}

function dispatchToggle(): void {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "d", code: "KeyD", metaKey: true, ctrlKey: true, bubbles: true }),
  );
}

/**
 * Desktop: the panel opens under the hero, folds to its tray once the reader scrolls on, and opens
 * again back at the top. The moment the reader uses the panel or its keys, it stays as they leave it.
 */
function useFoldOnScroll(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return;
    let extended = true;
    let touched = false;
    let ours = false;

    const toggle = (): void => {
      ours = true;
      dispatchToggle();
      ours = false;
      extended = !extended;
    };
    const onScroll = (): void => {
      if (touched) return;
      if (extended && window.scrollY > FOLD_AT) toggle();
      else if (!extended && window.scrollY < UNFOLD_AT) toggle();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (ours) return;
      const k = e.key.toLowerCase();
      if (((e.metaKey || e.ctrlKey) && (k === "d" || k === "k")) || e.key === "Escape") touched = true;
    };
    const onPointer = (e: PointerEvent): void => {
      if (e.target instanceof Element && e.target.closest(".dbg-root, .g-keys")) touched = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onPointer, true);
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onPointer, true);
    };
  }, [enabled]);
}

function subscribeDesktop(onChange: () => void): () => void {
  const mql = window.matchMedia(DESKTOP_VIEWPORT_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function DebugsyLookInner({ foldOnScroll }: { readonly foldOnScroll: boolean }): React.ReactElement {
  useEffect(seedOnce, []);
  useFoldOnScroll(foldOnScroll);
  return <DebugsyLook initialVisible initialIsCompact={false} closeOnClickOutside={false} />;
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
