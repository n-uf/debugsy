"use client";

import React from "react";

export interface TerminalLayoutActionsProps {
  children: React.ReactNode;
}

/**
 * TerminalLayoutActions - Actions panel wrapper (right side of content)
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutActions>
 *   <ActionsPanel />
 * </TerminalLayoutActions>
 * ```
 */
export const TerminalLayoutActions: React.FC<TerminalLayoutActionsProps> = ({
  children,
}) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        flexShrink: 0,
      }}
    >
      {children}
    </div>
  );
};

TerminalLayoutActions.displayName = "TerminalLayoutActions";

