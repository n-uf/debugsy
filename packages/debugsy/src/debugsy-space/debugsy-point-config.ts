/**
 * Debug Point Configuration
 *
 * Centralized configuration for all debug points in the system.
 * This file contains ONLY the configuration data - no utility functions.
 */

/**
 * Log type metadata for specific log types within a debug point
 */
export interface LogTypeConfig {
  icon: string;
  description?: string;
}

/**
 * Unified Debug Point Configuration
 * Single source of truth for all debug point metadata
 */
export interface DebugPointConfig {
  emoji: string;
  description: string;
  label: string; // Short display name for UI
  category: "core" | "interaction" | "performance" | "system";
  priority?: number; // For interaction handlers
  look?: boolean; // Whether to show in main control panel (defaults to true for non-system)
  logTypes?: Record<string, LogTypeConfig>; // Custom log type configurations for this debug point
}

/**
 * Complete debug point configuration mapping
 * SINGLE SOURCE OF TRUTH - Add/remove debug points here only!
 * The DebugPoint type is automatically derived from these keys.
 */
export const DEBUG_POINT_CONFIG = {
  // Core System
  dispatcher: {
    emoji: "🎯",
    description: "Central mouse event dispatcher coordination",
    label: "Dispatcher",
    category: "core" as const,
    look: true,
  },
  "hit-testing": {
    emoji: "🔍",
    description: "Priority-based hit test routing & decisions",
    label: "Hit Test",
    category: "core" as const,
    look: true,
  },
  routing: {
    emoji: "🔗",
    description: "Event routing decisions with conflict resolution",
    label: "Routing",
    category: "core" as const,
    look: true,
  },

  // Surface & Components
  surface: {
    emoji: "🌍",
    description: "Surface component lifecycle",
    label: "Surface",
    category: "core" as const,
    look: true,
  },
  "surface-interactions": {
    emoji: "🏠",
    description: "Surface component coordination",
    label: "Surface.io",
    category: "core" as const,
    look: true,
  },
  "surface-dock": {
    emoji: "🚢",
    description: "SurfaceDock component lifecycle",
    label: "Dock",
    category: "core" as const,
    look: true,
  },

  // Interactions (with priorities)
  "surface-interaction": {
    emoji: "🌍",
    description: "Viewport pan/zoom interactions",
    label: "Viewport",
    category: "interaction" as const,
    priority: 999,
    look: false, // Advanced/specialized
  },
  "frame-interaction": {
    emoji: "📦",
    description: "Frame drag/resize interactions",
    label: "Frame",
    category: "interaction" as const,
    priority: 2,
    look: true,
  },
  "selection-interaction": {
    emoji: "📋",
    description: "Multi-frame selection system",
    label: "Selection",
    category: "interaction" as const,
    priority: 998,
    look: true,
  },

  // Registry & Management
  "handler-registry": {
    emoji: "📝",
    description: "Handler registration/unregistration lifecycle",
    label: "Registry",
    category: "core" as const,
    look: true,
  },
  "frame-metrics": {
    emoji: "📏",
    description: "Frame positioning and sizing state",
    label: "Metrics",
    category: "core" as const,
    look: false, // Specialized/verbose
  },

  // Performance & Monitoring
  performance: {
    emoji: "⚡",
    description: "Event throughput, timing, and efficiency",
    label: "Perf",
    category: "performance" as const,
    look: true,
  },
  dependencies: {
    emoji: "🧠",
    description: "React hook dependency tracking and optimization",
    label: "Deps",
    category: "performance" as const,
    look: false, // Specialized debugging - has its own detailed formatter
    logTypes: {
      "dependency-change": {
        icon: "🔄",
        description: "Dependencies changed in a component",
      },
      "function-recreation": {
        icon: "📝",
        description: "Function reference changed",
      },
      "object-recreation": {
        icon: "📦",
        description: "Object reference changed",
      },
      "primitive-change": {
        icon: "🔧",
        description: "Primitive value changed",
      },
      "render-warning": {
        icon: "⚠️",
        description: "High render count detected",
      },
      "circuit-breaker": {
        icon: "🚨",
        description: "Circuit breaker activated",
      },
      "emergency-stop": {
        icon: "🛑",
        description: "Emergency stop activated",
      },
      "hook-execution": {
        icon: "🪝",
        description: "Hook execution tracking",
      },
    },
  },
  health: {
    emoji: "🏥",
    description: "System health snapshots and metrics - always enabled",
    label: "Health",
    category: "system" as const,
    look: false, // Always enabled, no need for button
  },

  // Visual & Debug
  "visual-debug": {
    emoji: "👁️",
    description: "Visual debug overlays and priority zones",
    label: "Visual",
    category: "system" as const,
    look: true,
  },

  // Aliases
  "mouse-dispatcher": {
    emoji: "🖱️",
    description: "Event dispatcher system (alias for dispatcher)",
    label: "MouseDisp",
    category: "core" as const,
    look: false, // Alias, use main dispatcher instead
  },

  // Special
  all: {
    emoji: "🚀",
    description: "Enable all debug points",
    label: "All",
    category: "system" as const,
    look: false, // Special control, handled separately
  },
} as const;

/**
 * Debug point types - AUTOMATICALLY DERIVED from DEBUG_POINT_CONFIG keys
 * 🎯 SINGLE SOURCE OF TRUTH: Add/remove debug points in DEBUG_POINT_CONFIG only!
 */
export type DebugPoint = keyof typeof DEBUG_POINT_CONFIG;

// ============================================================================
// 🎯 LOG TYPE INFERENCE - Automatically derive types from configuration
// ============================================================================

/**
 * Extract log type keys from a debug point configuration
 */
export type ExtractLogTypes<T> = T extends { logTypes: infer U }
  ? U extends Record<infer K, any>
    ? K
    : never
  : never;

/**
 * Extract all log types from all debug point configurations
 * This automatically creates a union of all logType keys defined in DEBUG_POINT_CONFIG
 */
export type AllConfiguredLogTypes = {
  [K in keyof typeof DEBUG_POINT_CONFIG]: ExtractLogTypes<
    (typeof DEBUG_POINT_CONFIG)[K]
  >;
}[keyof typeof DEBUG_POINT_CONFIG];

/**
 * Legacy type aliases for backwards compatibility
 * These are now automatically inferred subsets of the main LogType
 */
export type DependencyLogType = ExtractLogTypes<
  (typeof DEBUG_POINT_CONFIG)["dependencies"]
>;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get debug points by category for organized display
 */
export const getDebugPointsByCategory = (
  category: DebugPointConfig["category"]
) => {
  return Object.entries(DEBUG_POINT_CONFIG)
    .filter(([_, config]) => config.category === category)
    .map(([key, _]) => key as DebugPoint);
};

/**
 * Get debug points that should be shown in the control panel
 * Uses the look flag with smart defaults
 */
export const getLookDebugPoints = (): DebugPoint[] => {
  return Object.entries(DEBUG_POINT_CONFIG)
    .filter(([_, config]) => {
      // Default: show if not explicitly set to false and not system category
      const defaultShow = config.category !== "system";
      return config.look ?? defaultShow;
    })
    .map(([key, _]) => key as DebugPoint);
};

/**
 * Get log type configuration for a specific debug point and log type
 */
export const getLogTypeConfig = (
  point: DebugPoint,
  logType: string
): LogTypeConfig | null => {
  const pointConfig = DEBUG_POINT_CONFIG[point] as DebugPointConfig;
  return pointConfig.logTypes?.[logType] || null;
};
