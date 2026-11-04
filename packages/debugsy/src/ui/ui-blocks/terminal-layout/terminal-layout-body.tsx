"use client";

import React from "react";
import { useTerminalLayoutContext } from "./terminal-layout";

export interface TerminalLayoutBodyProps {
  children: React.ReactNode;
}

/**
 * TerminalLayoutBody - Horizontal wrapper for content area and sidebar
 *
 * Gets its height from the TerminalLayout context (bodyHeight prop).
 * This allows the resize to only affect the body, not the entire layout.
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutBody>
 *   <TerminalLayoutContent>...</TerminalLayoutContent>
 *   <TerminalLayoutSidebar>...</TerminalLayoutSidebar>
 * </TerminalLayoutBody>
 * ```
 */
export const TerminalLayoutBody: React.FC<TerminalLayoutBodyProps> = ({
  children,
}) => {
  const { bodyHeight } = useTerminalLayoutContext();

  return (
    <div
      style={{
        height: `${bodyHeight}px`,
        flexShrink: 0,
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {children}
    </div>
  );
};

TerminalLayoutBody.displayName = "TerminalLayoutBody";

