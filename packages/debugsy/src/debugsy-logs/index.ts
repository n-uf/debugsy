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
