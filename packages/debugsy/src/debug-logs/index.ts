/**
 * Debug Logs Module
 *
 * All logging-related functionality including hooks, components, and utilities.
 */

// === SHARED DEBUG LOGS ===
export { useDebugSubscription } from "./hooks/debug-notifications";
export { captureHealthSnapshot } from "./hooks/health-snapshot";
export { useDebug } from "./hooks/use-debug";

// Data sanitization
export {
  SANITIZATION_CONFIG,
  sanitizeLogData,
  sanitizeLogDataAdvanced,
} from "./utils/log-data-sanitization";

// === COMPONENTS ===
export { DebugControlPanel } from "./components/debug-control-panel";
export { DebugDependencyAdvancedControls } from "./components/debug-dependency-advanced-controls";
export { DebugDependencyControls } from "./components/debug-dependency-controls";
export { DebugDisplayPanel } from "./components/debug-display-panel";
export { DebugExternalPanel } from "./components/debug-external-panel";
export { DebugPanelHeader } from "./components/debug-panel-header";
export { DebugPointButtons } from "./components/debug-point-buttons";
export { DebugResizePresets } from "./components/debug-resize-presets";
export { DebugStatsPanel } from "./components/debug-stats-panel";
export { DebugStatus } from "./components/debug-status";
export { DebugLogsList } from "./components/logs/debug-logs-list";

// Log formatters
export {
  DefaultLogFormatter,
  DependencyExpansionContent,
  FORMATTER_REGISTRY,
  HealthExpansionContent,
  SanitizedDataExpansionContent,
  getDependencyLogMeta,
  getExpansionContent,
  getHealthLogMeta,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  getSanitizedDataLogMeta,
  registerFormatter,
  type FormatterConfig,
  type FormatterMeta,
  type LogSeverity,
} from "./components/logs/formatters";

// Type exports
export type {
  HealthMetrics,
  HealthSnapshotConfig,
} from "./hooks/health-snapshot";
export type { DebugLogEntry } from "./hooks/use-debug";

// Component prop types
export type { DebugControlPanelProps } from "./components/debug-control-panel";
export type { DebugDependencyControlsProps } from "./components/debug-dependency-controls";
export type { DebugDisplayPanelProps } from "./components/debug-display-panel";
export type { DebugExternalPanelProps } from "./components/debug-external-panel";
export type { DebugPanelHeaderProps } from "./components/debug-panel-header";
export type {
  DebugPointButtonsProps,
  DebugPointConfig,
} from "./components/debug-point-buttons";
export type { DebugResizePresetsProps } from "./components/debug-resize-presets";
export type { DebugStatsPanelProps } from "./components/debug-stats-panel";
export type { DebugStatusProps } from "./components/debug-status";
export type { DebugLogsListProps } from "./components/logs/debug-logs-list";
