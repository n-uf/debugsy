// === SHARED CORE SYSTEM ===
export {
  initializeUnifiedDebugSystem,
  type DebugPoint,
  type DependencyFilter,
  type DependencyLogLevel,
  type LogLevel,
  type UnifiedSurfaceDebug,
} from "./src/shared";

// === DEBUG DEPENDENCY TRACKING ===
export { useRenderTracker, useWhyDidYouUpdate } from "./src/debug-deps";

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
  DebugStatus,
  DebugsyPanel,
  sanitizeLogData,
  useDebugSubscription,
  useDebugsy,
} from "./src/debug-logs";

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
} from "./src/debug-logs";

// === TYPE EXPORTS ===
export type {
  DebugLogEntry,
  HealthMetrics,
  HealthSnapshotConfig,
} from "./src/debug-logs";

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
  DebugStatusProps,
  DebugsyPanelProps,
} from "./src/debug-logs";

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
