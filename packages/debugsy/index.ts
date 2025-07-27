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
  sanitizeLogData,
  useDebugSubscription,
  useDebugsy,
} from "./src/debugsy-logs";

// === UI COMPONENTS ===
export {
  DebugControlPanel,
  DebugDependencyControls,
  DebugDisplayPanel,
  DebugLogsList,
  DebugPanelHeader,
  DebugPointButtons,
  DebugResizePresets,
  DebugStatsPanel,
  Debugsy as DebugsyPanel,
} from "./src/debugsy-look";

// === LOG FORMATTERS ===
export {
  DefaultLogFormatter,
  DependencyExpansionContent,
  HealthExpansionContent,
  SanitizedDataExpansionContent,
} from "./src/debugsy-look/ui-logs/formatters";

export {
  FORMATTER_REGISTRY,
  getExpansionContent,
  getLogTypeMeta,
  registerFormatter,
  type FormatterConfig,
  type FormatterMeta,
} from "./src/debugsy-look/ui-logs/formatters/formatter-routing";

export { type LogSeverity } from "./src/debugsy-look/ui-logs/formatters/default-log-formatter";

export { getDependencyLogMeta } from "./src/debugsy-look/ui-logs/formatters/deps";

export { getHealthLogMeta } from "./src/debugsy-look/ui-logs/formatters/health-expansion-formatter";

export { getSanitizedDataLogMeta } from "./src/debugsy-look/ui-logs/formatters/sanitized-data-expansion-formatter";

export { getRegisteredFormatterTypes } from "./src/debugsy-look/ui-logs/formatters/formatter-routing";

// === TYPE EXPORTS ===
export type {
  DebugLogEntry,
  HealthMetrics,
  HealthSnapshotConfig,
} from "./src/debugsy-logs";

// === COMPONENT PROP TYPES ===
export type {
  DebugControlPanelProps,
  DebugDependencyControlsProps,
  DebugDisplayPanelProps,
  DebugLogsListProps,
  DebugPanelHeaderProps,
  DebugPointButtonConfig,
  DebugPointButtonsProps,
  DebugResizePresetsProps,
  DebugStatsPanelProps,
  DebugsyProps as DebugsyPanelProps,
} from "./src/debugsy-look";

// === ADVANCED DEPENDENCY CONTROLS ===
export type { DebugDependencyAdvancedControlsProps } from "./src/debugsy-look/ui-dependency/dependency-advanced-controls";

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
