"use client";

import React from "react";

export interface TerminalLayoutSettingsProps {
  /** Section title (default: "Settings:") */
  title?: string;
  /** Child components (IndicatorButtonGroup) */
  children: React.ReactNode;
  /** Hide bottom border (default: false) */
  noBorder?: boolean;
}

/**
 * TerminalLayoutSettings - Container for settings (exactly like Quick Resize)
 *
 * Uses CSS variables for theming:
 * - Title: --color-text-secondary
 * - Border: --color-border-primary
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutSettings>
 *   <IndicatorButtonGroup
 *     wrap={true}
 *     justify="flex-start"
 *     buttons={[...]}
 *   />
 * </TerminalLayoutSettings>
 * ```
 */
export const TerminalLayoutSettings: React.FC<TerminalLayoutSettingsProps> = ({
  title = "Settings:",
  children,
  noBorder = false,
}) => {
  return (
    <div
      style={{
        padding: "8px",
        ...(noBorder ? {} : { borderBottom: "1px solid rgb(var(--color-border-primary))" }),
      }}
    >
      <div
        style={{
          fontSize: "10px",
          fontFamily: "monospace",
          color: "rgb(var(--color-text-secondary))",
          marginBottom: "4px",
          fontWeight: "bold",
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
};

TerminalLayoutSettings.displayName = "TerminalLayoutSettings";

