/**
 * Shared Debug System
 *
 * Core debug infrastructure shared across all debug modules.
 */

// Core global debug manager
export {
  initializeUnifiedDebugSystem,
  type UnifiedSurfaceDebug,
} from "./global-debug-manager";

// Core debug constants and types
export {
  MAX_STORED_LOGS,
  getDebugEmoji,
  type DebugDisplayContent,
  type DebugDisplayState,
  type DebugPoint,
  type DebugState,
  type DependencyFilter,
  type DependencyLogLevel,
  type DependencyTrackingConfig,
  type LogLevel,
} from "./debug-constants";

// Core debug state management
export {
  debugStateControls,
  dependencyStateControls,
  getGlobalDebugState,
  initializeDebugState,
} from "./debug-state";
