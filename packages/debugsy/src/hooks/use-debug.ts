import { useCallback, useMemo } from "react";
import {
  getDebugEmoji,
  MAX_STORED_LOGS,
  type DebugLogEntry,
  type DebugPoint,
  type DependencyFilter,
  type DependencyLogLevel,
  type LogLevel,
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
  type HealthMetrics,
  type HealthSnapshotConfig,
} from "./health-snapshot";
import {
  needsSanitization,
  SANITIZATION_PRESETS,
  sanitizeLogData,
} from "./log-data-sanitization";

// Re-export types for backward compatibility
export type { DebugLogEntry, DebugPoint, DependencyFilter, DependencyLogLevel };

/**
 * Safe size estimation that handles circular references and complex objects
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
 * Centralized debug hook for surface components
 * Provides granular control over different debug points without prop drilling
 */
export const useDebug = (point?: DebugPoint) => {
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
    (
      debugPoint: DebugPoint,
      message: string,
      data?: any,
      level: LogLevel = "info"
    ) => {
      if (!isEnabled(debugPoint)) return;

      // SAFETY: Sanitize data to prevent browser freezing from heavy objects
      let sanitizedData = data;
      if (data !== undefined) {
        try {
          // Fast check if data needs sanitization
          if (needsSanitization(data)) {
            // Use React-focused preset for UI components
            const config =
              debugPoint === "surface" || debugPoint === "surface-interactions"
                ? SANITIZATION_PRESETS.reactFocused
                : SANITIZATION_PRESETS.balanced;

            sanitizedData = sanitizeLogData(data, config);

            // Log sanitization stats for debugging (only once per session to avoid spam)
            if (!(globalThis as any).__debugSanitizationLogged) {
              console.log(
                `🧹 [debugsy] Data sanitization active for heavy objects. Point: ${debugPoint}`,
                {
                  originalSize: estimateDataSize(data), // Safe size estimation
                  sanitizedSize: estimateDataSize(sanitizedData), // Safe size estimation
                  timeTaken: sanitizedData.__sanitizationTime + "ms",
                }
              );
              (globalThis as any).__debugSanitizationLogged = true;
            }
          }
        } catch (error) {
          // Fallback: If sanitization fails, use safe fallback
          console.warn(
            `⚠️ [debugsy] Failed to sanitize data for ${debugPoint}:`,
            error
          );
          sanitizedData = {
            __sanitizationFailed: true,
            __error: error instanceof Error ? error.message : "Unknown error",
            __originalType: typeof data,
            __safePreview: String(data).substring(0, 100) + "...",
          };
        }
      }

      // Store log entry with sanitized data
      const logEntry: DebugLogEntry = {
        timestamp: Date.now(),
        level, // Use the passed level parameter
        point: debugPoint,
        message,
        data: sanitizedData,
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

        // Use appropriate console method based on log level
        const consoleMethod =
          level === "error" || level === "critical"
            ? console.error
            : level === "warn"
              ? console.warn
              : console.log;

        if (data !== undefined) {
          consoleMethod(prefix, message, data);
        } else {
          consoleMethod(prefix, message);
        }
      }
    },
    [isEnabled]
  );

  // Helper logging functions for different severity levels
  const warn = useCallback(
    (debugPoint: DebugPoint, message: string, data?: any) => {
      log(debugPoint, message, data, "warn");
    },
    [log]
  );

  const error = useCallback(
    (debugPoint: DebugPoint, message: string, data?: any) => {
      log(debugPoint, message, data, "error");
    },
    [log]
  );

  const critical = useCallback(
    (debugPoint: DebugPoint, message: string, data?: any) => {
      log(debugPoint, message, data, "critical");
    },
    [log]
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
      warn,
      error,
      critical,
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
      warn,
      error,
      critical,
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
 * Unified dependency state hook - replaces the old useDependencyState from debug-deps.ts
 * Now properly integrated with the main debug system
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
    // State
    enabled: globalDebugState.dependencies.enabled,
    filter: globalDebugState.dependencies.filter,
    logLevel: globalDebugState.dependencies.level,

    // Control functions
    setFilter,
    setLogLevel,
    enable,
    disable,

    // Data access
    getDependencyLogs,
    logs: getDependencyLogs(),
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
