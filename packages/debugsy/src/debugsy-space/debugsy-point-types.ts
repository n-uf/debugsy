/**
 * Debug Point Type Definitions
 *
 * Contains all manually defined interfaces and types for debug point system.
 * These are the foundational types that don't depend on the configuration.
 */

/**
 * Tag definition — metadata for a tag within a debug point (observability taxonomy).
 * Tags are labels attached to log entries for selective filtering and grouping.
 */
export interface TagDef {
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
  label: string;
  category: "core" | "interaction" | "performance" | "system" | "surface";
  priority?: number;
  look?: boolean;
  tags?: Record<string, TagDef>;
}
