import { useCallback } from "react";
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

/**
 * Centralized debug hook - now returns the unified surfaceDebug singleton
 * Provides granular control over different debug points without prop drilling
 * FIXED: Uses unified global debug system to prevent feedback loops
 */
export const useDebug = (point?: DebugPoint): UnifiedSurfaceDebug => {
  // Ensure unified system is initialized
  if (!globalThis.surfaceDebug) {
    initializeUnifiedDebugSystem();
  }

  // Always return the same unified singleton instance - no React dependencies!
  return globalThis.surfaceDebug;
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
