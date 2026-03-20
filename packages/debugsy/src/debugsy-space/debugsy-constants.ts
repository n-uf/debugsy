// Debug configuration constants
export const MAX_STORED_LOGS = 10000;

import type { DebugPoint } from "./debugsy-point";
import type { DepsTrackingConfig } from "./debugsy-deps-types";

export {
  DEBUG_POINT_CONFIG,
  getAllDebugPoints,
  getDebugPointEmoji,
  getDebugPointsByCategory,
  getTagDef,
  getLookDebugPoints,
  type DebugPoint,
  type DebugPointConfig,
  type TagDef,
} from "./debugsy-point";

export {
  type DepsConfig,
  type DepsFilter,
  type DepsLogLevel,
  type DepsSettings,
  type DepsTrackingConfig,
} from "./debugsy-deps-types";

export type LogLevel = "info" | "warn" | "error" | "critical" | "success";

export interface DebugLogEntry {
  timestamp: number;
  level: LogLevel;
  point: DebugPoint;
  message: string;
  data?: any;
  sessionId: string;
  tags?: string[];
}

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
  deps: DepsTrackingConfig;
}
