"use client";

import React from "react";

export interface TerminalLayoutShortcutProps {
  keys: string;
  description: string;
  /** Keys color - defaults to CSS --color-accent */
  keysColor?: string;
  /** Text color - defaults to CSS --color-text-secondary */
  textColor?: string;
  /** Optional click handler for interactive shortcuts */
  onClick?: () => void;
}

/**
 * TerminalLayoutShortcut - Individual keyboard shortcut display primitive
 *
 * Uses CSS variables for theming:
 * - Keys: --color-accent (default), rendered semi-bold for emphasis
 * - Text: --color-text-secondary (default) — readable on both dark and
 *   light themes. The previous `--color-text-muted` default resolved to
 *   stone-400 / gray-300 on light themes (parchment / daylight), which
 *   was near-invisible on the cream / white panel surface.
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutShortcut
 *   keys="⌘+D"
 *   description="Compact/Extend"
 *   onClick={() => handleShortcut()}
 * />
 * ```
 */
export const TerminalLayoutShortcut: React.FC<TerminalLayoutShortcutProps> = ({
  keys,
  description,
  keysColor,
  textColor,
  onClick,
}) => {
  const resolvedKeysColor = keysColor ?? "rgb(var(--color-accent))";
  const resolvedTextColor = textColor ?? "rgb(var(--color-text-secondary))";

  const content = (
    <>
      <span style={{ color: resolvedKeysColor, fontWeight: 600 }}>{keys}</span>{" "}
      {description}
    </>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          color: resolvedTextColor,
          textAlign: "center",
          background: "none",
          border: "none",
          padding: 0,
          cursor: "pointer",
          font: "inherit",
          width: "100%",
        }}
      >
        {content}
      </button>
    );
  }

  return (
    <div style={{ color: resolvedTextColor, textAlign: "center" }}>
      {content}
    </div>
  );
};

TerminalLayoutShortcut.displayName = "TerminalLayoutShortcut";
