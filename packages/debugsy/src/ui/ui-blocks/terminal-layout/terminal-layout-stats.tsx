"use client";

import React from "react";

export interface TerminalLayoutStatsProps {
  title?: string;
  children: React.ReactNode;
  onTitleClick?: () => void;
  titleStyle?: React.CSSProperties;
}

/**
 * TerminalLayoutStats - Container for stat items
 *
 * Uses CSS variables for theming:
 * - Title: --color-text-secondary
 * - Border: --color-border-primary
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutStats title="Info">
 *   <TerminalLayoutStatItem label="Logs" value={2742} />
 *   <TerminalLayoutStatItem label="Points" value={2} />
 * </TerminalLayoutStats>
 * ```
 */
export const TerminalLayoutStats: React.FC<TerminalLayoutStatsProps> = ({
  title = "Stats:",
  children,
  onTitleClick,
  titleStyle,
}) => {
  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid rgb(var(--color-border-primary))",
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
          gap: "2px",
          fontSize: "10px",
          fontFamily: "monospace",
        }}
      >
        {children}
      </div>
    </div>
  );
};

TerminalLayoutStats.displayName = "TerminalLayoutStats";
