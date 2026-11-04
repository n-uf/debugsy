"use client";

import React, { useRef } from "react";

export interface TerminalLayoutResizePresetsProps {
  presets: number[];
  currentHeight: number;
  maxHeight: number;
  onResize: (height: number) => void;
  title?: string;
}

/**
 * TerminalLayoutResizePresets - Quick resize buttons for panel height
 *
 * Uses CSS variables for theming:
 * - Title: --color-text-secondary
 * - Border: --color-border-primary
 * - Active button: --color-accent (bg), --color-text-inverse (text)
 * - Inactive button: --color-chrome-button (bg), --color-text-secondary (text)
 * - Hover: --color-chrome-button-hover
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutResizePresets
 *   title="Quick Resize"
 *   presets={[0, 200, 300, 400, 600, 800]}
 *   currentHeight={panelHeight}
 *   maxHeight={MAX_HEIGHT}
 *   onResize={setPanelHeight}
 * />
 * ```
 */
export const TerminalLayoutResizePresets: React.FC<
  TerminalLayoutResizePresetsProps
> = ({
  presets,
  currentHeight,
  maxHeight,
  onResize,
  title = "Quick Resize:",
}) => {
  // Store refs for each button to handle hover state properly
  const buttonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid rgb(var(--color-border-primary))",
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
      <div
        style={{
          display: "flex",
          gap: "3px",
          flexWrap: "wrap",
        }}
      >
        {presets.map((height) => {
          const isActive = currentHeight === height;
          return (
            <button
              key={height}
              ref={(el) => {
                if (el) buttonRefs.current.set(height, el);
              }}
              onClick={() => onResize(Math.min(height, maxHeight))}
              style={{
                backgroundColor: isActive
                  ? "rgb(var(--color-accent))"
                  : "rgb(var(--color-chrome-button))",
                color: isActive
                  ? "rgb(var(--color-text-inverse))"
                  : "rgb(var(--color-text-secondary))",
                border: "none",
                borderRadius: "3px",
                padding: "3px 6px",
                fontSize: "9px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgb(var(--color-chrome-button-hover))";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "rgb(var(--color-chrome-button))";
                }
              }}
              title={`Resize panel to ${height}px`}
            >
              {height}px
            </button>
          );
        })}
      </div>
    </div>
  );
};

TerminalLayoutResizePresets.displayName = "TerminalLayoutResizePresets";

