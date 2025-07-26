// Performance Optimization: Auto-initialize hot formatter registry
// Disabled for SSR compatibility - will be loaded on client-side as needed
// import "./src/components/logs/formatters/hot-formatter-auto-init";

// Debug Components
export * from "./src/components";

// Debug Hooks - specific exports to avoid conflicts
export * from "./src/hooks/debug-constants";
export * from "./src/hooks/debug-notifications";
export * from "./src/hooks/debug-state";
export * from "./src/hooks/health-snapshot";
export {
  useDebug,
  useDebugDisplayContent,
  useDependencyState,
} from "./src/hooks/use-debug";
export type {
  DebugLogEntry,
  DependencyFilter,
  DependencyLogLevel,
} from "./src/hooks/use-debug";

// Debug Utils
export * from "./src/debug-deps/debug-deps";

// Heavy Object Protection System
export {
  SANITIZATION_PRESETS,
  getSanitizationPerformanceStats,
  needsSanitization,
  resetSanitizationPerformanceStats,
  sanitizeLogData,
} from "./src/hooks/log-data-sanitization";

// Performance Optimization Utils
export {
  ensurePerformanceOptimization,
  getPerformanceStats,
  isPerformanceOptimized,
} from "./src/components/logs/formatters/hot-formatter-auto-init";
