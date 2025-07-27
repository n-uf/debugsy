/**
 * Debug Point Management and Utilities
 *
 * Central module for debug point configuration, utilities, and related logic.
 * Contains all inferred types and utility functions for the debug point system.
 */

// Import types and configuration
import { DEBUG_POINT_CONFIG } from "./debugsy-point-config";
import type { DebugPointConfig, LogTypeConfig } from "./debugsy-point-types";

// ============================================================================
// 🎯 INFERRED TYPES - Automatically derived from DEBUG_POINT_CONFIG
// ============================================================================

/**
 * Debug point types - AUTOMATICALLY DERIVED from DEBUG_POINT_CONFIG keys
 * 🎯 SINGLE SOURCE OF TRUTH: Add/remove debug points in DEBUG_POINT_CONFIG only!
 */
export type DebugPoint = keyof typeof DEBUG_POINT_CONFIG;

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
 * Generic log type union - AUTOMATICALLY INFERRED from debug point configurations
 * 🎯 SINGLE SOURCE OF TRUTH: Add log types to DEBUG_POINT_CONFIG.logTypes only!
 *
 * This type automatically includes:
 * - All logType keys from all debug points in DEBUG_POINT_CONFIG
 * - STRICT: Only explicitly configured log types allowed (no arbitrary strings)
 */
export type LogType = AllConfiguredLogTypes;

// ============================================================================
// RE-EXPORTS
// ============================================================================

// Re-export configuration and types for external use
export { DEBUG_POINT_CONFIG } from "./debugsy-point-config";
export type { DebugPointConfig, LogTypeConfig } from "./debugsy-point-types";

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get emoji for debug point category
 * UNIFIED FUNCTION - replaces all getDebugEmoji, getPointEmoji variants
 */
export function getDebugPointEmoji(point: DebugPoint): string {
  return DEBUG_POINT_CONFIG[point]?.emoji || "🔧";
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
 * Get debug points that should be shown in the control panel
 * Uses the look flag with smart defaults
 */
export function getLookDebugPoints(): DebugPoint[] {
  return Object.entries(DEBUG_POINT_CONFIG)
    .filter(([_, config]) => {
      // Default: show if not explicitly set to false and not system category
      const defaultShow = config.category !== "system";
      return config.look ?? defaultShow;
    })
    .map(([key, _]) => key as DebugPoint);
}

/**
 * Get log type configuration for a specific debug point and log type
 */
export function getLogTypeConfig(
  point: DebugPoint,
  logType: string
): LogTypeConfig | null {
  const pointConfig = DEBUG_POINT_CONFIG[point] as DebugPointConfig;
  return pointConfig.logTypes?.[logType] || null;
}
