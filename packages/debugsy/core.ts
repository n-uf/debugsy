/**
 * `@n-uf/debugsy/core`: logging without the panel.
 *
 * `dsy`, the module registry, the dependency-tracking hooks and the log
 * hooks, with no UI. Code that only logs (a library, a window manager)
 * imports this, and never loads the panel or its UI kit.
 *
 * The root entry (`@n-uf/debugsy`) re-exports all of this beside the panel
 * (`DebugsyLook`). Both entries share one copy of the state: the debug point
 * registry, the settings and the log queue. So a panel loaded from the root
 * shows what code logged through the core.
 */

// === MODULE REGISTRY ===
export {
  registerModule,
  getModules,
  getModuleDef,
  getModuleForPoint,
  getModulePointKeys,
  getModuleLedState,
  getAllPointKeys,
  isKnownPoint,
  type DebugModuleDef,
  type DebugPointDef,
  type ModuleLedState,
} from "./src/config";

// === SHARED CORE SYSTEM ===
export {
  dsy,
  getDebugsy,
  initializeDebugsySpace as initializeUnifiedDebugSystem,
  type DebugPoint,
  type DepsFilter,
  type DepsLogLevel,
  type LogLevel,
  type DebugsySpace as UnifiedSurfaceDebug,
} from "./src/debugsy-space";

// === DEBUG DEPENDENCY TRACKING ===
export {
  useRenderTracker,
  useWhyDidYouUpdate,
  type ComponentLifecycleInfo,
  type DependencyChangeInfo,
  type MountRateInfo,
  type RenderRateInfo,
  type RenderTrackerOptions,
} from "./src/debugsy-deps";

// === DEBUG LOGGING SYSTEM ===
export {
  captureHealthSnapshot,
  sanitizeLogData,
  useDebugSubscription,
  useDebugsy,
} from "./src/debugsy-logs";

export type {
  DebugLogEntry,
  HealthMetrics,
  HealthSnapshotConfig,
} from "./src/debugsy-logs";

// Object depth utilities
export {
  createObjectDiff,
  createValueDiff,
  cutObjectDepth,
  estimateProcessingCost,
  getDepthSettingDescription,
  getDiffSummary,
  objectToString,
  processObjectForDisplay,
  processObjectsBatch,
  testStringMode,
  type DepthSetting,
  type DiffEntry,
} from "./src/shared/object-depth-utils";
