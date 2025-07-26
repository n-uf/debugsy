"use client";

import React, { useCallback, useMemo, useState } from "react";
// Add import for react18-json-view
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import {
  LOG_STYLES,
  formatDataForDisplay,
  formatPointName,
  getLogEntryBackgroundColor,
  getPointEmoji,
  memoizedJsonStringify,
} from "../utils/log-utilities";
import { formatTime } from "./health-log-formatter";

/**
 * Severity levels for log entries
 */
export type LogSeverity = "info" | "warn" | "error" | "critical" | "success";

/**
 * Props for the DefaultLogFormatter component
 */
export interface DefaultLogFormatterProps {
  log: DebugLogEntry;
  index: number;
  severity?: LogSeverity;
  showExpandButton?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  expandedContent?: React.ReactNode;
}

/**
 * Get severity-based styling
 */
const getSeverityStyle = (severity: LogSeverity) => {
  switch (severity) {
    case "error":
      return {
        borderLeft: "3px solid #ef4444",
        backgroundColor: "#7f1d1d11",
        messageColor: "#fca5a5",
      };
    case "critical":
      return {
        borderLeft: "3px solid #dc2626",
        backgroundColor: "#7f1d1d22",
        messageColor: "#fee2e2",
        boxShadow: "0 0 8px #dc262633",
      };
    case "warn":
      return {
        borderLeft: "3px solid #f59e0b",
        backgroundColor: "#92400e11",
        messageColor: "#fbbf24",
      };
    case "success":
      return {
        borderLeft: "3px solid #10b981",
        backgroundColor: "#065f4611",
        messageColor: "#6ee7b7",
      };
    case "info":
    default:
      return {
        borderLeft: "3px solid #6b7280", // Gray left border by default
        backgroundColor: "transparent",
        messageColor: "#e5e7eb",
      };
  }
};

/**
 * Get severity emoji
 */
const getSeverityEmoji = (severity: LogSeverity): string => {
  switch (severity) {
    case "critical":
      return "🚨";
    case "error":
      return ""; // Removed red cross emoji
    case "warn":
      return ""; // Removed warning emoji
    case "success":
      return "✅";
    case "info":
    default:
      return "";
  }
};

/**
 * Optimized expanded content renderer with efficient large JSON handling
 * Memoized to prevent unnecessary re-renders and expensive JSON processing
 */
const DefaultExpandedContent: React.FC<{ log: DebugLogEntry }> = React.memo(
  ({ log }) => {
    const [copyState, setCopyState] = useState<"idle" | "copying" | "copied">(
      "idle"
    );

    // Memoize the JSON string to prevent repeated stringification
    const jsonString = useMemo(() => {
      if (!log.data) return null;
      return memoizedJsonStringify(log.data, 2);
    }, [log.data]);

    // Memoize the copy handler to prevent function recreation
    const handleCopyJson = useCallback(async () => {
      if (!jsonString) return;

      try {
        setCopyState("copying");
        await navigator.clipboard.writeText(jsonString);
        setCopyState("copied");

        // Reset after 2 seconds
        setTimeout(() => setCopyState("idle"), 2000);
      } catch (error) {
        console.error("Failed to copy JSON:", error);
        setCopyState("idle");
      }
    }, [jsonString]);

    if (!log.data) {
      return (
        <div style={{ color: "#9ca3af", fontSize: "9px", fontStyle: "italic" }}>
          No additional data available
        </div>
      );
    }

    const getCopyButtonContent = () => {
      switch (copyState) {
        case "copying":
          return "📋 Copying...";
        case "copied":
          return "✅ Copied!";
        default:
          return "📋 Copy JSON";
      }
    };

    const getCopyButtonStyle = () => ({
      fontSize: "8px",
      padding: "2px 6px",
      backgroundColor: copyState === "copied" ? "#065f4622" : "#374151",
      color: copyState === "copied" ? "#6ee7b7" : "#d1d5db",
      border: `1px solid ${copyState === "copied" ? "#065f46" : "#4b5563"}`,
      borderRadius: "2px",
      cursor: copyState === "copying" ? "not-allowed" : "pointer",
      fontFamily: "monospace",
      transition: "all 0.2s ease",
      opacity: copyState === "copying" ? 0.6 : 1,
    });

    return (
      <div style={{ fontFamily: "monospace" }}>
        {/* Data Header with Copy Button */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: "4px",
          }}
        >
          <div
            style={{ color: "#60a5fa", fontWeight: "bold", fontSize: "9px" }}
          >
            📊 Log Data:
          </div>
          <button
            onClick={handleCopyJson}
            disabled={copyState === "copying"}
            style={getCopyButtonStyle()}
          >
            {getCopyButtonContent()}
          </button>
        </div>

        {/* Efficient JSON Viewer for Large Data */}
        <div
          style={{
            backgroundColor: "#0f172a22",
            padding: "6px 8px",
            borderRadius: "3px",
            overflow: "auto",
            maxHeight: "300px", // Increased height for better viewing
            border: "1px solid #374151",
          }}
        >
          <JsonView
            src={log.data}
            collapsed={2} // Collapse at depth 2 for performance
            collapseObjectsAfterLength={20} // Collapse large objects automatically
            collapseStringsAfterLength={100} // Truncate long strings
            ignoreLargeArray={false} // Handle large arrays efficiently
            enableClipboard={false} // Disable internal clipboard (we have our own)
            displayArrayIndex={true}
            displaySize={true}
            style={{
              fontSize: "10px",
              fontFamily: "monospace",
              backgroundColor: "transparent",
            }}
            theme="default" // You can use "dark" theme if preferred
          />
        </div>
      </div>
    );
  }
);

