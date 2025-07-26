import { useCallback, useMemo } from "react";
import { useWhyDidYouUpdate } from "../debug-deps/debug-deps";
import {
  MAX_STORED_LOGS,
  getDebugEmoji,
  type DebugLogEntry,
  type DebugPoint,
  type DependencyFilter,
  type DependencyLogLevel,
} from "./debug-constants";
import {
  clearDebugDisplayContent,
  notifySubscribers,
  setDebugDisplayContent,
  useDebugDisplayContent,
  useDebugSubscription,
} from "./debug-notifications";
import {
  debugStateControls,
  dependencyStateControls,
  getGlobalDebugState,
} from "./debug-state";
import {
  captureHealthSnapshot as captureHealthSnapshotCore,
  createHealthLogEntry,
  type HealthMetrics,
  type HealthSnapshotConfig,
} from "./health-snapshot";

// Re-export types for backward compatibility
export type { DebugLogEntry, DebugPoint, DependencyFilter, DependencyLogLevel };

/**
 * Centralized debug hook for surface components
 * Provides granular control over different debug points without prop drilling
 */
export const useDebug = (point?: DebugPoint) => {
  // Debug dependency tracking
  useWhyDidYouUpdate("useDebug", {
    point,
  });

  // Subscribe to global state changes
  useDebugSubscription();

  const globalDebugState = getGlobalDebugState();

  // Memoize state object to prevent unnecessary re-renders
  const state = useMemo(
    () => ({
      enabled: Array.from(globalDebugState.enabled),
      console: globalDebugState.console,
      visual: globalDebugState.visual,
      performance: globalDebugState.performance,
    }),
    [
      globalDebugState.enabled.size,
      globalDebugState.console,
      globalDebugState.visual,
      globalDebugState.performance,
      // Force update by including a hash of enabled points
      Array.from(globalDebugState.enabled).sort().join(","),
    ]
  );

  // Check if a specific debug point is enabled
  const isEnabled = useCallback(
    (debugPoint: DebugPoint): boolean => {
      // Health debug point is always enabled
      if (debugPoint === "health") return true;

      return (
        globalDebugState.enabled.has(debugPoint) ||
        globalDebugState.enabled.has("all")
      );
    },
    [state.enabled]
  );

  // Check if current point is enabled (if point was provided)
  const enabled = point ? isEnabled(point) : false;

  // Console logging with debug point context
  const log = useCallback(
    (debugPoint: DebugPoint, message: string, data?: any) => {
      if (!isEnabled(debugPoint)) return;

      // Store log entry
      const logEntry: DebugLogEntry = {
        timestamp: Date.now(),
        level: "info",
        point: debugPoint,
        message,
        data,
        sessionId: "default", // Placeholder, will be updated
      };

      // Add to logs array (keep last MAX_STORED_LOGS)
      globalDebugState.logs = [
        ...globalDebugState.logs.slice(-(MAX_STORED_LOGS - 1)),
        logEntry,
      ];

      // Schedule notification for next frame to avoid render-time updates
      notifySubscribers();

      // Console output if enabled
      if (globalDebugState.console) {
        const emoji = getDebugEmoji(debugPoint);
        const prefix = `${emoji} [${debugPoint}]`;

        if (data !== undefined) {
          console.log(prefix, message, data);
        } else {
          console.log(prefix, message);
        }
      }
    },
    [isEnabled]
  );

  // Health snapshot function - captures comprehensive app metrics
  const captureHealthSnapshot = useCallback(() => {
    return captureHealthSnapshotCore(globalDebugState, log);
  }, [log]);

  // Visual debug flag
  const showVisual = useCallback(
    (debugPoint: DebugPoint): boolean => {
      return globalDebugState.visual && isEnabled(debugPoint);
    },
    [isEnabled]
  );

  // Performance timing
  const time = useCallback(
    (debugPoint: DebugPoint, label: string) => {
      if (!globalDebugState.performance || !isEnabled(debugPoint)) return;
      console.time(`[${debugPoint}] ${label}`);
    },
    [isEnabled]
  );

  const timeEnd = useCallback(
    (debugPoint: DebugPoint, label: string) => {
      if (!globalDebugState.performance || !isEnabled(debugPoint)) return;
      console.timeEnd(`[${debugPoint}] ${label}`);
    },
    [isEnabled]
  );

  // Control functions using the extracted state controls
  const enable = useCallback((debugPoint: DebugPoint) => {
    debugStateControls.enable(debugPoint);
    notifySubscribers();
  }, []);

  const disable = useCallback((debugPoint: DebugPoint) => {
    debugStateControls.disable(debugPoint);
    notifySubscribers();
  }, []);

  const toggle = useCallback(
    (debugPoint: DebugPoint) => {
      if (globalDebugState.enabled.has(debugPoint)) {
        disable(debugPoint);
      } else {
        enable(debugPoint);
      }
    },
    [enable, disable]
  );

  const enableAll = useCallback(() => {
    debugStateControls.enableAll();
    notifySubscribers();
  }, []);

  const disableAll = useCallback(() => {
    debugStateControls.disableAll();
    notifySubscribers();
  }, []);

  // Configuration
  const setConsoleEnabled = useCallback((enabled: boolean) => {
    debugStateControls.setConsoleEnabled(enabled);
    notifySubscribers();
  }, []);

  const setVisualEnabled = useCallback((enabled: boolean) => {
    debugStateControls.setVisualEnabled(enabled);
    notifySubscribers();
  }, []);

  const setPerformanceEnabled = useCallback((enabled: boolean) => {
    debugStateControls.setPerformanceEnabled(enabled);
    notifySubscribers();
  }, []);

  // Logs management
  const getLogs = useCallback((): DebugLogEntry[] => {
    return [...globalDebugState.logs]; // Return a copy to prevent mutations
  }, [globalDebugState.logs.length]); // Only update when log count changes

  const clearLogs = useCallback(() => {
    debugStateControls.clearLogs();
    notifySubscribers();
  }, []);

  // Return memoized debug interface to prevent unnecessary re-renders
  return useMemo(
    () => ({
      // Current enabled state
      enabled,

      // Check functions
      isEnabled,
      showVisual,

      // Logging functions
      log,
      time,
      timeEnd,

      // Control functions
      enable,
      disable,
      toggle,
      enableAll,
      disableAll,

      // Configuration
      setConsoleEnabled,
      setVisualEnabled,
      setPerformanceEnabled,

      // Logs management
      getLogs,
      clearLogs,

      // Current state - now memoized
      state,

      // Health snapshot function
      captureHealthSnapshot,
    }),
    [
      enabled,
      isEnabled,
      showVisual,
      log,
      time,
      timeEnd,
      enable,
      disable,
      toggle,
      enableAll,
      disableAll,
      setConsoleEnabled,
      setVisualEnabled,
      setPerformanceEnabled,
      getLogs,
      clearLogs,
      state,
      captureHealthSnapshot,
    ]
  );
};

