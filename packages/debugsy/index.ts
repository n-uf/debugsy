// Main exports
export { DebugControlPanel } from "./src/components/debug-control-panel";
export { DebugDependencyAdvancedControls } from "./src/components/debug-dependency-advanced-controls";
export { DebugDependencyControls } from "./src/components/debug-dependency-controls";
export { DebugDisplayPanel } from "./src/components/debug-display-panel";
export { DebugExternalPanel } from "./src/components/debug-external-panel";
export { DebugPanelHeader } from "./src/components/debug-panel-header";
export { DebugPointButtons } from "./src/components/debug-point-buttons";
export { DebugResizePresets } from "./src/components/debug-resize-presets";
export { DebugStatsPanel } from "./src/components/debug-stats-panel";
export { DebugStatus } from "./src/components/debug-status";
export { DebugLogsList } from "./src/components/logs/debug-logs-list";

// Hook exports
export { useWhyDidYouUpdate } from "./src/debug-deps/debug-deps";
export { useDebug, useDependencyState } from "./src/hooks/use-debug";

// Type exports
export type { DependencyFilter } from "./src/hooks/debug-constants";
export type { DebugLogEntry } from "./src/hooks/use-debug";

// Formatter exports
export {
  DefaultLogFormatter,
  type LogSeverity,
} from "./src/components/logs/formatters/default-log-formatter";

export {
  DependencyExpansionContent,
  getDependencyLogMeta,
} from "./src/components/logs/formatters/dependency-expansion-formatter";

export {
  HealthExpansionContent,
  getHealthLogMeta,
} from "./src/components/logs/formatters/health-expansion-formatter";

export {
  SanitizedDataExpansionContent,
  getSanitizedDataLogMeta,
} from "./src/components/logs/formatters/sanitized-data-expansion-formatter";

export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  registerFormatter,
  type FormatterConfig,
  type FormatterMeta,
} from "./src/components/logs/formatters/formatter-routing";

// Sanitization utilities
export {
  SANITIZATION_PRESETS,
  getSanitizationPerformanceStats,
  needsSanitization,
  resetSanitizationPerformanceStats,
  sanitizeLogData,
} from "./src/hooks/log-data-sanitization";
