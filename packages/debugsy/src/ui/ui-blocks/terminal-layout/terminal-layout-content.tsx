"use client";

import React from "react";

export interface TerminalLayoutContentProps {
  children: React.ReactNode;
}

/**
 * TerminalLayoutContent - Main content area wrapper (grows to fill available space)
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutContent>
 *   <div>Main logs area</div>
 *   <TerminalLayoutActions>...</TerminalLayoutActions>
 * </TerminalLayoutContent>
 * ```
 */
export const TerminalLayoutContent: React.FC<TerminalLayoutContentProps> = ({
  children,
}) => {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  );
};

TerminalLayoutContent.displayName = "TerminalLayoutContent";

