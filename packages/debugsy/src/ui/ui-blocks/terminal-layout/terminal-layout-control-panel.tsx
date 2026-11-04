"use client";

import React from "react";
import { Z_INDEX } from "../../tokens/z-index";

export interface TerminalLayoutControlPanelProps {
  children: React.ReactNode;
}

/**
 * TerminalLayoutControlPanel - Bottom control panel within TerminalLayout
 *
 * Positioned at the bottom of the TerminalLayout container (not viewport).
 * Part of the flex layout, so it doesn't overlap with TerminalLayoutBody.
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutControlPanel>
 *   <ControlPanel />
 * </TerminalLayoutControlPanel>
 * ```
 */
export const TerminalLayoutControlPanel: React.FC<
  TerminalLayoutControlPanelProps
> = ({ children }) => {
  return (
    <div
      style={{
        position: "relative",
        flexShrink: 0,
        zIndex: Z_INDEX.DEBUG_CONTROL_PANEL,
      }}
    >
      {children}
    </div>
  );
};

TerminalLayoutControlPanel.displayName = "TerminalLayoutControlPanel";

