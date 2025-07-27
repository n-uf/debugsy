/**
 * Debug Logs Module
 *
 * All logging-related functionality including hooks, components, and utilities.
 */

// === CORE HOOK SYSTEM ===
export { useDebugSubscription } from "./hooks/debug-notifications";
export { captureHealthSnapshot } from "./hooks/health-snapshot";

// === STABLE DEBUGSY SYSTEM ===
export {
  clearStableDebugsyCache,
  getStableDebugsyCacheSize,
  getStableDebugsyInterface,
  type StableDebugsyInterface,
} from "./stabilizator";

// === CORE HOOK ===
export { useDebugsy } from "./use-debugsy";

// Data sanitization
export {
  SANITIZATION_CONFIG,
  sanitizeLogData,
  sanitizeLogDataAdvanced,
} from "./logic/log-data-sanitization";

// Type exports
export type {
  HealthMetrics,
  HealthSnapshotConfig,
} from "./hooks/health-snapshot";
export type { DebugLogEntry } from "./use-debugsy";

// Component prop types
export type { DebugsyLookProps as DebugsyPanelProps } from "../debugsy-look/debugsy-look";

export type { DebugControlPanelProps } from "../debugsy-look/ui-control-center/control-panel";
export type { DebugPanelHeaderProps } from "../debugsy-look/ui-control-center/header";
export type { DebugResizePresetsProps } from "../debugsy-look/ui-control-center/resize-presets";
export type { DebugDependencyAdvancedControlsProps } from "../debugsy-look/ui-dependency/dependency-advanced-controls";
export type { DebugDependencyControlsProps } from "../debugsy-look/ui-dependency/dependency-controls";
export type { DebugDisplayPanelProps } from "../debugsy-look/ui-display/debug-display-panel";
export type { DebugLogsListProps } from "../debugsy-look/ui-logs/debug-logs-list";
export type { DebugStatsPanelProps } from "../debugsy-look/ui-stats-center/stats-panel";
