/**
 * Debug Hooks Module (Legacy)
 *
 * @deprecated This module has been reorganized. Import from the new structure:
 * - Core functionality: import from '@workspace/debugsy' (main package)
 * - Logging: import from '../debug-logs'
 * - Shared: import from '../shared'
 */

// Re-export from new locations for backward compatibility
export {
  notifySubscribers,
  useDebugSubscription,
} from "../debug-logs/hooks/debug-notifications";
export { captureHealthSnapshot } from "../debug-logs/hooks/health-snapshot";
export { useDebug } from "../debug-logs/hooks/use-debug";
export {
  SANITIZATION_PRESETS,
  getSanitizationPerformanceStats,
  needsSanitization,
  resetSanitizationPerformanceStats,
  sanitizeLogData,
} from "../debug-logs/utils/log-data-sanitization";
export {
  getGlobalDebugState,
  initializeDebugState,
} from "../shared/debug-state";

// Type exports
export type {
  DebugPoint,
  DependencyFilter,
  DependencyLogLevel,
} from "../shared/debug-constants";

export type { DebugLogEntry } from "../debug-logs/hooks/use-debug";
