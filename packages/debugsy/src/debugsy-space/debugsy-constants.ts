// Debug configuration constants
export const MAX_STORED_LOGS = 10000; // Maximum logs to keep in memory

// Import debug point utilities and types from dedicated module
import type { DebugPoint, LogType } from "./debugsy-point";

export {
  DEBUG_POINT_CONFIG,
  getAllDebugPoints,
  getDebugPointEmoji,
  getDebugPointsByCategory,
  getLogTypeConfig,
  getLookDebugPoints,
  type DebugPoint,
  type DebugPointConfig,
  type DependencyLogType,
  type LogType,
  type LogTypeConfig,
} from "./debugsy-point";

// Dependency tracking types
export type DependencyLogLevel =
  | "silent"
  | "quiet"
  | "normal"
  | "verbose"
  | "debug";

export type DependencyFilter =
  | "all"
  | "functions-only"
  | "objects-only"
  | "unstable-only"
  | "stable-only"
  | "loop-risks";

// Dependency tracking configuration
export interface DependencyTrackingConfig {
  // REMOVED: enabled - now derived from debug point system (globalState.enabled.has("dependencies"))
  level: DependencyLogLevel;
  filter: DependencyFilter;
  allowedHooks: string[] | null;
  excludedHooks: string[];
  throttleMs: number;
}

// Log severity levels
export type LogLevel = "info" | "warn" | "error" | "critical" | "success";

// Debug log entry interface
export interface DebugLogEntry {
  timestamp: number;
  level: LogLevel;
  point: DebugPoint;
  message: string;
  data?: any;
  sessionId: string;
  logType?: LogType; // Automatically inferred from all debug point configurations
}

// Debug state interface
export interface DebugsySettings {
  enabled: Set<DebugPoint>;
  console: boolean;
  visual: boolean;
  performance: boolean;
  logs: DebugLogEntry[];
  timers: Map<string, number>;
  visualMessages: Array<{
    id: string;
    point: DebugPoint;
    message: string;
    timestamp: number;
    duration: number;
  }>;
  dependencies: DependencyTrackingConfig;
}

// Debug display content types
export interface DebugDisplayContent {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number; // Auto-clear after duration (ms), 0 for manual clear
  timestamp: number;
}

export interface DebugDisplayState {
  content: DebugDisplayContent | null;
}
