// Core formatter components
export { DefaultLogFormatter } from "./default-log-formatter";

// Expansion content components
export { DefaultExpandedContent } from "./default-expansion-content";
export { DependencyExpansionContent } from "./dependency-expansion-formatter";
export { HealthExpansionContent } from "./health-expansion-formatter";
export { SanitizedDataExpansionContent } from "./sanitized-data-expansion-formatter";

// Meta functions for log type metadata
export { getDependencyLogMeta } from "./dependency-expansion-formatter";
export { getHealthLogMeta } from "./health-expansion-formatter";
export { getSanitizedDataLogMeta } from "./sanitized-data-expansion-formatter";

// Utility functions
export {
  CategorySection,
  formatTime,
  formatValue,
} from "./health-expansion-formatter";

// Routing utilities - simplified system
export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  registerFormatter,
  type FormatterConfig,
  type FormatterMeta,
} from "./formatter-routing";

// Legacy exports for backward compatibility
export { DependencyExpansionContent as DependencyLogFormatter } from "./dependency-expansion-formatter";
export { HealthExpansionContent as HealthLogFormatter } from "./health-expansion-formatter";
