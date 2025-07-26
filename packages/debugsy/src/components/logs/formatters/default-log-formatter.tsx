"use client";

import React, { useMemo, useState } from "react";
// Add import for react18-json-view
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import {
  LOG_STYLES,
  formatDataForDisplay,
  formatPointName,
  getLogEntryBackgroundColor,
  getPointEmoji,
  isLikelyLargeObject,
} from "../utils/log-utilities";
import { getExpansionContent, getLogTypeMeta } from "./formatter-routing";
import { formatTime } from "./health-expansion-formatter";

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

// DefaultExpandedContent moved to separate file to avoid circular dependencies

// Routing functions moved to formatter-routing.ts for centralized configuration

/**
 * Optimized default formatter for debug log entries with performance enhancements
 * ENHANCED: Now supports automatic expansion routing to specialized formatters
 * PERFORMANCE: Uses hot registry for zero-overhead lookups
 * PERFORMANCE: Defers expensive operations for large objects in collapsed mode
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

      // Use internal state if no external control provided
      const isCurrentlyExpanded = onToggleExpand
        ? isExpanded
        : internalExpanded;
      const handleToggle =
        onToggleExpand || (() => setInternalExpanded(!internalExpanded));

      // OPTIMIZATION: Combined memoization with log-type-aware enhancements
      // PERFORMANCE: Uses hot registry for zero-overhead metadata lookup
      // PERFORMANCE FIX: Defer expensive JSON operations for large objects in collapsed mode
      const computedProps = useMemo(() => {
        // Get specialized log type metadata (ZERO-OVERHEAD with hot registry)
        const logTypeMeta = getLogTypeMeta(log);

        // Use specialized severity if available, otherwise use provided severity
        const effectiveSeverity =
          logTypeMeta?.severity || (severity as LogSeverity);

        // Severity-related computations
        const severityStyle = getSeverityStyle(effectiveSeverity);
        const severityEmoji = getSeverityEmoji(effectiveSeverity);

        // Use specialized expand behavior if available
        const shouldShowExpand =
          showExpandButton !== undefined
            ? showExpandButton
            : logTypeMeta?.shouldExpand !== undefined
              ? logTypeMeta.shouldExpand
              : !!log.data;

        // PERFORMANCE OPTIMIZATION: Early return for no data
        if (!log.data) {
          return {
            severityStyle,
            severityEmoji,
            formattedDataDisplay: null,
            tooltipJsonString: "",
            shouldShowExpand: false,
            effectiveSeverity,
            isLarge: false,
          };
        }

        // PERFORMANCE OPTIMIZATION: Fast large object detection (minimal overhead)
        const isLarge = isLikelyLargeObject(log.data);

        // PERFORMANCE FIX: For large objects in collapsed mode, skip expensive operations
        if (isLarge && !isCurrentlyExpanded) {
          return {
            severityStyle,
            severityEmoji,
            formattedDataDisplay: Array.isArray(log.data)
              ? `[Large Array: ${log.data.length} items]`
              : `[Large Object: ${Object.keys(log.data).length} keys]`,
            tooltipJsonString: "[Large Object: Click to expand for details]",
            shouldShowExpand,
            effectiveSeverity,
            isLarge: true,
          };
        }

        // PERFORMANCE OPTIMIZATION: For small/medium objects OR when expanded, do full processing
        let formattedDataDisplay = null;
        let tooltipJsonString = "";

        // Format display data (only for non-large objects or when expanded)
        formattedDataDisplay = formatDataForDisplay(log.data, 1000);

        // Generate tooltip string (optimized path)
        if (isLarge) {
          tooltipJsonString = "[Large Object: Click to expand for details]";
        } else {
          // For smaller objects, use memoized stringify but with shorter length for tooltips
          try {
            const preview = formatDataForDisplay(log.data, 500);
            tooltipJsonString =
              preview.length > 500
                ? preview.substring(0, 500) + "..."
                : preview;
          } catch {
            tooltipJsonString = "[Object: Click to expand for details]";
          }
        }

        return {
          severityStyle,
          severityEmoji,
          formattedDataDisplay,
          tooltipJsonString,
          shouldShowExpand,
          effectiveSeverity,
          isLarge,
        };
      }, [
        severity,
        log.data,
        log.point,
        showExpandButton,
        isCurrentlyExpanded,
      ]);

      // OPTIMIZED: Route to appropriate expansion content based on log type
      // PERFORMANCE: Uses hot registry for zero-overhead component lookup
      const contentToShow = expandedContent || getExpansionContent(log);

      return (
        <div>
          {/* Base log entry */}
          <div
            style={{
              ...LOG_STYLES.logEntry,
              backgroundColor:
                computedProps.severityStyle.backgroundColor ||
                getLogEntryBackgroundColor(index),
              borderLeft: computedProps.severityStyle.borderLeft,
              boxShadow: computedProps.severityStyle.boxShadow,
              cursor: computedProps.shouldShowExpand ? "pointer" : "default",
              transition: "all 0.2s ease",
            }}
            onClick={computedProps.shouldShowExpand ? handleToggle : undefined}
          >
            {/* Expand/Collapse Button */}
            {computedProps.shouldShowExpand && (
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
            {computedProps.severityEmoji && (
              <span
                style={{
                  fontSize: "10px",
                  marginRight: "4px",
                }}
              >
                {computedProps.severityEmoji}
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
                  color: computedProps.severityStyle.messageColor,
                }}
                title={log.message}
              >
                {log.message}
              </span>

              {/* Log Data (if present) - show preview in collapsed state */}
              {log.data && (
                <span
                  style={LOG_STYLES.data}
                  title={computedProps.tooltipJsonString}
                >
                  {computedProps.formattedDataDisplay}{" "}
                  {/* Constrain collapsed JSON to 1000 chars */}
                </span>
              )}
            </div>
          </div>

          {/* Expanded Content */}
          {computedProps.shouldShowExpand && isCurrentlyExpanded && (
            <div
              style={{
                marginTop: "4px",
                marginLeft: "16px",
                borderLeft: `2px solid ${severity === "info" ? "#6b7280" : computedProps.severityStyle.borderLeft?.split(" ")[2]}`,
                paddingLeft: "8px",
                backgroundColor: computedProps.severityStyle.backgroundColor,
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
