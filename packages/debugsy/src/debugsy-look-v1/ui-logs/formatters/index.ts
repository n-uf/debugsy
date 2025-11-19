/**
 * Log Formatters Module
 *
 * Provides specialized formatters for different types of log entries,
 * with automatic routing and expandable content support.
 */

// Enhanced log formatters with expansion capabilities
export { DefaultLogFormatter } from "./default-log-formatter";
export {
  DependencyExpansionContent,
  DependencyLogFormatter,
  getDependencyLogMeta,
} from "./deps";
export {
  HealthExpansionContent,
  formatTime,
  getHealthLogMeta,
} from "./health-expansion-formatter";
export {
  SanitizedDataExpansionContent,
  getSanitizedDataLogMeta,
} from "./sanitized-data-expansion-formatter";

// Formatter routing
export { FORMATTER_REGISTRY, getExpansionContent } from "./formatter-routing";

// Type exports
export type {
  DefaultLogFormatterProps,
  LogSeverity,
} from "./default-log-formatter";

export type { FormatterConfig, FormatterMeta } from "./formatter-routing";

/**
 * Formatter Registration Examples:
 *
 * // Register a custom formatter
 * registerFormatter('api-call', {
 *   shouldExpand: (log) => log.point === 'api' && log.data?.url,
 *   severity: 'info',
 *   expansionContent: (log) => <ApiCallFormatter log={log} />
 * });
 *
 * // Use default formatter with custom severity
 * <DefaultLogFormatter
 *   log={logEntry}
 *   severity="warn"
 *   showExpandButton={true}
 * />
 */
