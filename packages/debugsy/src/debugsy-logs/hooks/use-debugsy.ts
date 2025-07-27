import { useMemo } from "react";
import {
  type DebugLogEntry,
  type DebugPoint,
} from "../../debugsy-space/debugsy-constants";
import { getGlobalDebugState } from "../../debugsy-space/debugsy-space-settings";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../hooks/debug-notifications";
import {
  type HealthMetrics,
  type HealthSnapshotConfig,
} from "../hooks/health-snapshot";

// Import the unified system
import {
  initializeDebugsySpace,
  type DebugsySpace,
} from "../../debugsy-space/debugsy-space";

// Re-export types for backward compatibility
export type { DebugLogEntry, DebugPoint };

/**
 * Global type declarations to properly type globalThis extensions
 */
declare global {
  var __SURFACE_DEBUG_MANAGER: DebugsySpace | undefined;
  var __DEBUGSY_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
  var __debugsySanitizationLogged: boolean | undefined;
  // REMOVED: var surfaceDebug - now handled by unified system
}

// Cache for stable debugsy objects per debug point
const stableDebugsyCache = new Map<
  DebugPoint | "global",
  StableDebugsyInterface
>();

/**
 * Stable debugsy interface without problematic getters
 * This interface provides the same functionality but with stable references
 */
interface StableDebugsyInterface {
  // Core logging - same as UnifiedSurfaceDebug
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

  // Control functions - same as UnifiedSurfaceDebug
  enable: (point: DebugPoint) => void;
  disable: (point: DebugPoint) => void;
  toggle: (point: DebugPoint) => void;
  enableAll: () => void;
  disableAll: () => void;

  // Configuration - same as UnifiedSurfaceDebug
  setConsoleEnabled: (enabled: boolean) => void;
  setVisualEnabled: (enabled: boolean) => void;
  setPerformanceEnabled: (enabled: boolean) => void;

  // Logs management - same as UnifiedSurfaceDebug
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
 * Centralized debugsy hook - now returns stable debugsy interfaces per point
 * FIXED: Returns stable objects without problematic getters for React dependencies
 */
export const useDebugsy = (
  point: DebugPoint = "all"
): StableDebugsyInterface => {
  // Use useMemo to ensure the same object is returned for the same point
  return useMemo(() => {
    // Check cache first
    if (stableDebugsyCache.has(point)) {
      return stableDebugsyCache.get(point)!;
    }

    // Create new stable interface
    const stable = createStableDebugsyInterface(point);

    // Cache it
    stableDebugsyCache.set(point, stable);

    return stable;
  }, [point]);
};

// REMOVED: All the old initializeGlobalDebugManager code - now handled by unified system

// Re-export utilities
export {
  clearDebugDisplayContent,
  setDebugDisplayContent,
  type HealthMetrics,
  type HealthSnapshotConfig,
};
