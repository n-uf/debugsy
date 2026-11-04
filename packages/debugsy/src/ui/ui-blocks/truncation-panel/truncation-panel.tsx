"use client";

import React, { useCallback } from "react";

export interface TruncationPanelProps {
  hiddenCount?: number;
  totalCount?: number;
  maxRendered?: number;
  renderedCount?: number;
  onCopyAll?: () => void;
  onClearAll?: () => void;
}

/**
 * TruncationPanel - Warning panel for truncated logs (matches debugsy design)
 *
 * Usage:
 * ```tsx
 * <TruncationPanel
 *   hiddenCount={566}
 *   totalCount={966}
 *   maxRendered={400}
 *   renderedCount={408}
 *   onCopyAll={handleCopyAll}
 *   onClearAll={handleClearAll}
 * />
 * ```
 */
export const TruncationPanel: React.FC<TruncationPanelProps> = ({
  hiddenCount = 0,
  totalCount = 0,
  maxRendered = 0,
  renderedCount,
  onCopyAll,
  onClearAll,
}) => {
  const handleClearClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onClearAll?.();
    },
    [onClearAll]
  );

  const handleCopyAllClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCopyAll?.();
    },
    [onCopyAll]
  );

  if (hiddenCount <= 0 || totalCount <= 0 || maxRendered <= 0) return null;

  return (
    <div
      style={{
        color: "#fbbf24",
        fontSize: "10px",
        textAlign: "center",
        fontFamily: "monospace",
        padding: "8px 12px",
        backgroundColor: "#78350f33",
        border: "2px solid #fbbf24",
        borderRadius: "3px",
        marginTop: "12px",
        marginBottom: "4px",
        fontWeight: "bold",
        boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        minHeight: "44px",
      }}
    >
      <div style={{ flex: 1, textAlign: "center" }}>
        <div>
          ⚠️ Showing latest {maxRendered} of {totalCount} logs (performance
          limit)
        </div>
        {renderedCount !== undefined && (
          <div style={{ fontSize: "8px", marginTop: "2px", opacity: 0.7 }}>
            [DEBUG: {renderedCount} rendered, {hiddenCount} hidden]
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
        {/* Copy All Logs Button - transparent style */}
        {onCopyAll && (
          <button
            onClick={handleCopyAllClick}
            style={{
              backgroundColor: "transparent",
              color: "#f59e0b", // Orange text to match panel theme
              border: "1px solid #f59e0b", // Orange border
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "9px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              height: "20px",
              minWidth: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f59e0b22"; // Light orange background on hover
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Copy all logs to clipboard"
          >
            Copy All
          </button>
        )}

        {/* Clear Logs Button - transparent style */}
        {onClearAll && (
          <button
            onClick={handleClearClick}
            style={{
              backgroundColor: "transparent",
              color: "#dc2626", // Red text
              border: "1px solid #dc2626", // Red border
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "9px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              height: "20px",
              minWidth: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc262622"; // Light red background on hover
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Clear all logs"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

TruncationPanel.displayName = "TruncationPanel";
