"use client";

import type React from "react";
import { useSyncExternalStore } from "react";
import { type Skin, SKIN_STORAGE_KEY } from "./skin";

const EVENT = "debugsy-site:skin";

function read(): Skin {
  return document.documentElement.dataset.skin === "dark" ? "dark" : "light";
}

function subscribe(onChange: () => void): () => void {
  window.addEventListener(EVENT, onChange);
  return () => window.removeEventListener(EVENT, onChange);
}

function apply(skin: Skin): void {
  document.documentElement.dataset.skin = skin;
  try {
    localStorage.setItem(SKIN_STORAGE_KEY, skin);
  } catch {
    // Private windows and blocked storage: the skin still applies for this page.
  }
  window.dispatchEvent(new Event(EVENT));
}

/** The light/dark switch in the top bar and the footer. The server renders "light"; the client reads the real one. */
export function SkinToggle(): React.ReactElement {
  const skin = useSyncExternalStore(subscribe, read, () => "light" as Skin);
  const other: Skin = skin === "light" ? "dark" : "light";
  return (
    <button
      type="button"
      className="g-skin"
      onClick={() => apply(other)}
      aria-label={`Skin: ${skin}. Switch to ${other}`}
    >
      <span className="g-skin-dot" aria-hidden="true" />
      <span className="g-skin-name">{skin}</span>
    </button>
  );
}
