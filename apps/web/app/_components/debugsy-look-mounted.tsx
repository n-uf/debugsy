"use client";

import { DebugsyLook } from "@n-uf/debugsy";
import type React from "react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
// Registers the demo's Auth module and logs the sample before any panel mounts.
import "../_lib/register-demo-modules";
import { OPEN_PANEL_EVENT } from "./open-panel-button";

const DESKTOP_VIEWPORT_QUERY = "(min-width: 1024px)";
/** Scrolled this far, the panel folds to its tray; back above UNFOLD_AT it opens again. */
const FOLD_AT = 200;
const UNFOLD_AT = 80;
/**
 * At most one fold or unfold this often. DebugsyLook warns at 5 mounts within 5 s
 * (useRenderTracker's mountThreshold), and each fold is a remount.
 */
const SWAP_GAP_MS = 1500;

/**
 * Desktop: the panel opens under the hero, folds to its tray once the reader scrolls on, and opens
 * again back at the top. The moment the reader uses the panel or its keys, it stays as they leave it.
 *
 * Folding swaps the open panel for a freshly mounted one already in its tray (a new element, not a
 * resized one), so the browser doesn't count it as a layout shift; resizing the panel did (0.17 each
 * way). The logs live in debugsy's own store, so the new panel shows the same ones.
 */
function useFoldOnScroll(enabled: boolean): boolean {
  // This component only mounts in the browser, after hydration: a reload mid-page starts folded.
  const [folded, setFolded] = useState(() => enabled && window.scrollY > FOLD_AT);

  useEffect(() => {
    if (!enabled) return;
    let touched = false;
    let current = window.scrollY > FOLD_AT;
    let lastSwap = performance.now();
    let pending = 0;

    const onScroll = (): void => {
      if (touched) return;
      const want = window.scrollY > FOLD_AT ? true : window.scrollY < UNFOLD_AT ? false : current;
      if (want === current) return;
      const wait = SWAP_GAP_MS - (performance.now() - lastSwap);
      if (wait > 0) {
        // Too soon after the last swap: look again when the gap has passed.
        if (!pending) pending = window.setTimeout(() => ((pending = 0), onScroll()), wait);
        return;
      }
      current = want;
      lastSwap = performance.now();
      setFolded(want);
    };
    const onKey = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      if (((e.metaKey || e.ctrlKey) && (k === "d" || k === "k")) || e.key === "Escape") touched = true;
    };
    // Mouse, touch or keyboard focus on the panel or its keys: the reader is using it.
    const onUse = (e: Event): void => {
      if (e.target instanceof Element && e.target.closest(".dbg-root, .g-keys")) touched = true;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("pointerdown", onUse, true);
    document.addEventListener("focusin", onUse, true);
    return () => {
      window.clearTimeout(pending);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("pointerdown", onUse, true);
      document.removeEventListener("focusin", onUse, true);
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
