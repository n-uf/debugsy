// ENHANCED: Primary formatter that routes to specialized expansion content
export {
  DefaultLogFormatter,
  type DefaultLogFormatterProps,
  type LogSeverity,
} from "./default-log-formatter";

// CENTRALIZED: Formatter routing configuration
export {
  clearFormatterCache,
  getExpansionContent,
  getFormatterConfig,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  registerFormatter,
  unregisterFormatter,
  validateFormatters,
  type FormatterConfig,
  type FormatterMeta,
} from "./formatter-routing";

// DEFAULT EXPANSION: Default expansion content component
export { DefaultExpandedContent } from "./default-expansion-content";

// OPTIMIZED: Expansion-focused formatters (new architecture)
export {
  CategorySection,
  HealthExpansionContent,
  // Legacy export for backward compatibility
  HealthLogFormatter as LegacyHealthLogFormatter,
  formatTime,
  formatValue,
  getHealthLogMeta,
} from "./health-expansion-formatter";

export {
  DependencyExpansionContent,
  // Legacy export for backward compatibility
  DependencyLogFormatter as LegacyDependencyLogFormatter,
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";

// BACKWARD COMPATIBILITY: Re-export legacy formatters with original names
// These now internally use the optimized expansion system
export { DependencyLogFormatter } from "./dependency-expansion-formatter";
export { HealthLogFormatter } from "./health-expansion-formatter";

// Re-export types for convenience
export type { DebugLogEntry } from "../../../hooks/use-debug";
