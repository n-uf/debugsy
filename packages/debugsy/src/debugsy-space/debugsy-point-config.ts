/**
 * Debug Point Configuration
 *
 * Centralized configuration for all debug points in the system.
 * This file contains ONLY the configuration data - no utility functions or derived types.
 */

/**
 * Complete debug point configuration mapping
 * SINGLE SOURCE OF TRUTH - Add/remove debug points here only!
 * The DebugPoint type is automatically derived from these keys.
 */
export const DEBUG_POINT_CONFIG = {
  // Visual & Debug
  "visual-debug": {
    emoji: "👁️",
    description: "Visual debug overlays and priority zones",
    label: "Visual",
    category: "system" as const,
    look: true,
  },
  // Performance & Monitoring
  performance: {
    emoji: "⚡",
    description: "Event throughput, timing, and efficiency",
    label: "Perf",
    category: "performance" as const,
    look: true,
  },
  // Core System
  mouse: {
    emoji: "🎯",
    description: "Mouse event handling and coordination",
    label: "Mouse",
    category: "surface" as const,
    look: true,
  },
  "hit-testing": {
    emoji: "🔍",
    description: "Priority-based hit test routing & decisions",
    label: "Hit Test",
    category: "surface" as const,
    look: true,
  },
  routing: {
    emoji: "🔗",
    description: "Event routing decisions with conflict resolution",
    label: "Routing",
    category: "surface" as const,
    look: true,
  },

  // Surface & Components
  surface: {
    emoji: "🌍",
    description: "Surface component lifecycle",
    label: "Surface",
    category: "surface" as const,
    look: true,
  },
  "surface-interactions": {
    emoji: "🏠",
    description: "Surface component coordination",
    label: "Surface.io",
    category: "surface" as const,
    look: true,
  },
  "surface-dock": {
    emoji: "🚢",
    description: "SurfaceDock component lifecycle",
    label: "Dock",
    category: "surface" as const,
    look: true,
  },
  "pdf-surface": {
    emoji: "📄",
    description: "PDF Surface component lifecycle and rendering",
    label: "PDF Surface",
    category: "surface" as const,
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

  "frame-metrics": {
    emoji: "📏",
    description: "Frame positioning and sizing state",
    label: "Metrics",
    category: "surface" as const,
    look: false, // Specialized/verbose
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
      "mount-warning": {
        icon: "🔄",
        description: "High mount/unmount cycle count detected",
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

  // Special
  all: {
    emoji: "🚀",
    description: "Enable all debug points",
    label: "All",
    category: "system" as const,
    look: false, // Special control, handled separately
  },
} as const;
