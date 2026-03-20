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

import { type DebugPoint } from "../../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../../debugsy-space/debugsy-space";
import { getGlobalDebugState } from "../../debugsy-space/debugsy-space-settings";

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

// Single global stable debugsy interface
let globalStableInterface: StableDebugsyInterface | null = null;

/**
 * Create a stable debugsy interface.
 *
 * State-checking and control methods use live delegation (arrow wrappers)
 * so that HMR-triggered re-initialization of `globalThis.debugsy` is
 * picked up without needing to clear the stabilizator cache.
 */
function createStableDebugsyInterface(): StableDebugsyInterface {
  if (!globalThis.debugsy) {
    initializeDebugsySpace();
  }

  const stable: StableDebugsyInterface = {
    log: (...args) => globalThis.debugsy.log(...args),
    warn: (...args) => globalThis.debugsy.warn(...args),
    error: (...args) => globalThis.debugsy.error(...args),
    critical: (...args) => globalThis.debugsy.critical(...args),
    time: (...args) => globalThis.debugsy.time(...args),
    timeEnd: (...args) => globalThis.debugsy.timeEnd(...args),

    isEnabled: (point) => globalThis.debugsy.isEnabled(point),
    showVisual: (point) => globalThis.debugsy.showVisual(point),

    enable: (point) => globalThis.debugsy.enable(point),
    disable: (point) => globalThis.debugsy.disable(point),
    toggle: (point) => globalThis.debugsy.toggle(point),
    enableAll: () => globalThis.debugsy.enableAll(),
    disableAll: () => globalThis.debugsy.disableAll(),

    setConsoleEnabled: (v) => globalThis.debugsy.setConsoleEnabled(v),
    setVisualEnabled: (v) => globalThis.debugsy.setVisualEnabled(v),
    setPerformanceEnabled: (v) => globalThis.debugsy.setPerformanceEnabled(v),

    getLogs: () => globalThis.debugsy.getLogs(),
    clearLogs: () => globalThis.debugsy.clearLogs(),

    getDebugState: () => globalThis.debugsy.getDebugState(),
    getDepsSettings: () => globalThis.debugsy.getDepsSettings(),

    get state() {
      return {
        enabled: Array.from(getGlobalDebugState().enabled),
        console: getGlobalDebugState().console,
        visual: getGlobalDebugState().visual,
        performance: getGlobalDebugState().performance,
      };
    },
  };

  return stable;
}

/**
 * Get the global stable debugsy interface
 * Uses caching to ensure the same object reference is returned
 */
export function getStableDebugsyInterface(): StableDebugsyInterface {
  // Check cache first
  if (globalStableInterface) {
    return globalStableInterface;
  }

  // Create new stable interface
  globalStableInterface = createStableDebugsyInterface();

  return globalStableInterface;
}

/**
 * Clear the stable debugsy cache
 * Useful for testing or when the underlying system changes significantly
 */
export function clearStableDebugsyCache(): void {
  globalStableInterface = null;
}

/**
 * Get cache status for debugging/monitoring
 */
export function getStableDebugsyCacheStatus(): { cached: boolean } {
  return { cached: globalStableInterface !== null };
}
