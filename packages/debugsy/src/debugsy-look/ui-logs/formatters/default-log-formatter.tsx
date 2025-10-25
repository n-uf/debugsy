"use client";

import React, { useMemo, useState } from "react";
// Add import for react18-json-view
import "react18-json-view/src/style.css";
// Import useLongPress for better touch/mouse interaction
import { useLongPress } from "@uidotdev/usehooks";
import { Z_INDEX } from "@workspace/harbuz";
import type {
  DebugLogEntry,
  LogLevel,
} from "../../../debugsy-space/debugsy-constants";
import {
  type DepthSetting,
  processObjectForDisplay,
} from "../../../shared/object-depth-utils";
import { JsonUtils } from "../utils/json/json-utilities";
import {
  LOG_STYLES,
  formatDataForDisplay,
  formatPointName,
  getLogEntryBackgroundColor,
  getPointEmoji,
} from "../utils/log-utilities";
// Import the same copy function used by bulk copy for consistency
import { copyLogsToClipboard } from "../utils/copy-utilities";
import { getExpansionContent, getLogTypeMeta } from "./formatter-routing";
import { formatTime } from "./health-expansion-formatter";

/**
 * Severity levels for log entries (using unified LogLevel type)
 */
export type LogSeverity = LogLevel;

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
  depthSetting?: DepthSetting;
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
 * ENHANCED: Double-click to copy individual log entries to clipboard
 * PERFORMANCE: Uses hot registry for zero-overhead lookups
 * PERFORMANCE: Defers expensive operations for large objects in collapsed mode
 * Memoized to prevent unnecessary re-renders of expensive JSON operations
 */
