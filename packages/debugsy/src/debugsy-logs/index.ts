/**
 * Debug Logs Module
 *
 * All logging-related functionality including hooks, components, and utilities.
 */

// === SHARED DEBUG LOGS ===
export { useDebugSubscription } from "./hooks/debug-notifications";
export { captureHealthSnapshot } from "./hooks/health-snapshot";
export { useDebugsy } from "./hooks/use-debugsy";

// Data sanitization
export {
  SANITIZATION_CONFIG,
  sanitizeLogData,
  sanitizeLogDataAdvanced,
} from "./logic/log-data-sanitization";

// === COMPONENTS ===
export { DebugsyLook as DebugsyPanel } from "../debugsy-look/debugsy-look";
export { DebugPointButtons } from "../debugsy-look/ui-control-center/control-buttons";
export { DebugControlPanel } from "../debugsy-look/ui-control-center/control-panel";
export { DebugPanelHeader } from "../debugsy-look/ui-control-center/header";
export { DebugResizePresets } from "../debugsy-look/ui-control-center/resize-presets";
export { DebugDependencyAdvancedControls } from "../debugsy-look/ui-dependency/dependency-advanced-controls";
export { DebugDependencyControls } from "../debugsy-look/ui-dependency/dependency-controls";
export { DebugDisplayPanel } from "../debugsy-look/ui-display/debug-display-panel";
export { DebugLogsList } from "../debugsy-look/ui-logs/debug-logs-list";
export { DebugStatsPanel } from "../debugsy-look/ui-stats-center/stats-panel";

// Log formatters
export {
  DefaultLogFormatter,
  DependencyExpansionContent,
  FORMATTER_REGISTRY,
  getDependencyLogMeta,
  getExpansionContent,
  getHealthLogMeta,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  getSanitizedDataLogMeta,
  HealthExpansionContent,
  registerFormatter,
  SanitizedDataExpansionContent,
  type FormatterConfig,
  type FormatterMeta,
  type LogSeverity,
} from "../debugsy-look/ui-logs/formatters";

// Type exports
export type {
  HealthMetrics,
  HealthSnapshotConfig,
} from "./hooks/health-snapshot";
export type { DebugLogEntry } from "./hooks/use-debugsy";

// Component prop types
export type { DebugsyLookProps as DebugsyPanelProps } from "../debugsy-look/debugsy-look";
export type {
  DebugPointButtonsProps,
  DebugPointConfig,
} from "../debugsy-look/ui-control-center/control-buttons";
export type { DebugControlPanelProps } from "../debugsy-look/ui-control-center/control-panel";
export type { DebugPanelHeaderProps } from "../debugsy-look/ui-control-center/header";
export type { DebugResizePresetsProps } from "../debugsy-look/ui-control-center/resize-presets";
export type { DebugDependencyAdvancedControlsProps } from "../debugsy-look/ui-dependency/dependency-advanced-controls";
export type { DebugDependencyControlsProps } from "../debugsy-look/ui-dependency/dependency-controls";
export type { DebugDisplayPanelProps } from "../debugsy-look/ui-display/debug-display-panel";
export type { DebugLogsListProps } from "../debugsy-look/ui-logs/debug-logs-list";
export type { DebugStatsPanelProps } from "../debugsy-look/ui-stats-center/stats-panel";
