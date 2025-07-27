/**
 * Debugsy Deps - Enhanced React Hook Dependency Tracking
 *
 * UNIFIED ARCHITECTURE: Complete integration with debugsy system
 * - State management via unified debugsy space
 * - Logging through unified debugsy channels
 * - UI controls through unified control panels
 * - Settings persistence through unified storage
 *
 * PERFORMANCE OPTIMIZATIONS:
 * - Throttled logging to prevent UI blocking
 * - Smart filtering based on app lifecycle phase
 * - Emergency stop mechanism for runaway render loops
 * - Efficient change detection with early bailouts
 *
 * DEBUGGING FEATURES:
 * - Detailed change analysis with type discrimination
 * - Render loop detection with progressive warnings
 * - Hook-specific filtering for targeted debugging
 * - Initialization-aware filtering for better UX during app startup
 */

// Core tracking hooks - primary interface
export { useRenderTracker, useWhyDidYouUpdate } from "./use-deps";

// Logging system - unified with debugsy
export { logToDebugSystem as logDepsChange } from "./deps-logger";

// Settings and state access
export { getDepsSettings } from "./deps-settings";

// Filtering utilities
export {
  shouldLogChangeType,
  shouldLogLevel,
  shouldTrackHook,
} from "./deps-filters";

// Change analysis utilities
export { analyzeChanges, detectChangeType } from "./logic/change-utils";

// Initialization phase tracking
export { initializationPhase } from "./logic/change-tracking";

// React hook for settings - from unified space
export { useDepsSettings as useDepsState } from "../debugsy-space/debugsy-space-settings";

// Type re-exports from debugsy space
export type {
  DepsConfig,
  DepsFilter,
  DepsLogLevel,
  DepsSettings,
  DepsTrackingConfig,
} from "../debugsy-space/debugsy-constants";
