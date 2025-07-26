/**
 * Debug Logs Module
 *
 * Provides log rendering components, formatters, and utilities for displaying
 * debug information in a structured and performant way.
 */

// Main log components
export { DebugLogsList } from "./debug-logs-list";

// Log formatters
export { DefaultExpandedContent } from "./formatters/default-expansion-content";
export { DefaultLogFormatter } from "./formatters/default-log-formatter";
export { DependencyExpansionContent } from "./formatters/dependency-expansion-formatter";
export { HealthExpansionContent } from "./formatters/health-expansion-formatter";
export { SanitizedDataExpansionContent } from "./formatters/sanitized-data-expansion-formatter";

// Formatter routing and registration
export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  registerFormatter,
} from "./formatters/formatter-routing";

// Log utilities
export {
  LOG_RENDERING_CONFIG,
  LOG_STYLES,
  formatDataForDisplay,
  formatPointName,
  getLogEntryBackgroundColor,
  getLogsTruncationInfo,
  getPointEmoji,
  prepareLogsForRendering,
} from "./utils/log-utilities";

// Copy utilities
export {
  copyLogsToClipboard,
  getCopyIcon,
  getLogsToCopy,
  getProgressColor,
  getProgressWidth,
} from "./utils/copy-utilities";

// JSON utilities
export {
  JsonUtils,
  formatDataForDisplay as formatJsonForDisplay,
  isLikelyLargeObject,
  memoizedJsonStringify,
  safeJsonStringify,
  smartJsonStringify,
} from "./utils/json/json-utilities";

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
 * // Custom formatter
 * const MyComponent = ({ log }) => {
 *   return <DefaultLogFormatter log={log} severity="warn" />;
 * };
 *
 * // Register custom formatter
 * registerFormatter('custom-type', {
 *   shouldExpand: (log) => log.type === 'custom',
 *   expansionContent: (log) => <CustomExpansion log={log} />
 * });
 */
