import { useCallback, useMemo } from "react";
import {
  type DebugLogEntry,
  type DebugPoint,
  type DependencyFilter,
  type DependencyLogLevel,
} from "../../shared/debug-constants";
import {
  dependencyStateControls,
  getGlobalDebugState,
} from "../../shared/debug-state";
import {
  clearDebugDisplayContent,
  notifySubscribers,
  setDebugDisplayContent,
  useDebugDisplayContent,
  useDebugSubscription,
} from "./debug-notifications";
import {
  type HealthMetrics,
  type HealthSnapshotConfig,
} from "./health-snapshot";

// Import the unified system
import {
  initializeUnifiedDebugSystem,
  type UnifiedSurfaceDebug,
} from "../../shared/global-debug-manager";

// Re-export types for backward compatibility
export type { DebugLogEntry, DebugPoint, DependencyFilter, DependencyLogLevel };

/**
 * TypeScript interface for backward compatibility
 * @deprecated Use UnifiedSurfaceDebug instead
 */
export interface GlobalDebugManager extends UnifiedSurfaceDebug {}

/**
 * Global type declarations to properly type globalThis extensions
 */
declare global {
  var __SURFACE_DEBUG_MANAGER: GlobalDebugManager | undefined;
  var __SURFACE_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
  var __debugSanitizationLogged: boolean | undefined;
  // REMOVED: var surfaceDebug - now handled by unified system
}

/**
 * Safe size estimation that handles circular references and complex objects
 * @deprecated Use the unified system instead
 */
function estimateDataSize(data: any): number {
  if (!data) return 0;

  // Handle primitives
  if (typeof data === "string") return data.length;
  if (typeof data === "number") return 8; // Approximate bytes
  if (typeof data === "boolean") return 4; // Approximate bytes
  if (typeof data === "function") return data.toString().length;

  // For objects, avoid JSON.stringify which fails on circular references
  if (typeof data === "object") {
    try {
      // Use a simple heuristic based on keys and structure
      if (Array.isArray(data)) {
        return 50 + data.length * 20; // Rough estimate: 50 bytes overhead + 20 per item
      } else {
        const keys = Object.keys(data);
        return 100 + keys.length * 30; // Rough estimate: 100 bytes overhead + 30 per property
      }
    } catch {
      return 500; // Fallback estimate for complex objects
    }
  }

  return 50; // Default fallback
}

// Cache for stable debug objects per debug point
const stableDebugCache = new Map<DebugPoint | "global", StableDebugInterface>();

/**
 * Stable debug interface without problematic getters
 * This interface provides the same functionality but with stable references
 */
interface StableDebugInterface {
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
  getDependencyStatus: () => any;

  // State property for compatibility with existing components
  state: {
    enabled: DebugPoint[];
    console: boolean;
    visual: boolean;
    performance: boolean;
  };
}

/**
 * Create a stable debug interface for a specific debug point
 */
function createStableDebugInterface(
  point: DebugPoint | "global"
): StableDebugInterface {
  // Ensure unified system is initialized
  if (!globalThis.surfaceDebug) {
    initializeUnifiedDebugSystem();
  }

  const unified = globalThis.surfaceDebug;

  // Create stable interface that delegates to unified system
  const stable: StableDebugInterface = {
    // Core logging - delegate to unified system
    log: unified.log,
    warn: unified.warn,
    error: unified.error,
    critical: unified.critical,
    time: unified.time,
    timeEnd: unified.timeEnd,

    // State checking - compute enabled state once for this point
    enabled: point === "global" ? unified.enabled : unified.isEnabled(point),
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
    getDependencyStatus: unified.getDependencyStatus,

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
 * Centralized debug hook - now returns stable debug interfaces per point
 * FIXED: Returns stable objects without problematic getters for React dependencies
 */
export const useDebug = (point: DebugPoint = "all"): StableDebugInterface => {
  // Use useMemo to ensure the same object is returned for the same point
  return useMemo(() => {
    // Check cache first
    if (stableDebugCache.has(point)) {
      return stableDebugCache.get(point)!;
    }

    // Create new stable interface
    const stable = createStableDebugInterface(point);

    // Cache it
    stableDebugCache.set(point, stable);

    return stable;
  }, [point]);
};

// REMOVED: All the old initializeGlobalDebugManager code - now handled by unified system

/**
 * Unified dependency state hook - replaces the old useDependencyState from debug-deps.ts
 * UNIFIED: Now uses debug point system for enabled state
 */
export const useDependencyState = () => {
  // Subscribe to debug state changes
  useDebugSubscription();

  const globalDebugState = getGlobalDebugState();

  const getDependencyLogs = useCallback(() => {
    return globalDebugState.logs.filter(
      (log) => log.point === "dependencies"
    ) as Array<DebugLogEntry & { point: "dependencies" }>;
  }, [globalDebugState.logs]);

  const setFilter = useCallback((filter: DependencyFilter) => {
    dependencyStateControls.setFilter(filter);
    notifySubscribers();
  }, []);

  const setLogLevel = useCallback((level: DependencyLogLevel) => {
    dependencyStateControls.setLevel(level);
    notifySubscribers();
  }, []);

  const enable = useCallback(() => {
    dependencyStateControls.setEnabled(true);
    notifySubscribers();
  }, []);

  const disable = useCallback(() => {
    dependencyStateControls.setEnabled(false);
    notifySubscribers();
  }, []);

  return {
    // State - now unified through debug point system
    enabled: dependencyStateControls.getEnabled(),
    logLevel: dependencyStateControls.getLevel(),
    filter: dependencyStateControls.getFilter(),
    logs: getDependencyLogs(),

    // Controls - same interface, unified implementation
    enable,
    disable,
    setLogLevel,
    setFilter,
  };
};

// Re-export utilities
export {
  clearDebugDisplayContent,
  setDebugDisplayContent,
  useDebugDisplayContent,
  type HealthMetrics,
  type HealthSnapshotConfig,
};
