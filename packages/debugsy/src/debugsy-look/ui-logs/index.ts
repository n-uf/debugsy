/**
 * Debug Logs Module
 *
 * Provides log rendering components, formatters, and utilities for displaying
 * debug information in a structured and performant way.
 *
 * UPDATED: Cleaned up after superjson migration
 */

// Main logs list component
export { DebugLogsList } from "./debug-logs-list";

// JSON utilities (superjson-based)
export {
  JsonUtils,
  benchmarkSerialization,
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
  performanceJsonStringify,
  safeJsonStringify,
} from "./utils/json/json-utilities";

// Copy utilities
export { copyLogsToClipboard, formatLogForCopy } from "./utils/copy-utilities";

// Log utilities
export {
  LOG_RENDERING_CONFIG,
  LOG_STYLES,
  formatPointName,
  getLogEntryBackgroundColor,
  getLogsTruncationInfo,
  getPointEmoji,
  prepareLogsForRendering,
} from "./utils/log-utilities";

// Component exports
export { DefaultExpandedContent } from "./formatters/default-expansion-content";
export { DependencyExpansionContent } from "./formatters/deps";
export { HealthExpansionContent } from "./formatters/health-expansion-formatter";
export { SanitizedDataExpansionContent } from "./formatters/sanitized-data-expansion-formatter";

// Formatter routing and registration
export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  registerFormatter,
} from "./formatters/formatter-routing";

// Type exports
export type { DebugLogsListProps } from "./debug-logs-list";
export type {
  DefaultLogFormatterProps,
  LogSeverity,
} from "./formatters/default-log-formatter";
export type {
  FormatterConfig,
  FormatterMeta,
} from "./formatters/formatter-routing";

/**
 * Quick Start Examples:
 *
 * // Basic log list
 * <DebugLogsList logs={debugLogs} />
 *
 * // Use JSON utilities with superjson
 * const safe = JsonUtils.stringify(complexObject);
 * const display = JsonUtils.formatForDisplay(data, 100);
 *
 * // Copy logs to clipboard
 * await copyLogsToClipboard(logs);
 *
 * // Register custom formatter
 * registerFormatter('custom-type', {
 *   shouldExpand: (log) => log.type === 'custom',
 *   expansionContent: (log) => <CustomExpansion log={log} />
 * });
 */
