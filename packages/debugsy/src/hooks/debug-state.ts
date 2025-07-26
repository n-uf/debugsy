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
    enabled: true,
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
      const config = JSON.parse(storedConfig);
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
    } catch (e) {
      console.warn("Failed to parse surface debug config:", e);
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
    localStorage.setItem("surface-debug-config", JSON.stringify(config));
  } catch (e) {
    console.warn("Failed to save surface debug config:", e);
  }
}

/**
 * Debug control functions for global state
 */
export const debugStateControls = {
  enable: (point: DebugPoint) => {
    globalDebugState.enabled.add(point);
    saveDebugConfig();
  },
  disable: (point: DebugPoint) => {
    globalDebugState.enabled.delete(point);
    saveDebugConfig();
  },
  enableAll: () => {
    globalDebugState.enabled.add("all");
    saveDebugConfig();
  },
  disableAll: () => {
    globalDebugState.enabled.clear();
    saveDebugConfig();
  },
  setConsoleEnabled: (enabled: boolean) => {
    globalDebugState.console = enabled;
    saveDebugConfig();
  },
  setVisualEnabled: (enabled: boolean) => {
    globalDebugState.visual = enabled;
    saveDebugConfig();
  },
  setPerformanceEnabled: (enabled: boolean) => {
    globalDebugState.performance = enabled;
    saveDebugConfig();
  },
  clearLogs: () => {
    globalDebugState.logs = [];
  },
};

/**
 * Dependency tracking controls for global state
 */
export const dependencyStateControls = {
  setEnabled: (enabled: boolean) => {
    globalDebugState.dependencies.enabled = enabled;
  },
  setLevel: (level: DependencyLogLevel) => {
    globalDebugState.dependencies.level = level;
  },
  setFilter: (filter: DependencyFilter) => {
    globalDebugState.dependencies.filter = filter;
  },
  setAllowedHooks: (hooks: string[] | null) => {
    globalDebugState.dependencies.allowedHooks = hooks;
  },
  setExcludedHooks: (hooks: string[]) => {
    globalDebugState.dependencies.excludedHooks = hooks;
  },
  resetFilters: () => {
    globalDebugState.dependencies.allowedHooks = null;
    globalDebugState.dependencies.excludedHooks = [];
  },
};

// Initialize on first import
initializeDebugState();
