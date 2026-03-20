/**
 * Debug Point Management and Utilities
 *
 * Delegates to the module registry for all point metadata.
 * `DebugPoint` is now `string` — modules register dynamically,
 * so compile-time enumeration is no longer possible.
 */

import {
  getAllPointKeys,
  getTagDef as registryGetTagDef,
  getPointEmoji,
  buildFlatConfig,
} from "../config";
import type { TagDef } from "./debugsy-point-types";

// ============================================================================
// TYPES — widened to string for dynamic module registration
// ============================================================================

/** Runtime-validated debug point identifier */
export type DebugPoint = string;

// ============================================================================
// RE-EXPORTS (compatibility)
// ============================================================================

export { DEBUG_POINT_CONFIG } from "./debugsy-point-config";
export type { DebugPointConfig, TagDef } from "./debugsy-point-types";

// ============================================================================
// UTILITY FUNCTIONS — delegates to registry
// ============================================================================

export function getDebugPointEmoji(point: DebugPoint): string {
  return getPointEmoji(point);
}

export function getDebugPointsByCategory(category: string): DebugPoint[] {
  const flat = buildFlatConfig();
  return Object.entries(flat)
    .filter(([_, config]) => config.category === category)
    .map(([point]) => point);
}

export function getAllDebugPoints(): DebugPoint[] {
  return getAllPointKeys();
}

/**
 * Points to show in the control panel.
 * In the new module UI, this is superseded by module-nav;
 * kept for backward compat with v1 flat grid.
 */
export function getLookDebugPoints(): DebugPoint[] {
  const flat = buildFlatConfig();
  return Object.entries(flat)
    .filter(([_, config]) => config.look)
    .map(([key]) => key);
}

export function getTagDef(
  point: DebugPoint,
  tag: string,
): TagDef | null {
  const cfg = registryGetTagDef(point, tag);
  if (!cfg) return null;
  return cfg as TagDef;
}
