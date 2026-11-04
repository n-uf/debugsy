"use client";

import React from "react";
import { useTerminalLayoutContext } from "./terminal-layout";

export interface TerminalLayoutHeaderProps {
  children?: React.ReactNode;
  backgroundColor?: string;
}

/**
 * TerminalLayoutHeader - Header bar with light background
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutHeader>
 *   <TerminalLayoutResizeHandle onResizeStart={handleResize} />
 * </TerminalLayoutHeader>
 * ```
 */
export const TerminalLayoutHeader: React.FC<TerminalLayoutHeaderProps> = ({
  children,
  backgroundColor,
}) => {
  const { borderColor } = useTerminalLayoutContext();

  return (
    <div
      style={{
        height: "12px",
        backgroundColor: backgroundColor ?? "rgb(var(--color-chrome-bg))",
        borderBottom: `1px solid ${borderColor ?? "rgb(var(--color-chrome-border))"}`,
        position: "relative",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "visible",
      }}
    >
      {children}
    </div>
  );
};

TerminalLayoutHeader.displayName = "TerminalLayoutHeader";

