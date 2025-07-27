// === SHARED CORE SYSTEM ===
export {
  initializeDebugsySpace as initializeUnifiedDebugSystem,
  type DebugPoint,
  type DependencyFilter,
  type DependencyLogLevel,
  type LogLevel,
  type DebugsySpace as UnifiedSurfaceDebug,
} from "./src/debugsy-space";

// === DEBUG DEPENDENCY TRACKING ===
export { useRenderTracker, useWhyDidYouUpdate } from "./src/debugsy-deps";

// === DEBUG LOGGING SYSTEM ===
export {
  captureHealthSnapshot,
  DebugControlPanel,
  DebugDependencyAdvancedControls,
  DebugDependencyControls,
  DebugDisplayPanel,
  DebugLogsList,
  DebugPanelHeader,
  DebugPointButtons,
  DebugResizePresets,
  DebugStatsPanel,
  DebugsyPanel,
  sanitizeLogData,
  useDebugSubscription,
  useDebugsy,
} from "./src/debugsy-logs";

// === LOG FORMATTERS ===
export {
  DefaultLogFormatter,
  DependencyExpansionContent,
  FORMATTER_REGISTRY,
  getDependencyLogMeta,
  getExpansionContent,
  getHealthLogMeta,
  getLogTypeMeta,
  getRegisteredFormatterTypes,
  getSanitizedDataLogMeta,
  HealthExpansionContent,
  registerFormatter,
  SanitizedDataExpansionContent,
  type FormatterConfig,
  type FormatterMeta,
  type LogSeverity,
} from "./src/debugsy-logs";

// === TYPE EXPORTS ===
export type {
  DebugLogEntry,
  HealthMetrics,
  HealthSnapshotConfig,
} from "./src/debugsy-logs";

// === COMPONENT PROP TYPES ===
export type {
  DebugControlPanelProps,
  DebugDependencyAdvancedControlsProps,
  DebugDependencyControlsProps,
  DebugDisplayPanelProps,
  DebugLogsListProps,
  DebugPanelHeaderProps,
  DebugPointButtonsProps,
  DebugPointConfig,
  DebugResizePresetsProps,
  DebugStatsPanelProps,
  DebugsyPanelProps,
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
