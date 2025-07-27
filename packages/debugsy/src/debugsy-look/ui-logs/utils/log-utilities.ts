/**
 * Core log utilities for debug log rendering and display
 *
 * This module handles log-specific operations like rendering configuration,
 * emoji mapping, and log preparation. JSON-related functionality has been
 * moved to dedicated json-utilities modules.
 */

// Import unified debug point configuration
import { getDebugPointEmoji } from "../../../debugsy-shared/debug-constants";

/**
 * Rendering configuration constants for debug logs
 */
export const LOG_RENDERING_CONFIG = {
  MAX_RENDERED_LOGS: 400, // Higher limit supported by virtualization
  COPY_PARTIAL_COUNT: 200, // Number of logs to copy on first click
} as const;

/**
 * Get emoji for a debug point - unified function from debug-constants
 * @deprecated Use getDebugPointEmoji directly from debug-constants instead
 */
export const getPointEmoji = getDebugPointEmoji;

/**
 * Formats a debug point name for display (removes prefixes for brevity)
 */
export const formatPointName = (point: string): string => {
  return point.replace("frame-", "").replace("surface-", "");
};

/**
 * Check if logs array is truncated based on configuration
 */
export const getLogsTruncationInfo = (totalLogs: number) => {
  const isLogsTruncated = totalLogs > LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS;
  const hiddenLogsCount = isLogsTruncated
    ? totalLogs - LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS
    : 0;

  return {
    isLogsTruncated,
    hiddenLogsCount,
    maxRendered: LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS,
  };
};

/**
 * Prepare logs for rendering (limit and reverse)
 */
export const prepareLogsForRendering = <T>(logs: T[]): T[] => {
  return [...logs].slice(-LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS).reverse();
};

/**
 * CSS-in-JS style configurations for log components
 */
export const LOG_STYLES = {
  logEntry: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    marginBottom: "1px",
    padding: "2px 8px", // Increased right padding to match visual balance
    borderRadius: "2px",
    fontSize: "10px",
    fontFamily: "monospace",
    lineHeight: "1.2",
    justifyContent: "flex-start",
  },

  timestamp: {
    color: "#6b7280",
    flexShrink: 0,
    minWidth: "60px",
    fontSize: "9px",
  },

  debugPoint: {
    color: "#60a5fa",
    flexShrink: 0,
    minWidth: "50px",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    fontSize: "9px",
  },

  message: {
    color: "#10b981",
    flexShrink: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: "10px",
    minWidth: "100px",
  },

  data: {
    color: "#fbbf24",
    flexShrink: 0,
    overflow: "visible", // Allow full width display
    textOverflow: "clip", // Remove ellipsis truncation
    whiteSpace: "text-wrap" as const,
    backgroundColor: "#78350f22",
    padding: "1px 3px",
    borderRadius: "2px",
    fontSize: "9px",
  },

  truncationWarning: {
    color: "#fbbf24",
    fontSize: "10px",
    textAlign: "center" as const,
    fontFamily: "monospace",
    padding: "4px 8px",
    backgroundColor: "#78350f22",
    borderRadius: "3px",
    marginBottom: "4px",
    border: "1px solid #78350f44",
  },

  emptyState: {
    color: "#6b7280",
    fontSize: "12px",
    textAlign: "center" as const,
    fontFamily: "monospace",
    padding: "40px",
  },
} as const;

/**
 * Generate alternating background color for log entries
 */
export const getLogEntryBackgroundColor = (index: number): string => {
  return index % 2 === 0 ? "#00000040" : "transparent";
};

// Re-export JSON utilities for backward compatibility
// UPDATED: Only export functions that exist after superjson migration
export {
  benchmarkSerialization,
  // Main utility class
  JsonUtils as default,
  // Display formatting
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
  JsonUtils,
  // Performance utilities
  performanceJsonStringify,
  // Core JSON functions
  safeJsonStringify,
} from "./json/json-utilities";

// Export truncateText from json-core since it's still used
export { truncateText } from "./json/json-core";
