"use client";

import React from "react";

export interface TerminalLayoutStatItemProps {
  label: string;
  value: string | number;
  /** Value color - defaults to CSS --color-accent */
  color?: string;
  /** Label color - defaults to CSS --color-text-secondary */
  labelColor?: string;
}

/**
 * TerminalLayoutStatItem - Individual stat display primitive
 *
 * Uses CSS variables for theming:
 * - Label: --color-text-secondary (default) — readable on both dark and
 *   light themes. The previous `--color-text-muted` default resolved to
 *   stone-400 / gray-300 on light themes (parchment / daylight), which
 *   was near-invisible on the cream / white panel surface.
 * - Value: --color-accent (default), or pass a theme-aware token via
 *   `color` (e.g. `rgb(var(--color-success))`). Avoid hard-coded hex
 *   values — they bypass theming and wash out on light backgrounds.
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutStatItem
 *   label="Logs"
 *   value={2742}
 *   color="rgb(var(--color-info))"
 * />
 * ```
 */
export const TerminalLayoutStatItem: React.FC<TerminalLayoutStatItemProps> = ({
  label,
  value,
  color,
  labelColor,
}) => {
  return (
    <div
      style={{ display: "flex", justifyContent: "space-between", gap: "8px" }}
    >
      <span style={{ color: labelColor ?? "rgb(var(--color-text-secondary))" }}>
        {label}:
      </span>
      <span
        style={{
          color: color ?? "rgb(var(--color-accent))",
          fontWeight: 600,
        }}
      >
        {value}
      </span>
    </div>
  );
};

TerminalLayoutStatItem.displayName = "TerminalLayoutStatItem";
