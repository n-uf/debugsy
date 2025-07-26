// Debug configuration constants
export const MAX_STORED_LOGS = 10000; // Maximum logs to keep in memory

// Debug point categories
export type DebugPoint =
  | "dispatcher" // Central mouse event dispatcher coordination
  | "hit-testing" // Priority-based hit test routing & decisions
  | "routing" // Event routing decisions with conflict resolution
  | "surface" // Surface component lifecycle
  | "surface-interaction" // Viewport pan/zoom interactions (Priority 999)
  | "frame-interaction" // Frame drag/resize interactions (Priority 1-2)
  | "selection-interaction" // Multi-frame selection system (Priority 998)
  | "handler-registry" // Handler registration/unregistration lifecycle
  | "performance" // Event throughput, timing, and efficiency
  | "visual-debug" // Visual debug overlays and priority zones
  | "surface-interactions" // Surface component coordination
  | "surface-dock" // SurfaceDock component lifecycle
  | "frame-metrics" // Frame positioning and sizing state
  | "dependencies" // React hook dependency tracking and optimization
  | "health" // System health snapshots and metrics - always enabled
  | "canvas-events" // Canvas-level event handling (legacy)
  | "viewport-changes" // Viewport scale/offset changes (legacy)
  | "auto-layout" // Auto-layout calculations
  | "event-propagation" // Event bubbling and propagation (legacy)
  | "mouse-dispatcher" // Event dispatcher system (alias for "dispatcher")
  | "all"; // Enable all debug points

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

export interface DependencyTrackingConfig {
  enabled: boolean;
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

/**
 * Get emoji for debug point category
 */
export function getDebugEmoji(point: DebugPoint): string {
  const emojiMap: Record<DebugPoint, string> = {
    dispatcher: "🎯",
    "hit-testing": "🔍",
    routing: "🔗",
    surface: "🌍",
    "surface-interaction": "🌍",
    "frame-interaction": "📦",
    "selection-interaction": "📋",
    "handler-registry": "📝",
    performance: "⚡",
    "visual-debug": "👁️",
    "surface-interactions": "🏠",
    "surface-dock": "🚢",
    "frame-metrics": "📏",
    dependencies: "🧠",
    health: "🏥",
    "canvas-events": "🎨",
    "viewport-changes": "🔍",
    "auto-layout": "📐",
    "event-propagation": "📡",
    "mouse-dispatcher": "🖱️", // Alias for dispatcher
    all: "🚀",
  };
  return emojiMap[point] || "🔧";
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
