"use client";

import React, { useCallback } from "react";
import { LOG_RENDERING_CONFIG, LOG_STYLES } from "../utils/log-utilities";

/**
 * Truncation Info Panel Component with action buttons
 */
export interface TruncationInfoPanelProps {
  truncationInfo: {
    isLogsTruncated: boolean;
    hiddenLogsCount: number;
    maxRendered: number;
  };
  totalLogs: number;
  renderedLogs: number;
  onClearLogs: () => void;
  onCopyAllLogs: () => void;
}

export const TruncationInfoPanel: React.FC<TruncationInfoPanelProps> =
  React.memo(
    ({
      truncationInfo,
      totalLogs,
      renderedLogs,
      onClearLogs,
      onCopyAllLogs,
    }) => {
      if (!truncationInfo.isLogsTruncated) return null;

      const handleClearClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          onClearLogs();
        },
        [onClearLogs]
      );

      const handleCopyAllClick = useCallback(
        (e: React.MouseEvent) => {
          e.stopPropagation();
          onCopyAllLogs();
        },
        [onCopyAllLogs]
      );

      return (
        <div
          style={{
            ...LOG_STYLES.truncationWarning,
            marginTop: "12px",
            marginBottom: "4px", // Reduced from 32px to just 4px
            position: "relative",
            zIndex: 1,
            backgroundColor: "#78350f33",
            border: "2px solid #fbbf24",
            fontWeight: "bold",
            boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 12px",
            minHeight: "44px",
          }}
        >
          <div style={{ flex: 1 }}>
            <div>
              ⚠️ Showing latest {LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS} of{" "}
              {totalLogs} logs (performance limit)
            </div>
            <div style={{ fontSize: "8px", marginTop: "2px", opacity: 0.7 }}>
              [DEBUG: {renderedLogs} rendered, {truncationInfo.hiddenLogsCount}{" "}
              hidden]
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
            {/* Copy All Logs Button - transparent style */}
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

            {/* Clear Logs Button - transparent style */}
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
          </div>
        </div>
      );
    }
  );

TruncationInfoPanel.displayName = "TruncationInfoPanel";
