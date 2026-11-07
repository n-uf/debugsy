"use client";

import type React from "react";

/** The event DebugsyLookMounted listens for: mount the live panel on a phone or tablet. */
export const OPEN_PANEL_EVENT = "debugsy-site:open-panel";

/** Mounts the live panel on a phone or tablet (where it isn't part of the page until asked). */
export function OpenPanelButton({
  className,
  children,
}: {
  readonly className: string;
  readonly children: React.ReactNode;
}): React.ReactElement {
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(OPEN_PANEL_EVENT))}
    >
      {children}
    </button>
  );
}