export const DefaultLogFormatter: React.FC<DefaultLogFormatterProps> =
  React.memo(
    ({
      log,
      index,
      severity, // If not provided, will use log.level below
      showExpandButton,
      isExpanded = false,
      onToggleExpand,
      expandedContent,
      depthSetting = "all", // Default to no depth limits
    }) => {
      const [internalExpanded, setInternalExpanded] = useState(false);
      const [copyFeedback, setCopyFeedback] = useState(false);

      // Use internal state if no external control provided
      const isCurrentlyExpanded = onToggleExpand
        ? isExpanded
        : internalExpanded;
      const handleToggle =
        onToggleExpand || (() => setInternalExpanded(!internalExpanded));

      // Use the log's level as severity if no explicit severity is provided
      const effectiveSeverity = severity || (log.level as LogSeverity);

      // Handle long press to copy log entry - uses the same logic as bulk copy
      const handleLongPressCopy = async () => {
        try {
          // Use the EXACT same copy logic as bulk copy in debug-logs-list.tsx
          // This ensures 100% identical formatting for individual vs bulk operations
          await copyLogsToClipboard([log], depthSetting);

          // Show visual feedback
          setCopyFeedback(true);
          setTimeout(() => setCopyFeedback(false), 1500);

          console.log("📋 Log entry copied to clipboard");
        } catch (error) {
          console.error("Failed to copy log entry:", error);

          // Fallback: use the same approach as the main copy logic
          try {
            // Note: Still using the unified copy function for consistency
            const textArea = document.createElement("textarea");
            // Use formatLogForCopy directly as fallback, same as copyLogsToClipboard internals
            const { formatLogForCopy } = await import(
              "../utils/copy-utilities"
            );
            textArea.value = formatLogForCopy(log, depthSetting);
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);

            setCopyFeedback(true);
            setTimeout(() => setCopyFeedback(false), 1500);
            console.log("📋 Log entry copied using fallback method");
          } catch (fallbackError) {
            console.error("Fallback copy method also failed:", fallbackError);
          }
        }
      };

      // OPTIMIZATION: Combined memoization with log-type-aware enhancements
      // PERFORMANCE: Uses hot registry for zero-overhead metadata lookup
      // PERFORMANCE FIX: Defer expensive JSON operations for large objects in collapsed mode
      const computedProps = useMemo(() => {
        // Get specialized log type metadata (ZERO-OVERHEAD with hot registry)
        const logTypeMeta = getLogTypeMeta(log);

        // Use specialized severity if available, otherwise use effectiveSeverity
        const finalSeverity = logTypeMeta?.severity || effectiveSeverity;

        // Severity-related computations
        const severityStyle = getSeverityStyle(finalSeverity);
        const severityEmoji = getSeverityEmoji(finalSeverity);

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
            shouldShowExpand: false,
            effectiveSeverity: finalSeverity,
            isLarge: false,
          };
        }

        // DEPTH PROCESSING: Apply depth setting to log data before display
        const processedData = processObjectForDisplay(log.data, depthSetting);

        // OPTIMIZATION: MIGRATED: Uses JsonUtils.isComplex instead of isLikelyLargeObject
        const isComplex = JsonUtils.isComplex(processedData);
        const isLarge = isComplex; // Assuming isComplex implies large for now

        // PERFORMANCE FIX: For large objects in collapsed mode, skip expensive operations
        if (isLarge && !isCurrentlyExpanded) {
          return {
            severityStyle,
            severityEmoji,
            formattedDataDisplay: Array.isArray(processedData)
              ? `[Large Array: ${processedData.length} items]`
              : `[Large Object: ${Object.keys(processedData).length} keys]`,
            shouldShowExpand,
            effectiveSeverity: finalSeverity,
            isLarge: true,
          };
        }

        // PERFORMANCE OPTIMIZATION: For small/medium objects OR when expanded, do full processing
        const formattedDataDisplay = formatDataForDisplay(processedData, 1000);

        return {
          severityStyle,
          severityEmoji,
          formattedDataDisplay,
          shouldShowExpand,
          effectiveSeverity: finalSeverity,
          isLarge,
        };
      }, [
        effectiveSeverity,
        log.data,
        log.point,
        showExpandButton,
        isCurrentlyExpanded,
        depthSetting,
      ]);

      // Set up long press for copy functionality (after computedProps is available)
      const longPressAttrs = useLongPress(handleLongPressCopy, {
        threshold: 500, // 500ms for long press
        onStart: () => {
          // Optional: Could add visual feedback on press start
        },
        onCancel: () => {
          // Normal click behavior - toggle expand/collapse
          if (computedProps?.shouldShowExpand) {
            handleToggle();
          }
        },
      });

      // Get severity-based styling
      const severityStyle = useMemo(
        () => computedProps.severityStyle,
        [computedProps.severityStyle]
      );

      // Get severity emoji
      const severityEmoji = useMemo(
        () => computedProps.severityEmoji,
        [computedProps.severityEmoji]
      );

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
              cursor: computedProps.shouldShowExpand ? "pointer" : "text",
              transition: "all 0.2s ease",
              position: "relative",
              // Add subtle visual feedback for copy state
              ...(copyFeedback && {
                backgroundColor: "#10b98133",
                boxShadow: "0 0 8px #10b98144",
              }),
            }}
            {...longPressAttrs}
            title="🔸 Click to expand | 📋 Long-press to copy log entry"
          >
            {/* Copy Success Indicator */}
            {copyFeedback && (
              <div
                className="absolute top-0 right-1 pointer-events-none
                          px-1.5 py-0 rounded-lg text-xs font-medium tracking-wide whitespace-nowrap
                          text-emerald-400 bg-emerald-900/90 backdrop-blur-sm
                          border border-emerald-500/30 shadow-md"
                style={{ zIndex: Z_INDEX.DEBUG_LOGS_LIST + 10 }}
              >
                📋 Copied
              </div>
            )}

            {/* Expand/Collapse Button - Always render for consistent alignment */}
            <span
              style={{
                fontSize: "10px",
                color: computedProps.shouldShowExpand
                  ? "#9ca3af"
                  : "transparent",
                marginRight: "4px",
                minWidth: "12px",
                textAlign: "center",
                visibility: computedProps.shouldShowExpand
                  ? "visible"
                  : "hidden",
              }}
            >
              {computedProps.shouldShowExpand
                ? isCurrentlyExpanded
                  ? "▼"
                  : "▶"
                : "▶"}
            </span>

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
                <span style={LOG_STYLES.data}>
                  {computedProps.formattedDataDisplay}
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
