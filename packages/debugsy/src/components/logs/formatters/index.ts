/**
 * Log Formatters Module
 *
 * Provides specialized formatters for different types of log entries,
 * with automatic routing and expandable content support.
 */

// Core formatters
export { DefaultExpandedContent } from "./default-expansion-content";
export { DefaultLogFormatter } from "./default-log-formatter";

// Specialized formatters
export {
  DependencyExpansionContent,
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";

export {
  formatTime,
  formatValue,
  getHealthLogMeta,
  HealthExpansionContent,
} from "./health-expansion-formatter";

export {
  getSanitizedDataLogMeta,
  SanitizedDataExpansionContent,
} from "./sanitized-data-expansion-formatter";

// Formatter system
export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  registerFormatter,
} from "./formatter-routing";

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