DefaultExpandedContent.displayName = "DefaultExpandedContent";

/**
 * Optimized default formatter for debug log entries with performance enhancements
 * Memoized to prevent unnecessary re-renders of expensive JSON operations
 */
export const DefaultLogFormatter: React.FC<DefaultLogFormatterProps> =
  React.memo(
    ({
      log,
      index,
      severity = "info",
      showExpandButton,
      isExpanded = false,
      onToggleExpand,
      expandedContent,
    }) => {
      const [internalExpanded, setInternalExpanded] = useState(false);

      // Memoize expensive computations to prevent recalculation on every render
      const severityStyle = useMemo(
        () => getSeverityStyle(severity as LogSeverity),
        [severity]
      );
      const severityEmoji = useMemo(
        () => getSeverityEmoji(severity as LogSeverity),
        [severity]
      );

      // Memoize formatted data display to prevent repeated JSON stringification
      const formattedDataDisplay = useMemo(() => {
        if (!log.data) return null;
        return formatDataForDisplay(log.data, 1000);
      }, [log.data]);

      // Memoize tooltip JSON string to prevent repeated stringification
      const tooltipJsonString = useMemo(() => {
        if (!log.data) return "";
        return memoizedJsonStringify(log.data);
      }, [log.data]);

      // Determine if we should show expand button: explicit prop or if there's data
      const shouldShowExpand = useMemo(() => {
        return showExpandButton !== undefined ? showExpandButton : !!log.data;
      }, [showExpandButton, log.data]);

      // Use internal state if no external control provided
      const isCurrentlyExpanded = onToggleExpand
        ? isExpanded
        : internalExpanded;
      const handleToggle =
        onToggleExpand || (() => setInternalExpanded(!internalExpanded));

      // Use provided expanded content or default optimized component
      const contentToShow = expandedContent || (
        <DefaultExpandedContent log={log} />
      );

      return (
        <div>
          {/* Base log entry */}
          <div
            style={{
              ...LOG_STYLES.logEntry,
              backgroundColor:
                severityStyle.backgroundColor ||
                getLogEntryBackgroundColor(index),
              borderLeft: severityStyle.borderLeft,
              boxShadow: severityStyle.boxShadow,
              cursor: shouldShowExpand ? "pointer" : "default",
              transition: "all 0.2s ease",
            }}
            onClick={shouldShowExpand ? handleToggle : undefined}
          >
            {/* Expand/Collapse Button */}
            {shouldShowExpand && (
              <span
                style={{
                  fontSize: "10px",
                  color: "#9ca3af",
                  marginRight: "4px",
                  minWidth: "12px",
                  textAlign: "center",
                }}
              >
                {isCurrentlyExpanded ? "▼" : "▶"}
              </span>
            )}

            {/* Severity Indicator */}
            {severityEmoji && (
              <span
                style={{
                  fontSize: "10px",
                  marginRight: "4px",
                }}
              >
                {severityEmoji}
              </span>
            )}

            {/* Timestamp */}
            <span style={LOG_STYLES.timestamp}>
              {formatTime(log.timestamp).slice(-8)}
            </span>

            {/* Debug Point */}
            <span style={LOG_STYLES.debugPoint}>
              <span style={{ fontSize: "9px" }}>
                {getPointEmoji(log.point)}
              </span>
              <span
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: "40px",
                }}
              >
                {formatPointName(log.point)}
              </span>
            </span>

            {/* Message and Data */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                flex: 1,
                minWidth: 0,
                overflow: "visible", // Allow full width display for data
              }}
            >
              {/* Log Message */}
              <span
                style={{
                  ...LOG_STYLES.message,
                  color: severityStyle.messageColor,
                }}
                title={log.message}
              >
                {log.message}
              </span>

              {/* Log Data (if present) - show preview in collapsed state */}
              {log.data && (
                <span style={LOG_STYLES.data} title={tooltipJsonString}>
                  {formattedDataDisplay}{" "}
                  {/* Constrain collapsed JSON to 1000 chars */}
                </span>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          {shouldShowExpand && isCurrentlyExpanded && (
            <div
              style={{
                marginTop: "4px",
                marginLeft: "16px",
                borderLeft: `2px solid ${severity === "info" ? "#6b7280" : severityStyle.borderLeft?.split(" ")[2]}`,
                paddingLeft: "8px",
                backgroundColor: severityStyle.backgroundColor,
                borderRadius: "0 4px 4px 0",
              }}
            >
              {contentToShow}
            </div>
          )}
        </div>
      );
    }
  );

DefaultLogFormatter.displayName = "DefaultLogFormatter";
