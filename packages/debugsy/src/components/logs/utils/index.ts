/**
 * Log Utilities Module
 *
 * Provides utility functions for log processing, formatting, copying,
 * and performance optimization.
 */

// Core log utilities
export {
  LOG_RENDERING_CONFIG,
  LOG_STYLES,
  formatPointName,
  getLogEntryBackgroundColor,
  getLogsTruncationInfo,
  getPointEmoji,
  prepareLogsForRendering,
} from "./log-utilities";

// Copy functionality
export {
  copyLogsToClipboard,
  getCopyIcon,
  getHoverMessage,
  getLogsToCopy,
  getProgressColor,
  getProgressWidth,
} from "./copy-utilities";

// JSON processing utilities
export {
  JsonUtils,
  formatDataForDisplay,
  isLikelyLargeObject,
  memoizedJsonStringify,
  performantJsonStringify,
  safeJsonStringify,
  smartJsonStringify,
  truncateText,
} from "./json/json-utilities";

// JSON performance utilities
export { clearJsonStringifyCache } from "./json/json-performance";

// Copy configuration
export {
  DEFAULT_COPY_CONFIG,
  getAutoResetAfterDelay,
  getButtonTransitionDuration,
  getDisplayDuration,
  getProgressBarDuration,
} from "../config/copy-config";

// Type exports
export type { CopyState } from "./copy-utilities";

/**
 * Utility Usage Examples:
 *
 * // Format log data for display
 * const displayText = formatDataForDisplay(logData, 500);
 *
 * // Copy logs to clipboard
 * await copyLogsToClipboard(selectedLogs);
 *
 * // Check if object needs special handling
 * const isLarge = isLikelyLargeObject(data);
 *
 * // Get log entry styling
 * const bgColor = getLogEntryBackgroundColor(index);
 * const emoji = getPointEmoji('surface-interaction');
 */
