/**
 * Debug Hooks Module
 *
 * Provides core debugging hooks and state management for the debug system.
 */

// Core debug hooks
export { useDebug, useDependencyState } from "./use-debug";

// Debug state management
export { getGlobalDebugState, initializeDebugState } from "./debug-state";

// Health and performance monitoring
export { captureHealthSnapshot } from "./health-snapshot";

// Data sanitization
export {
  SANITIZATION_PRESETS,
  getSanitizationPerformanceStats,
  needsSanitization,
  resetSanitizationPerformanceStats,
  sanitizeLogData,
} from "./log-data-sanitization";

// Debug notifications
export { notifySubscribers, useDebugSubscription } from "./debug-notifications";

// Type exports
export type {
  DebugPoint,
  DebugState,
  DependencyFilter,
  DependencyLogLevel,
  DependencyTrackingConfig,
} from "./debug-constants";

export type { DebugLogEntry } from "./use-debug";

// Note: Additional types are defined internally but not exported
// Check individual modules for complete type definitions

/**
 * Quick Start Examples:
 *
 * // Basic debug hook usage
 * const { log, isEnabled } = useDebug('surface-interaction');
 * log('User clicked element', { elementId: 'button-1' });
 *
 * // Health monitoring
 * const healthData = useHealthSnapshot();
 *
 * // Dependency state
 * const { enabled, level } = useDependencyState();
 */
