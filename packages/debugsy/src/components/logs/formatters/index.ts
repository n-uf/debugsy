// OPTIMIZED DEFAULT: Main default log formatter (now with hot registry performance)
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

// ZERO-OVERHEAD: Hot formatter registry for maximum performance
export {
  getHotExpansionContent,
  getHotLogTypeMeta,
  getHotRegistryStats,
  initializeHotRegistry,
  isHotRegistryReady,
  reinitializeHotRegistry,
} from "./hot-formatter-registry";

// AUTO-OPTIMIZATION: Performance monitoring and control
// Disabled for SSR compatibility - import manually if needed
// export {
//   ensurePerformanceOptimization,
//   getPerformanceStats,
//   isPerformanceOptimized,
// } from "./hot-formatter-auto-init";

// DEFAULT EXPANSION: Default expansion content component
export { DefaultExpandedContent } from "./default-expansion-content";

// SANITIZED DATA: Heavy object protection system
export {
  SanitizedDataExpansionContent,
  getSanitizedDataLogMeta,
} from "./sanitized-data-expansion-formatter";

// OPTIMIZED: Expansion-focused formatters (new architecture)
export {
  CategorySection,
  HealthExpansionContent,
  HealthLogFormatter as LegacyHealthLogFormatter, // Legacy export
  formatTime,
  formatValue,
  getHealthLogMeta,
} from "./health-expansion-formatter";

export {
  DependencyExpansionContent,
  DependencyLogFormatter as LegacyDependencyLogFormatter, // Legacy export
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";

// BACKWARD COMPATIBILITY: Re-export legacy formatters with original names
export { DependencyLogFormatter } from "./dependency-expansion-formatter";
export { HealthLogFormatter } from "./health-expansion-formatter";

// Re-export types for convenience
export type { DebugLogEntry } from "../../../hooks/use-debug";
