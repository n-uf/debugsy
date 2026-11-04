"use client";

import React from "react";

export interface TerminalLayoutShortcutsProps {
  title?: string;
  children: React.ReactNode;
  onTitleClick?: () => void;
  titleStyle?: React.CSSProperties;
}

/**
 * TerminalLayoutShortcuts - Container for keyboard shortcuts
 *
 * Uses CSS variables for theming:
 * - Title: --color-text-secondary
 * - Border: --color-border-primary
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutShortcuts title="Shortcuts">
 *   <TerminalLayoutShortcut keys="⌘+D" description="Compact/Extend" />
 *   <TerminalLayoutShortcut keys="Esc" description="Close panel" />
 * </TerminalLayoutShortcuts>
 * ```
 */
export const TerminalLayoutShortcuts: React.FC<
  TerminalLayoutShortcutsProps
> = ({ title = "Shortcuts:", children, onTitleClick, titleStyle }) => {
  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid rgb(var(--color-border-primary))",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {title && (
        <div
          onClick={onTitleClick}
          style={{
            fontSize: "10px",
            fontFamily: "monospace",
            color: "rgb(var(--color-text-secondary))",
            marginBottom: "4px",
            fontWeight: "bold",
            textAlign: "center",
            ...titleStyle,
          }}
        >
          {title}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          fontSize: "9px",
          fontFamily: "monospace",
        }}
      >
        {children}
      </div>
    </div>
  );
};

TerminalLayoutShortcuts.displayName = "TerminalLayoutShortcuts";

