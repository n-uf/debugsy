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
import { getDebugsy } from "../../debugsy-space/debugsy-space";
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
 * so that HMR-triggered re-initialization of the debug space is
 * picked up without needing to clear the stabilizator cache.
 */
function createStableDebugsyInterface(): StableDebugsyInterface {

  const stable: StableDebugsyInterface = {
    log: (...args) => getDebugsy().log(...args),
    warn: (...args) => getDebugsy().warn(...args),
    error: (...args) => getDebugsy().error(...args),
    critical: (...args) => getDebugsy().critical(...args),
    time: (...args) => getDebugsy().time(...args),
    timeEnd: (...args) => getDebugsy().timeEnd(...args),

    isEnabled: (point) => getDebugsy().isEnabled(point),
    showVisual: (point) => getDebugsy().showVisual(point),

    enable: (point) => getDebugsy().enable(point),
    disable: (point) => getDebugsy().disable(point),
    toggle: (point) => getDebugsy().toggle(point),
    enableAll: () => getDebugsy().enableAll(),
    disableAll: () => getDebugsy().disableAll(),

    setConsoleEnabled: (v) => getDebugsy().setConsoleEnabled(v),
    setVisualEnabled: (v) => getDebugsy().setVisualEnabled(v),
    setPerformanceEnabled: (v) => getDebugsy().setPerformanceEnabled(v),

    getLogs: () => getDebugsy().getLogs(),
    clearLogs: () => getDebugsy().clearLogs(),

    getDebugState: () => getDebugsy().getDebugState(),
    getDepsSettings: () => getDebugsy().getDepsSettings(),

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
