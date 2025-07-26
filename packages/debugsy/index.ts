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
export {
  circuitBreakerControl,
  emergencyStop,
  useCircuitBreakerTracker,
  useEmergencySafeHook,
  useRenderTracker,
  useSafeHook,
  useWhyDidYouUpdate,
} from "./src/debug-deps";

// === DEBUG LOGGING SYSTEM ===
export {
  captureHealthSnapshot,
  DebugControlPanel,
  DebugDependencyAdvancedControls,
  DebugDependencyControls,
  DebugDisplayPanel,
  DebugExternalPanel,
  DebugLogsList,
  DebugPanelHeader,
  DebugPointButtons,
  DebugResizePresets,
  DebugStatsPanel,
  DebugStatus,
  getSanitizationPerformanceStats,
  needsSanitization,
  resetSanitizationPerformanceStats,
  SANITIZATION_PRESETS,
  sanitizeLogData,
  useDebug,
  useDebugSubscription,
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
  DebugDependencyControlsProps,
  DebugDisplayPanelProps,
  DebugExternalPanelProps,
  DebugLogsListProps,
  DebugPanelHeaderProps,
  DebugPointButtonsProps,
  DebugPointConfig,
  DebugResizePresetsProps,
  DebugStatsPanelProps,
  DebugStatusProps,
} from "./src/debug-logs";
