/**
 * Debug Point Type Definitions
 *
 * Contains all manually defined interfaces and types for debug point system.
 * These are the foundational types that don't depend on the configuration.
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
  category: "core" | "interaction" | "performance" | "system" | "surface";
  priority?: number; // For interaction handlers
  look?: boolean; // Whether to show in main control panel (defaults to true for non-system)
  logTypes?: Record<string, LogTypeConfig>; // Custom log type configurations for this debug point
}
