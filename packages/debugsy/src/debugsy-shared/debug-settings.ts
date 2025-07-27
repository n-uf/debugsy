import superjson from "superjson";
import { notifySubscribers } from "../debugsy-logs/hooks/debug-notifications";
import { safeSuperjsonStringify } from "../debugsy-look/ui-logs/utils/json/json-core";
import type {
  DebugPoint,
  DebugState,
  DependencyFilter,
  DependencyLogLevel,
} from "./debug-constants";
import { getAllDebugPoints } from "./debug-constants";

// Global debug state (shared across all hook instances)
let globalDebugState: DebugState = {
  enabled: new Set(),
  console: true,
  visual: true,
  performance: false,
  logs: [],
  timers: new Map(),
  visualMessages: [],
  dependencies: {
    // REMOVED: enabled - now derived from debug point system
    level: "normal" as DependencyLogLevel,
    filter: "all" as DependencyFilter,
    allowedHooks: null,
    excludedHooks: [],
    throttleMs: 100,
  },
};

/**
 * Get the global debug state
 */
export function getGlobalDebugState(): DebugState {
  return globalDebugState;
}

/**
 * Debug configuration from environment or localStorage
 */
export function initializeDebugSettings(): void {
  if (typeof window === "undefined") return;

  // Check for debug configuration in localStorage
  const storedConfig = localStorage.getItem("surface-debug-config");
  if (storedConfig) {
    try {
      // Use superjson to safely parse any complex objects
      const config = superjson.parse(storedConfig) as any;
      if (config && typeof config === "object") {
        if (config.enabled && Array.isArray(config.enabled)) {
          globalDebugState.enabled = new Set(config.enabled);
        }
        if (typeof config.console === "boolean") {
          globalDebugState.console = config.console;
        }
        if (typeof config.visual === "boolean") {
          globalDebugState.visual = config.visual;
        }
        if (typeof config.performance === "boolean") {
          globalDebugState.performance = config.performance;
        }
      }
    } catch (e) {
      console.warn("Failed to parse stored debug config:", e);
    }
  }

  // Check for debug flags in URL parameters
  const params = new URLSearchParams(window.location.search);
  const debugParam = params.get("debug");
  if (debugParam) {
    const debugPoints = debugParam
      .split(",")
      .map((p) => p.trim()) as DebugPoint[];
    debugPoints.forEach((point) => {
      if (point === "all") {
        // Enable all debug points using the unified configuration
        globalDebugState.enabled = new Set(getAllDebugPoints());
      } else {
        globalDebugState.enabled.add(point);
      }
    });
  }

  // Check environment variables (for development)
  if (process.env.NODE_ENV === "development") {
    // Auto-enable basic debugging in development
    const devDebug = process.env.NEXT_PUBLIC_SURFACE_DEBUG;
    if (devDebug) {
      const points = devDebug.split(",").map((p) => p.trim()) as DebugPoint[];
      points.forEach((point) => globalDebugState.enabled.add(point));
    }
  }
}

/**
 * Save debug configuration to localStorage
 * UNIFIED: Now uses safeSuperjsonStringify for consistent safe serialization
 */
export function saveDebugSettings(): void {
  if (typeof window === "undefined") return;

  try {
    const config = {
      enabled: Array.from(globalDebugState.enabled),
      console: globalDebugState.console,
      visual: globalDebugState.visual,
      performance: globalDebugState.performance,
    };
    // Use unified safe superjson wrapper
    localStorage.setItem(
      "surface-debug-config",
      safeSuperjsonStringify(config)
    );
  } catch (e) {
    console.warn("Failed to save surface debug config:", e);
  }
}

/**
 * Debounced version of saveDebugSettings to prevent UI blocking
 * Batches multiple rapid changes into a single localStorage write
 */
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 100; // 100ms delay for batching

function debouncedSaveDebugSettings(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveDebugSettings();
    saveTimeout = null;
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Debug control functions for global state
 */
export const debugSettingsControls = {
  enable: (point: DebugPoint) => {
    globalDebugState.enabled.add(point);
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  disable: (point: DebugPoint) => {
    globalDebugState.enabled.delete(point);
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  enableAll: () => {
    // Enable all actual debug points instead of just adding "all" string
    getAllDebugPoints().forEach((point) => {
      globalDebugState.enabled.add(point);
    });
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  disableAll: () => {
    globalDebugState.enabled.clear();
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  setConsoleEnabled: (enabled: boolean) => {
    globalDebugState.console = enabled;
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  setVisualEnabled: (enabled: boolean) => {
    globalDebugState.visual = enabled;
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  setPerformanceEnabled: (enabled: boolean) => {
    globalDebugState.performance = enabled;
    debouncedSaveDebugSettings(); // ← Non-blocking, batched persistence
  },
  clearLogs: () => {
    globalDebugState.logs = [];
    // No need to save config for log clearing - it's transient state
  },
};

/**
 * Dependency tracking controls for global state
 * UNIFIED: Now uses debug point system instead of separate enabled state
 */
export const dependencySettingsControls = {
  setEnabled: (enabled: boolean) => {
    // Use unified debug point system instead of separate enabled state
    if (enabled) {
      globalDebugState.enabled.add("dependencies");
    } else {
      globalDebugState.enabled.delete("dependencies");
    }
    // Use debounced save like other debug controls
    debouncedSaveDebugSettings();
    // Notify subscribers for reactive UI updates (like debug-space deps methods)
    notifySubscribers();
  },
  setLevel: (level: DependencyLogLevel) => {
    globalDebugState.dependencies.level = level;
    // Notify subscribers for reactive UI updates
    notifySubscribers();
  },
  setFilter: (filter: DependencyFilter) => {
    globalDebugState.dependencies.filter = filter;
    // Notify subscribers for reactive UI updates
    notifySubscribers();
  },
  // Getters that derive from unified debug point system
  getEnabled: (): boolean => {
    return globalDebugState.enabled.has("dependencies");
  },
  getLevel: (): DependencyLogLevel => {
    return globalDebugState.dependencies.level;
  },
  getFilter: (): DependencyFilter => {
    return globalDebugState.dependencies.filter;
  },
};

// Initialize on first import
initializeDebugSettings();

/**
 * Simple React hook for dependency settings - replaces debug-deps-settings.ts
 * Provides reactive interface to dependencySettingsControls
 */
import { useCallback } from "react";

export const useDependencySettings = () => {
  const getDependencyLogs = useCallback(() => {
    return globalDebugState.logs.filter((log) => log.point === "dependencies");
  }, [globalDebugState.logs]);

  return {
    // State - directly from unified system
    enabled: dependencySettingsControls.getEnabled(),
    logLevel: dependencySettingsControls.getLevel(),
    filter: dependencySettingsControls.getFilter(),
    logs: getDependencyLogs(),

    // Actions - direct delegation to unified controls
    enable: () => dependencySettingsControls.setEnabled(true),
    disable: () => dependencySettingsControls.setEnabled(false),
    setLogLevel: dependencySettingsControls.setLevel,
    setFilter: dependencySettingsControls.setFilter,
  };
};
