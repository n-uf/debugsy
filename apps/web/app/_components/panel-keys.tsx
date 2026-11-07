"use client";

import { getDebugsy, useDebugSubscription } from "@n-uf/debugsy";
import type React from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { SAMPLE_LOG_COUNT } from "../_lib/register-demo-modules";

/**
 * The live panel's three keys as keycaps that show their own state (approved 2026-11-07):
 * ⌘D latches like a toggle key, up while the panel is closed, down while it shows, and its light
 * is on when the full panel is open; ⌘K and Esc are momentary and fade in place when they can't act.
 * Clicking a key sends the same keydown the panel listens for. State changes only move the cap and
 * light up (transforms and colours), so the page's layout never shifts.
 */

type PanelState = "closed" | "tray" | "open";

/** The tray (compact panel) is about 60 px tall; anything taller is the full panel. */
const TRAY_MAX_PX = 120;
const MAC = /mac|iphone|ipad|ipod|darwin/i;

let panelSeen = false;

/** The panel's state, from what it publishes: --debugsy-panel-h on <html> while it's mounted and visible. */
function readPanel(): PanelState {
  const h = Number.parseFloat(document.documentElement.style.getPropertyValue("--debugsy-panel-h"));
  if (document.querySelector(".dbg-root") && h > 0) {
    panelSeen = true;
    return h <= TRAY_MAX_PX ? "tray" : "open";
  }
  // Until the panel has mounted once, it is about to open (desktop mounts it open).
  return panelSeen ? "closed" : "open";
}

function subscribePanel(onChange: () => void): () => void {
  let frame = 0;
  const later = (): void => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(onChange);
  };
  const mo = new MutationObserver(later);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["style"] });
  mo.observe(document.body, { childList: true, subtree: true });
  return () => {
    mo.disconnect();
    cancelAnimationFrame(frame);
  };
}

const noSubscribe = (): (() => void) => () => {};

function isMac(): boolean {
  const uad = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData;
  const platform = [uad?.platform, navigator.platform, navigator.userAgent].find((p) => p && p.length > 0);
  return platform ? MAC.test(platform) : true;
}

interface KeyDef {
  readonly id: "d" | "k" | "esc";
  readonly eventKey: string;
  readonly meta: boolean;
  readonly letter: string;
  readonly front: string;
}

const KEYS: readonly KeyDef[] = [
  { id: "d", eventKey: "d", meta: true, letter: "D", front: "PANEL" },
  { id: "k", eventKey: "k", meta: true, letter: "K", front: "CLEAR" },
  { id: "esc", eventKey: "Escape", meta: false, letter: "esc", front: "CLOSE" },
];

/** Send the keydown the panel's own shortcut listener handles (it accepts ⌘ or Ctrl). */
function press(k: KeyDef): void {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: k.eventKey, metaKey: k.meta, ctrlKey: k.meta, bubbles: true, cancelable: true }),
  );
}

function keyLabel(k: KeyDef, mod: string, panel: PanelState, logs: number, off: boolean): string {
  const name = k.meta ? `${mod} ${k.letter}` : "Escape";
  if (k.id === "d") {
    const now = panel === "open" ? "the full panel is open" : panel === "tray" ? "the panel shows its tray" : "the panel is closed";
    const next = panel === "open" ? "fold it to its tray" : panel === "tray" ? "open the full panel" : "show its tray";
    return `${name}: ${now}; press to ${next}`;
  }
  if (k.id === "k") {
    if (!off) return `${name}: clear the log (${logs} ${logs === 1 ? "line" : "lines"})`;
    return `${name}: clear the log (${panel === "closed" ? "the panel is closed" : "nothing to clear"})`;
  }
  return off ? `${name}: close the panel (already closed)` : `${name}: close the panel`;
}

export function PanelKeys(): React.ReactElement {
  const panel = useSyncExternalStore(subscribePanel, readPanel, () => "open" as PanelState);
  const mac = useSyncExternalStore(noSubscribe, isMac, () => true);
  const hydrated = useSyncExternalStore(noSubscribe, () => true, () => false);
  useDebugSubscription();
  // The sample is logged before hydration, so the server's count matches the first client render.
  const logs = hydrated ? getDebugsy().getLogs().length : SAMPLE_LOG_COUNT;
  const mod = mac ? "⌘" : "Ctrl";

  // A real key press dips the matching cap on screen too.
  const [pressed, setPressed] = useState<KeyDef["id"] | null>(null);
  useEffect(() => {
    let t = 0;
    const onKey = (e: KeyboardEvent): void => {
      const k = e.key.toLowerCase();
      const id = (e.metaKey || e.ctrlKey) && k === "d" ? "d" : (e.metaKey || e.ctrlKey) && k === "k" ? "k" : e.key === "Escape" ? "esc" : null;
      if (!id || !e.isTrusted) return;
      window.clearTimeout(t);
      setPressed(id);
      t = window.setTimeout(() => setPressed(null), 160);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="g-keys" role="group" aria-label="the live panel's keys">
      <svg width="0" height="0" className="g-cap-defs" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="g-cap-face" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#404145" />
            <stop offset="1" stopColor="#28292c" />
          </linearGradient>
        </defs>
      </svg>
      {KEYS.map((k) => {
        const off = k.id === "esc" ? panel === "closed" : k.id === "k" ? panel === "closed" || logs === 0 : false;
        const latched = k.id === "d" && panel !== "closed";
        const lit = k.id === "d" && panel === "open";
        const legend = k.meta ? `${mod}${mac ? "" : " "}${k.letter}` : k.letter;
        const label = keyLabel(k, mod, panel, logs, off);
        const cls = ["g-pkey", latched ? "is-latched" : "", lit ? "is-lit" : "", pressed === k.id ? "is-pressed" : ""]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={k.id}
            type="button"
            className={cls}
            aria-disabled={off}
            aria-pressed={k.id === "d" ? latched : undefined}
            aria-label={label}
            title={label}
            onClick={() => {
              if (!off) press(k);
            }}
          >
            <svg className="g-cap" viewBox="0 0 64 58" aria-hidden="true" focusable="false">
              <rect className="g-cap-shade" x="2" y="8" width="62" height="50" rx="9" />
              <rect className="g-cap-wall" x="1" y="4" width="62" height="50" rx="9" />
              <rect className="g-cap-front" x="1.5" y="38" width="61" height="15.5" rx="8" />
              <text className="g-cap-fleg" x="32" y="49.5">
                {k.front}
              </text>
              <g className="g-cap-top">
                <rect className="g-cap-face" x="7" y="2" width="50" height="34" rx="7" />
                <text className="g-cap-leg" x="32" y="23">
                  {legend}
                </text>
              </g>
              {k.id === "d" ? <circle className="g-cap-led" cx="54" cy="45.8" r="2.2" /> : null}
            </svg>
          </button>
        );
      })}
    </div>
  );
}
