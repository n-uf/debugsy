// Debug configuration constants
export const MAX_STORED_LOGS = 10000; // Maximum logs to keep in memory

// Import debug point utilities and types from dedicated module
import type { DebugPoint, LogType } from "./debugsy-point";

// Import deps tracking types from dedicated module
import type { DepsTrackingConfig } from "./debugsy-deps-types";

export {
  DEBUG_POINT_CONFIG,
  getAllDebugPoints,
  getDebugPointEmoji,
  getDebugPointsByCategory,
  getLogTypeConfig,
  getLookDebugPoints,
  type DebugPoint,
  type DebugPointConfig,
  type LogType,
  type LogTypeConfig,
} from "./debugsy-point";

// Re-export deps types
export {
  type DepsConfig,
  type DepsFilter,
  type DepsLogLevel,
  type DepsSettings,
  type DepsTrackingConfig,
} from "./debugsy-deps-types";

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
  deps: DepsTrackingConfig; // Updated naming from "dependencies" to "deps"
}
