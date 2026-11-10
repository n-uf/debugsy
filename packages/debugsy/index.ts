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
  exposeConsole,
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

// === UI COMPONENTS ===
export {
  DebugsyLook,
  type DebugsyLookProps,
  ModuleNav,
} from "./src/debugsy-look";
export type { DebugsyTheme } from "./src/ui";

// === TYPE EXPORTS ===
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
