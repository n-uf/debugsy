/**
 * Debug Module Registry
 *
 * Runtime registry for debug modules. Packages register their modules
 * at import time; debugsy merges them with builtins and exposes
 * a unified view for the UI and logging system.
 *
 * Lifecycle:
 *   1. Debugsy loads → builtin modules registered automatically
 *   2. Consumer packages call registerModule() on import
 *   3. UI reads getModules() / getPointDef() for rendering
 *   4. dsy.log(point, …) validates point against the registry
 */

import type {
  DebugModuleDef,
  DebugPointDef,
  LogTypeConfig,
  ModuleLedState,
} from "./types";

// =============================================================================
// Internal state
// =============================================================================

const modules = new Map<string, DebugModuleDef>();

/** Keys of builtin modules — always sorted first in getModules() */
const BUILTIN_KEYS = new Set<string>();

/** Flat lookup: pointKey → moduleKey (built lazily, invalidated on register) */
let pointIndex: Map<string, string> | null = null;

function rebuildIndex(): void {
  pointIndex = new Map();
  for (const [moduleKey, mod] of modules) {
    for (const pointKey of Object.keys(mod.points)) {
      pointIndex.set(pointKey, moduleKey);
    }
  }
}

function ensureIndex(): Map<string, string> {
  if (!pointIndex) rebuildIndex();
  return pointIndex!;
}

// =============================================================================
// Registration API
// =============================================================================

/**
 * Register a debug module. Idempotent — re-registering the same key
 * replaces the previous definition (safe for HMR).
 */
export function registerModule(
  key: string,
  def: DebugModuleDef,
  options?: { builtin?: boolean },
): void {
  modules.set(key, def);
  if (options?.builtin) BUILTIN_KEYS.add(key);
  pointIndex = null; // invalidate index
}

// =============================================================================
// Query API
// =============================================================================

/** All registered modules — builtins first, then external in insertion order */
export function getModules(): ReadonlyMap<string, DebugModuleDef> {
  if (BUILTIN_KEYS.size === 0) return modules;
  const sorted = new Map<string, DebugModuleDef>();
  for (const key of BUILTIN_KEYS) {
    const def = modules.get(key);
    if (def) sorted.set(key, def);
  }
  for (const [key, def] of modules) {
    if (!BUILTIN_KEYS.has(key)) sorted.set(key, def);
  }
  return sorted;
}

/** Get the module definition for a module key */
export function getModuleDef(moduleKey: string): DebugModuleDef | undefined {
  return modules.get(moduleKey);
}

/** Get the point definition for a point key (across all modules) */
export function getPointDef(pointKey: string): DebugPointDef | undefined {
  const moduleKey = ensureIndex().get(pointKey);
  if (!moduleKey) return undefined;
  return modules.get(moduleKey)?.points[pointKey];
}

/** Get the module key that owns a point */
export function getModuleForPoint(pointKey: string): string | undefined {
  return ensureIndex().get(pointKey);
}

/** All registered point keys (flat list) */
export function getAllPointKeys(): string[] {
  return Array.from(ensureIndex().keys());
}

/** Point keys for a specific module */
export function getModulePointKeys(moduleKey: string): string[] {
  const mod = modules.get(moduleKey);
  return mod ? Object.keys(mod.points) : [];
}

/** Get emoji for a point key */
export function getPointEmoji(pointKey: string): string {
  return getPointDef(pointKey)?.emoji ?? "🔧";
}

/** Get label for a point key */
export function getPointLabel(pointKey: string): string {
  return getPointDef(pointKey)?.label ?? pointKey;
}

/** Get log type config for a specific point + logType */
export function getLogTypeConfig(
  pointKey: string,
  logType: string,
): LogTypeConfig | undefined {
  return getPointDef(pointKey)?.logTypes?.[logType];
}

/** Whether a point key is known to the registry */
export function isKnownPoint(pointKey: string): boolean {
  return ensureIndex().has(pointKey);
}

// =============================================================================
// Module LED state
// =============================================================================

/**
 * Compute the LED state for a module given a predicate that tests
 * whether a point is enabled.
 */
export function getModuleLedState(
  moduleKey: string,
  isEnabled: (pointKey: string) => boolean,
): ModuleLedState {
  const keys = getModulePointKeys(moduleKey);
  if (keys.length === 0) return "all-off";
  let on = 0;
  for (const k of keys) {
    if (isEnabled(k)) on++;
  }
  if (on === keys.length) return "all-on";
  if (on > 0) return "partial";
  return "all-off";
}

// =============================================================================
// Compatibility: build a flat config object from the registry
// (used by legacy code that references DEBUG_POINT_CONFIG directly)
// =============================================================================

export interface FlatPointConfig {
  emoji: string;
  description: string;
  label: string;
  category: string;
  look: boolean;
  logTypes?: Record<string, LogTypeConfig>;
}

/**
 * Build a flat `Record<string, FlatPointConfig>` from all registered modules.
 * The `category` field is set to the module key for grouping.
 */
export function buildFlatConfig(): Record<string, FlatPointConfig> {
  const flat: Record<string, FlatPointConfig> = {};
  for (const [moduleKey, mod] of modules) {
    for (const [pointKey, def] of Object.entries(mod.points)) {
      flat[pointKey] = {
        emoji: def.emoji,
        description: def.description,
        label: def.label,
        category: moduleKey,
        look: true,
        logTypes: def.logTypes,
      };
    }
  }
  return flat;
}
