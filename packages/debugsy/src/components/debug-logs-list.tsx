// Backward compatibility re-export from the new modular structure
// The DebugLogsList component has been moved to ./logs/debug-logs-list.tsx
// and refactored to use extracted formatters and utilities

export {
  CategorySection,
  copyLogsToClipboard,
  DebugLogsList,
  DEFAULT_COPY_CONFIG,
  DefaultLogFormatter,
  DependencyLogFormatter,
  formatDataForDisplay,
  formatLogForCopy,
  formatPointName,
  formatTime,
  formatValue,
  getCopyIcon,
  getCopyTooltip,
  getHoverMessage,
  getLogEntryBackgroundColor,
  getLogsToCopy,
  getLogsTruncationInfo,
  getPointEmoji,
  getProgressColor,
  getProgressWidth,
  HealthLogFormatter,
  LOG_RENDERING_CONFIG,
  LOG_STYLES,
  prepareLogsForRendering,
  truncateText,
} from "./logs";

// Export types separately for isolatedModules compatibility
export type {
  CopyConfig,
  CopyState,
  DebugLogEntry,
  DebugLogsListProps,
  DefaultLogFormatterProps,
  LogSeverity,
} from "./logs";
