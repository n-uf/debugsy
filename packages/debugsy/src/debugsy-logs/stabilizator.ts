/**
 * Debugsy Stabilizator
 *
 * RESPONSIBILITY: Provides stable, React-safe interfaces to the debugsy system
 * - Eliminates problematic getters that cause React dependency instability
 * - Provides caching for stable object references
 * - Converts dynamic properties to static snapshots for React components
 *
 * The "Stabilizator" name reflects its core purpose: stabilizing dynamic debugsy
 * interfaces for safe use in React dependency arrays and memoization.
 */

import { type DebugPoint } from "../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";
import { getGlobalDebugState } from "../debugsy-space/debugsy-space-settings";

/**
 * Stable debugsy interface without problematic getters
 * This interface provides the same functionality but with stable references
 */
export interface StableDebugsyInterface {
  // Core logging - same as DebugsySpace
  log: (
    point: DebugPoint,
    message: string,
    data?: any,
    level?: "info" | "warn" | "error" | "critical" | "success"
  ) => void;
  warn: (point: DebugPoint, message: string, data?: any) => void;
  error: (point: DebugPoint, message: string, data?: any) => void;
  critical: (point: DebugPoint, message: string, data?: any) => void;
  time: (point: DebugPoint, label: string) => void;
  timeEnd: (point: DebugPoint, label: string) => void;

  // State checking - converted from getters to methods
  enabled: boolean; // Static value for this debug point
  isEnabled: (point: DebugPoint) => boolean;
  showVisual: (point: DebugPoint) => boolean;

  // Control functions - same as DebugsySpace
  enable: (point: DebugPoint) => void;
  disable: (point: DebugPoint) => void;
  toggle: (point: DebugPoint) => void;
  enableAll: () => void;
  disableAll: () => void;

  // Configuration - same as DebugsySpace
  setConsoleEnabled: (enabled: boolean) => void;
  setVisualEnabled: (enabled: boolean) => void;
  setPerformanceEnabled: (enabled: boolean) => void;

  // Logs management - same as DebugsySpace
  getLogs: () => any[];
  clearLogs: () => void;

  // Simplified state access without problematic getters
  getDebugState: () => any;
  getDepsSettings: () => any;

  // State property for compatibility with existing components
  state: {
    enabled: DebugPoint[];
    console: boolean;
    visual: boolean;
    performance: boolean;
  };
}

// Cache for stable debugsy objects per debug point
const stableDebugsyCache = new Map<
  DebugPoint | "global",
  StableDebugsyInterface
>();

/**
 * Create a stable debugsy interface for a specific debug point
 */
function createStableDebugsyInterface(
  point: DebugPoint | "global"
): StableDebugsyInterface {
  // Ensure unified system is initialized
  if (!globalThis.debugsySpace) {
    initializeDebugsySpace();
  }

  const unified = globalThis.debugsySpace;

  // Create stable interface that delegates to unified system
  const stable: StableDebugsyInterface = {
    // Core logging - delegate to unified system
    log: unified.log,
    warn: unified.warn,
    error: unified.error,
    critical: unified.critical,
    time: unified.time,
    timeEnd: unified.timeEnd,

    // State checking - compute enabled state once for this point
    enabled:
      point === "global" ? unified.isEnabled("all") : unified.isEnabled(point),
    isEnabled: unified.isEnabled,
    showVisual: unified.showVisual,

    // Control functions - delegate to unified system
    enable: unified.enable,
    disable: unified.disable,
    toggle: unified.toggle,
    enableAll: unified.enableAll,
    disableAll: unified.disableAll,

    // Configuration - delegate to unified system
    setConsoleEnabled: unified.setConsoleEnabled,
    setVisualEnabled: unified.setVisualEnabled,
    setPerformanceEnabled: unified.setPerformanceEnabled,

    // Logs management - delegate to unified system
    getLogs: unified.getLogs,
    clearLogs: unified.clearLogs,

    // Simplified state access - delegate to unified system methods
    getDebugState: unified.getDebugState,
    getDepsSettings: unified.getDepsSettings,

    // State property for compatibility with existing components
    // Get snapshot of current state at creation time to avoid getter instability
    state: {
      enabled: Array.from(getGlobalDebugState().enabled),
      console: getGlobalDebugState().console,
      visual: getGlobalDebugState().visual,
      performance: getGlobalDebugState().performance,
    },
  };

  return stable;
}

/**
 * Get or create a stable debugsy interface for a specific debug point
 * Uses caching to ensure the same object reference is returned for the same point
 */
export function getStableDebugsyInterface(
  point: DebugPoint | "global" = "all"
): StableDebugsyInterface {
  // Check cache first
  if (stableDebugsyCache.has(point)) {
    return stableDebugsyCache.get(point)!;
  }

  // Create new stable interface
  const stable = createStableDebugsyInterface(point);

  // Cache it
  stableDebugsyCache.set(point, stable);

  return stable;
}

/**
 * Clear the stable debugsy cache
 * Useful for testing or when the underlying system changes significantly
 */
export function clearStableDebugsyCache(): void {
  stableDebugsyCache.clear();
}

/**
 * Get cache size for debugging/monitoring
 */
export function getStableDebugsyCacheSize(): number {
  return stableDebugsyCache.size;
}
