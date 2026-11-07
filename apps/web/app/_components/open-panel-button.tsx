"use client";

import type React from "react";

/** The event DebugsyLookMounted listens for: mount the live panel on a phone or tablet. */
export const OPEN_PANEL_EVENT = "debugsy-site:open-panel";

export function OpenPanelButton(): React.ReactElement {
  return (
    <button
      type="button"
      className="g-btn g-btn-pri"
      onClick={() => window.dispatchEvent(new Event(OPEN_PANEL_EVENT))}
    >
      Open the live panel
    </button>
  );
}