/**
 * Global debug control functions (for console usage)
 */
if (typeof window !== "undefined") {
  (window as any).surfaceDebug = {
    enable: (point: DebugPoint) => {
      debugStateControls.enable(point);
      notifySubscribers();
    },
    disable: (point: DebugPoint) => {
      debugStateControls.disable(point);
      notifySubscribers();
    },
    enableAll: () => {
      debugStateControls.enableAll();
      notifySubscribers();
    },
    disableAll: () => {
      debugStateControls.disableAll();
      notifySubscribers();
    },
    list: () => {
      const globalDebugState = getGlobalDebugState();
      console.table({
        "Enabled Points": Array.from(globalDebugState.enabled),
        "Console Logging": globalDebugState.console,
        "Visual Debug": globalDebugState.visual,
        "Performance Timing": globalDebugState.performance,
      });
    },

    // Integrated dependency tracking controls
    deps: {
      off: () => {
        dependencyStateControls.setEnabled(false);
        console.log("🚫 Dependency tracking disabled");
        notifySubscribers();
      },
      quiet: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setLevel("quiet");
        console.log(
          "🔇 Dependency tracking: QUIET mode (functions + loops only)"
        );
        notifySubscribers();
      },
      normal: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setLevel("normal");
        console.log("📊 Dependency tracking: NORMAL mode");
        notifySubscribers();
      },
      verbose: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setLevel("verbose");
        console.log("📢 Dependency tracking: VERBOSE mode");
        notifySubscribers();
      },
      functionsOnly: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setFilter("functions-only");
        console.log("📝 Dependency tracking: FUNCTIONS ONLY");
        notifySubscribers();
      },
      objectsOnly: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setFilter("objects-only");
        console.log("📦 Dependency tracking: OBJECTS ONLY");
        notifySubscribers();
      },
      unstableOnly: () => {
        dependencyStateControls.setEnabled(true);
        dependencyStateControls.setFilter("unstable-only");
        console.log("⚠️ Dependency tracking: UNSTABLE ONLY");
        notifySubscribers();
      },
    },

    // Dependency filtering
    filterDependencies: (hooks: string[]) => {
      dependencyStateControls.setAllowedHooks(hooks);
      console.log(`🔍 Dependency tracking filtered to: ${hooks.join(", ")}`);
      notifySubscribers();
    },
    excludeDependencies: (hooks: string[]) => {
      dependencyStateControls.setExcludedHooks(hooks);
      console.log(`🚫 Excluding from dependency tracking: ${hooks.join(", ")}`);
      notifySubscribers();
    },
    resetDependencyFilters: () => {
      dependencyStateControls.resetFilters();
      console.log("🔄 Dependency filters reset");
      notifySubscribers();
    },
    setDependencyFilter: (filter: DependencyFilter) => {
      dependencyStateControls.setFilter(filter);
      console.log(`🔧 Dependency filter: ${filter}`);
      notifySubscribers();
    },

    // Status getters
    getDependencyStatus: () => getGlobalDebugState().dependencies,
    getDebugState: () => getGlobalDebugState(),

    // Health snapshot function
    captureHealthSnapshot: () => {
      const globalDebugState = getGlobalDebugState();

      // Create health log entry and add to logs
      const healthMetrics = captureHealthSnapshotCore(
        globalDebugState,
        undefined,
        {
          logToDebugSystem: false, // We'll handle logging manually
        }
      );

      const logEntry = createHealthLogEntry(healthMetrics);
      globalDebugState.logs = [
        ...globalDebugState.logs.slice(-(MAX_STORED_LOGS - 1)),
        logEntry,
      ];

      // Notify subscribers
      notifySubscribers();

      return healthMetrics;
    },

    help: () => {
      console.log(`
🎯 Surface Debug System - Available Commands:

📊 Main Debug Controls:
  surfaceDebug.enable("point")     Enable debug point
  surfaceDebug.disable("point")    Disable debug point
  surfaceDebug.toggle("point")     Toggle debug point
  surfaceDebug.enableAll()         Enable all debug points
  surfaceDebug.disableAll()        Disable all debug points

🧠 Dependency Tracking:
  surfaceDebug.deps.off()          Turn off dependency tracking
  surfaceDebug.deps.quiet()        Quiet mode (minimal output)
  surfaceDebug.deps.normal()       Normal tracking mode
  surfaceDebug.deps.verbose()      Verbose tracking mode
  surfaceDebug.deps.functionsOnly() Track only function changes
  surfaceDebug.deps.objectsOnly()  Track only object changes
  surfaceDebug.deps.unstableOnly() Track only unstable dependencies

🔍 Dependency Filtering:
  surfaceDebug.filterDependencies(["hook1", "hook2"])
  surfaceDebug.excludeDependencies(["hook1", "hook2"])
  surfaceDebug.resetDependencyFilters()
  surfaceDebug.setDependencyFilter("functions-only")

📋 Status & Information:
  surfaceDebug.getDependencyStatus() Get dependency tracking status
  surfaceDebug.getDebugState()     Get full debug state
  surfaceDebug.captureHealthSnapshot() Capture comprehensive app health metrics
  surfaceDebug.help()              Show this help

⚙️ Configuration:
  surfaceDebug.setConsoleEnabled(true/false)
  surfaceDebug.setVisualEnabled(true/false)
  surfaceDebug.setPerformanceEnabled(true/false)

🏥 Health Monitoring:
  surfaceDebug.captureHealthSnapshot() - Always enabled, logs to both console and debug panel

🎯 Available Debug Points:
  dispatcher, hit-testing, routing, surface-interaction, frame-interaction,
  selection-interaction, handler-registry, performance, visual-debug,
  surface-interactions, surface-dock, frame-metrics, dependencies, health

📚 Usage Examples:
  surfaceDebug.enable("dispatcher")     // Enable mouse dispatcher logs
  surfaceDebug.deps.functionsOnly()     // Track only function recreation
  surfaceDebug.captureHealthSnapshot()  // Get comprehensive app metrics
      `);
    },
  };
}

/**
 * Unified dependency state hook - replaces the old useDependencyState from debug-deps.ts
 * Now properly integrated with the main debug system
 */
export const useDependencyState = () => {
  // Subscribe to debug state changes
  useDebugSubscription();

  // Always provide a valid interface since we're now unified
  const globalDebug = (globalThis as any).surfaceDebug;
  const isInitialized =
    typeof globalDebug !== "undefined" &&
    typeof globalDebug.deps !== "undefined";

  return {
    state: getGlobalDebugState().dependencies, // Direct access to unified state
    methods: globalDebug,
    isInitialized, // true when surfaceDebug.deps exists
    isAvailable: typeof globalDebug !== "undefined", // true when surfaceDebug object exists
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
