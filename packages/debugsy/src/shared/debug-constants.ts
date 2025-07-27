// Debug configuration constants
export const MAX_STORED_LOGS = 10000; // Maximum logs to keep in memory

// Import debug point configuration from dedicated file
import {
  DEBUG_POINT_CONFIG,
  type DebugPoint,
  type DebugPointConfig,
} from "./debug-point-config";

// Re-export for external use
export {
  DEBUG_POINT_CONFIG,
  type DebugPoint,
  type DebugPointConfig,
} from "./debug-point-config";

/**
 * Get emoji for debug point category
 * UNIFIED FUNCTION - replaces all getDebugEmoji, getPointEmoji variants
 */
export function getDebugPointEmoji(point: DebugPoint): string {
  return DEBUG_POINT_CONFIG[point]?.emoji || "🔧";
}

/**
 * Get description for debug point
 */
export function getDebugPointDescription(point: DebugPoint): string {
  return DEBUG_POINT_CONFIG[point]?.description || "Unknown debug point";
}

/**
 * Get category for debug point
 */
export function getDebugPointCategory(point: DebugPoint): string {
  return DEBUG_POINT_CONFIG[point]?.category || "unknown";
}

/**
 * Get priority for interaction debug points
 */
export function getDebugPointPriority(point: DebugPoint): number | undefined {
  const config = DEBUG_POINT_CONFIG[point] as DebugPointConfig;
  return config?.priority;
}

/**
 * Get all debug points by category
 */
export function getDebugPointsByCategory(
  category: DebugPointConfig["category"]
): DebugPoint[] {
  return Object.entries(DEBUG_POINT_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([point]) => point as DebugPoint);
}

/**
 * Get all debug points (excluding the special "all" point)
 * Used for enabling all debug points programmatically
 */
export function getAllDebugPoints(): DebugPoint[] {
  return Object.keys(DEBUG_POINT_CONFIG)
    .filter((point) => point !== "all")
    .map((point) => point as DebugPoint);
}

/**
 * Legacy compatibility - maintain old function name for backward compatibility
 * @deprecated Use getDebugPointEmoji instead
 */
export const getDebugEmoji = getDebugPointEmoji;

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
}

// Debug state interface
export interface DebugState {
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

// Notification throttling constants
export const NOTIFICATION_THROTTLE = 16; // ~60fps max update rate
