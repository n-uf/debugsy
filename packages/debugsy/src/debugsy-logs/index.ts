/**
 * Debug Logs Module
 *
 * All logging-related functionality including hooks, components, and utilities.
 */

// === CORE HOOK SYSTEM ===
export { useDebugsySubscription as useDebugSubscription } from "./hooks/debugsy-notifications";
export { captureHealthSnapshot } from "./logic/health-snapshot";

// === STABLE DEBUGSY SYSTEM ===
export {
  clearStableDebugsyCache,
  getStableDebugsyCacheStatus,
  getStableDebugsyInterface,
  type StableDebugsyInterface,
} from "./logic/stabilizator";

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
} from "./logic/health-snapshot";
export type { DebugLogEntry } from "./use-debugsy";

// Component prop types
export type { DebugsyLookProps as DebugsyPanelProps } from "../debugsy-look/debugsy-look";

export type { DebugStatsPanelProps } from "../debugsy-look-v1/ui-stats-center/stats-panel";
export type { DebugControlPanelProps } from "../debugsy-look-v1/ui-control-center/control-panel";
export type { DebugPanelHeaderProps } from "../debugsy-look-v1/ui-control-center/header";
export type { DebugResizePresetsProps } from "../debugsy-look-v1/ui-control-center/resize-presets";
export type { DebugDependencyAdvancedControlsProps } from "../debugsy-look-v1/ui-dependency/dependency-advanced-controls";
export type { DebugDependencyControlsProps } from "../debugsy-look-v1/ui-dependency/dependency-controls";
export type { DebugDisplayPanelProps } from "../debugsy-look-v1/ui-display/debug-display-panel";
export type { DebugLogsListProps } from "../debugsy-look-v1/ui-logs/logs-list";
