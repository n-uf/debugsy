/**
 * Debug Hooks Module (Legacy)
 *
 * @deprecated This module has been reorganized. Import from the new structure:
 * - Core functionality: import from '@workspace/debugsy' (main package)
 * - Logging: import from '../debug-logs'
 * - Shared: import from '../shared'
 */

// Core hooks
export { useDebugSubscription } from "../debug-logs/hooks/debug-notifications";
export { captureHealthSnapshot } from "../debug-logs/hooks/health-snapshot";
export { useDebugsy } from "../debug-logs/hooks/use-debugsy";

// Data sanitization (simplified with superjson)
export {
  SANITIZATION_CONFIG,
  sanitizeLogData,
  sanitizeLogDataAdvanced,
} from "../debug-logs/utils/log-data-sanitization";

// Type exports
export type {
  DebugPoint,
  DependencyFilter,
  DependencyLogLevel,
} from "../shared/debug-constants";

export type { DebugLogEntry } from "../debug-logs/hooks/use-debugsy";
