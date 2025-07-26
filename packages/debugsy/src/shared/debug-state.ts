import superjson from "superjson";
import { safeSuperjsonStringify } from "../debug-logs/components/logs/utils/json/json-core";
import type {
  DebugPoint,
  DebugState,
  DependencyFilter,
  DependencyLogLevel,
} from "./debug-constants";

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
export function initializeDebugState(): void {
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
        // Enable all debug points
        globalDebugState.enabled = new Set([
          "dispatcher" as DebugPoint,
          "hit-testing" as DebugPoint,
          "routing" as DebugPoint,
          "surface-interaction" as DebugPoint,
          "frame-interaction" as DebugPoint,
          "selection-interaction" as DebugPoint,
          "handler-registry" as DebugPoint,
          "performance" as DebugPoint,
          "visual-debug" as DebugPoint,
          "surface-interactions" as DebugPoint,
          "surface-dock" as DebugPoint,
          "frame-metrics" as DebugPoint,
          "dependencies" as DebugPoint,
          "canvas-events" as DebugPoint,
          "viewport-changes" as DebugPoint,
          "auto-layout" as DebugPoint,
          "event-propagation" as DebugPoint,
        ]);
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
export function saveDebugConfig(): void {
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
 * Debounced version of saveDebugConfig to prevent UI blocking
 * Batches multiple rapid changes into a single localStorage write
 */
let saveTimeout: NodeJS.Timeout | null = null;
const SAVE_DEBOUNCE_MS = 100; // 100ms delay for batching

function debouncedSaveDebugConfig(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveDebugConfig();
    saveTimeout = null;
  }, SAVE_DEBOUNCE_MS);
}

/**
 * Debug control functions for global state
 */
export const debugStateControls = {
  enable: (point: DebugPoint) => {
    globalDebugState.enabled.add(point);
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  disable: (point: DebugPoint) => {
    globalDebugState.enabled.delete(point);
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  enableAll: () => {
    globalDebugState.enabled.add("all");
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  disableAll: () => {
    globalDebugState.enabled.clear();
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  setConsoleEnabled: (enabled: boolean) => {
    globalDebugState.console = enabled;
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  setVisualEnabled: (enabled: boolean) => {
    globalDebugState.visual = enabled;
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
  },
  setPerformanceEnabled: (enabled: boolean) => {
    globalDebugState.performance = enabled;
    debouncedSaveDebugConfig(); // ← Non-blocking, batched persistence
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
export const dependencyStateControls = {
  setEnabled: (enabled: boolean) => {
    // Use unified debug point system instead of separate enabled state
    if (enabled) {
      globalDebugState.enabled.add("dependencies");
    } else {
      globalDebugState.enabled.delete("dependencies");
    }
    // Use debounced save like other debug controls
    debouncedSaveDebugConfig();
  },
  setLevel: (level: DependencyLogLevel) => {
    globalDebugState.dependencies.level = level;
    // No need to save level changes - they're runtime configuration
  },
  setFilter: (filter: DependencyFilter) => {
    globalDebugState.dependencies.filter = filter;
    // No need to save filter changes - they're runtime configuration
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
initializeDebugState();
