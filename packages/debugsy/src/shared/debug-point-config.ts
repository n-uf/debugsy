/**
 * Debug Point Configuration
 *
 * Centralized configuration for all debug points in the system.
 * This file contains ONLY the configuration data - no utility functions.
 */

/**
 * Unified Debug Point Configuration
 * Single source of truth for all debug point metadata
 */
export interface DebugPointConfig {
  emoji: string;
  description: string;
  category: "core" | "interaction" | "performance" | "legacy" | "system";
  priority?: number; // For interaction handlers
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
    category: "core" as const,
  },
  "hit-testing": {
    emoji: "🔍",
    description: "Priority-based hit test routing & decisions",
    category: "core" as const,
  },
  routing: {
    emoji: "🔗",
    description: "Event routing decisions with conflict resolution",
    category: "core" as const,
  },

  // Surface & Components
  surface: {
    emoji: "🌍",
    description: "Surface component lifecycle",
    category: "core" as const,
  },
  "surface-interactions": {
    emoji: "🏠",
    description: "Surface component coordination",
    category: "core" as const,
  },
  "surface-dock": {
    emoji: "🚢",
    description: "SurfaceDock component lifecycle",
    category: "core" as const,
  },

  // Interactions (with priorities)
  "surface-interaction": {
    emoji: "🌍",
    description: "Viewport pan/zoom interactions",
    category: "interaction" as const,
    priority: 999,
  },
  "frame-interaction": {
    emoji: "📦",
    description: "Frame drag/resize interactions",
    category: "interaction" as const,
    priority: 2,
  },
  "selection-interaction": {
    emoji: "📋",
    description: "Multi-frame selection system",
    category: "interaction" as const,
    priority: 998,
  },

  // Registry & Management
  "handler-registry": {
    emoji: "📝",
    description: "Handler registration/unregistration lifecycle",
    category: "core" as const,
  },
  "frame-metrics": {
    emoji: "📏",
    description: "Frame positioning and sizing state",
    category: "core" as const,
  },

  // Performance & Monitoring
  performance: {
    emoji: "⚡",
    description: "Event throughput, timing, and efficiency",
    category: "performance" as const,
  },
  dependencies: {
    emoji: "🧠",
    description: "React hook dependency tracking and optimization",
    category: "performance" as const,
  },
  health: {
    emoji: "🏥",
    description: "System health snapshots and metrics - always enabled",
    category: "system" as const,
  },

  // Visual & Debug
  "visual-debug": {
    emoji: "👁️",
    description: "Visual debug overlays and priority zones",
    category: "system" as const,
  },

  // Legacy (Canvas Events)
  "canvas-events": {
    emoji: "🎨",
    description: "Canvas-level event handling (legacy)",
    category: "legacy" as const,
  },
  "viewport-changes": {
    emoji: "🔍",
    description: "Viewport scale/offset changes (legacy)",
    category: "legacy" as const,
  },
  "auto-layout": {
    emoji: "📐",
    description: "Auto-layout calculations",
    category: "legacy" as const,
  },
  "event-propagation": {
    emoji: "📡",
    description: "Event bubbling and propagation (legacy)",
    category: "legacy" as const,
  },

  // Aliases
  "mouse-dispatcher": {
    emoji: "🖱️",
    description: "Event dispatcher system (alias for dispatcher)",
    category: "core" as const,
  },

  // Special
  all: {
    emoji: "🚀",
    description: "Enable all debug points",
    category: "system" as const,
  },
} as const;

/**
 * Debug point types - AUTOMATICALLY DERIVED from DEBUG_POINT_CONFIG keys
 * 🎯 SINGLE SOURCE OF TRUTH: Add/remove debug points in DEBUG_POINT_CONFIG only!
 */
export type DebugPoint = keyof typeof DEBUG_POINT_CONFIG;
