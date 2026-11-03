"use client";

import { DebugsyLook, getDebugsy } from "@n-uf/debugsy";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import "../_lib/register-real-modules";

const DESKTOP_VIEWPORT_QUERY = "(min-width: 1024px)";

/**
 * Realistic surface IDs and a wss endpoint pattern that mirrors what
 * pdfized.com emits in the screenshot.
 */
const SURFACE_ID = "3f06a121-ea73-430b-8b3b-2cfc7a6b18f";
const REALTIME_URL = `wss://realtime.pdfized.com/?room=surface&id=${SURFACE_ID}`;

interface SeedLog {
  readonly point: string;
  readonly message: string;
  readonly tags: readonly string[];
  readonly data?: Record<string, unknown>;
}

/**
 * 8 seed logs patterned after the actual `pdf-surf.realtime` feed that
 * shows in the homepage screenshot.
 *
 * NOTE: Seeded tags include both the registry tags (`conn`, `room`,
 * `broadcast`) AND the user-side discovery tags shown in the screenshot
 * sidebar (`surface`, `comm`, `connecting`, `connected`, `synced`,
 * `acquire`).
 */
const SEED_LOGS: readonly SeedLog[] = [
  {
    point: "realtime",
    message: "state:quanta:state",
    tags: ["surface", "broadcast"],
    data: {
      type: "render-tracker",
      component: "PDFSurface",
      renderCount: 142,
      propsChanged: ["camera", "docks"],
    },
  },
  {
    point: "realtime",
    message: `synced surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "synced"],
    data: { surfaceId: SURFACE_ID, lamport: 142 },
  },
  {
    point: "realtime",
    message: `connect surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connect", "conn"],
    data: { surfaceId: SURFACE_ID },
  },
  {
    point: "realtime",
    message: `connecting surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connecting", "conn"],
    data: { surfaceId: SURFACE_ID, attempt: 1 },
  },
  {
    point: "realtime",
    message: `connected surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connected", "conn"],
    data: { surfaceId: SURFACE_ID, latencyMs: 17 },
  },
  {
    point: "realtime",
    message: `connect surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connect", "conn"],
    data: { surfaceId: SURFACE_ID, channel: "presence" },
  },
  {
    point: "realtime",
    message: `connected surface:${SURFACE_ID}`,
    tags: ["surface", "comm", "connected", "conn"],
    data: { surfaceId: SURFACE_ID, channel: "presence", latencyMs: 19 },
  },
  {
    point: "realtime",
    message: `acquire surface:${SURFACE_ID}`,
    tags: ["surface", "room", "acquire"],
    data: { url: REALTIME_URL, seat: "owner" },
  },
];

/**
 * Fires ⌘+D twice on mount so the panel auto-shows in extended mode,
 * matching "always visible" intent. ⌘+D is registered globally on
 * `document` by the harbuz `useKeyboardShortcuts` hook.
 */
function useAutoOpenDebugsyPanel(): void {
  const opened = useRef(false);

  useEffect(() => {
    if (opened.current) return;

    const dispatchToggle = (): void => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "d",
          code: "KeyD",
          metaKey: true,
          bubbles: true,
        }),
      );
    };

    // Mark it opened only when the toggles actually fire: React's Strict Mode (on in `next dev`)
    // runs this effect, cleans it up (cancelling the frame) and runs it again, and a flag set up
    // front made the second run skip, so the panel never opened in development.
    let r2 = 0;
    const r1 = requestAnimationFrame(() => {
      opened.current = true;
      dispatchToggle();
      r2 = requestAnimationFrame(() => dispatchToggle());
    });
    return () => {
      cancelAnimationFrame(r1);
      cancelAnimationFrame(r2);
    };
  }, []);
}

/**
 * Re-enables key debug points (some are off by default) and emits the
 * seed log batch once on mount. Uses `getDebugsy()` instead of the
 * `useDebugsy()` hook because the latter's stable interface omits the
 * `tags` parameter on `log()`.
 */
function useDebugsySimulator(): void {
  const seeded = useRef(false);

  useEffect(() => {
    if (seeded.current) return;
    seeded.current = true;

    const debug = getDebugsy();
    debug.enable("realtime");
    debug.enable("surface");
    debug.enable("dependencies");

    for (const entry of SEED_LOGS) {
      debug.log(entry.point, entry.message, entry.data, "info", [
        ...entry.tags,
      ]);
    }
  }, []);
}

/**
 * Desktop-only mount: the live `<DebugsyLook>` panel is intentionally hidden
 * on phones/tablets. The runtime cost (auto-open keystroke, seed-log
 * simulator, render tracking) is also avoided there because the inner
 * component never mounts. Reads `matchMedia` after hydration to keep SSR /
 * first-paint deterministic.
 */
function useIsDesktopViewport(): boolean {
  const [isDesktop, setIsDesktop] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia(DESKTOP_VIEWPORT_QUERY).matches,
  );

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_VIEWPORT_QUERY);
    const onChange = (e: MediaQueryListEvent): void => setIsDesktop(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isDesktop;
}

function DebugsyLookInner(): React.ReactElement {
  useAutoOpenDebugsyPanel();
  useDebugsySimulator();

  return <DebugsyLook closeOnClickOutside={false} />;
}

export function DebugsyLookMounted(): React.ReactElement | null {
  const isDesktop = useIsDesktopViewport();
  if (!isDesktop) return null;
  return <DebugsyLookInner />;
}
