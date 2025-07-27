import { useEffect, useRef } from "react";
import type { LogLevel } from "../shared/debug-constants";
import { getGlobalDebugState } from "../shared/debug-settings";

interface ChangedProps {
  [key: string]: {
    from: any;
    to: any;
  };
}

// Import notification system for real-time UI updates
let notifySubscribers: (() => void) | null = null;

// Import the unified debug system

// Initialize notification system when available
const initializeNotificationSystem = () => {
  if (!notifySubscribers) {
    try {
      // Dynamically import to avoid circular dependencies
      import("../debug-logs/hooks/debug-notifications")
        .then((module) => {
          notifySubscribers = module.notifySubscribers;
        })
        .catch(() => {
          // Notification system not available - UI updates will be manual
        });
    } catch {
      // Fallback - no real-time UI updates
    }
  }
};

// Unified logging using the main debug system with proper severity levels
type DebugLogger = {
  log: (point: string, message: string, data?: any, level?: LogLevel) => void;
  warn: (point: string, message: string, data?: any) => void;
  error: (point: string, message: string, data?: any) => void;
  critical: (point: string, message: string, data?: any) => void;
};

let debugLogger: DebugLogger | null = null;

// Initialize the unified debug logger
const initializeDebugLogger = () => {
  if (!debugLogger) {
    try {
      // Dynamically import to avoid circular dependencies
      const { useDebug } = require("../debug-logs/hooks/use-debug");

      // Create a logger instance that uses the main debug system
      // Note: This will be a singleton to avoid hook issues
      const createLogger = (): DebugLogger => {
        const globalDebug = (globalThis as any).surfaceDebug;
        if (globalDebug?.getDebugState) {
          const debugState = globalDebug.getDebugState();

          return {
            log: (
              point: string,
              message: string,
              data?: any,
              level: LogLevel = "info"
            ) => {
              const logEntry = {
                timestamp: Date.now(),
                level,
                point,
                message,
                data,
                sessionId: "default",
              };

              debugState.logs = [...debugState.logs.slice(-9999), logEntry];

              if (notifySubscribers) {
                notifySubscribers();
              }

              // Console output
              const consoleMethod =
                level === "error" || level === "critical"
                  ? console.error
                  : level === "warn"
                    ? console.warn
                    : console.log;
              consoleMethod(`[dependencies] ${message}`, data);
            },
            warn: (point: string, message: string, data?: any): void => {
              createLogger().log(point, message, data, "warn");
            },
            error: (point: string, message: string, data?: any): void => {
              createLogger().log(point, message, data, "error");
            },
            critical: (point: string, message: string, data?: any): void => {
              createLogger().log(point, message, data, "critical");
            },
          };
        }

        // Fallback logger
        return {
          log: (
            point: string,
            message: string,
            data?: any,
            level: LogLevel = "info"
          ) => {
            const consoleMethod =
              level === "error" || level === "critical"
                ? console.error
                : level === "warn"
                  ? console.warn
                  : console.log;
            consoleMethod(`[${point}] ${message}`, data);
          },
          warn: (point: string, message: string, data?: any) =>
            console.warn(`[${point}] ${message}`, data),
          error: (point: string, message: string, data?: any) =>
            console.error(`[${point}] ${message}`, data),
          critical: (point: string, message: string, data?: any) =>
            console.error(`[${point}] 🚨 ${message}`, data),
        };
      };

      debugLogger = createLogger();
    } catch (error) {
      // Fallback to console only
      debugLogger = {
        log: (
          point: string,
          message: string,
          data?: any,
          level: LogLevel = "info"
        ) => {
          const consoleMethod =
            level === "error" || level === "critical"
              ? console.error
              : level === "warn"
                ? console.warn
                : console.log;
          consoleMethod(`[${point}] ${message}`, data);
        },
        warn: (point: string, message: string, data?: any) =>
          console.warn(`[${point}] ${message}`, data),
        error: (point: string, message: string, data?: any) =>
          console.error(`[${point}] ${message}`, data),
        critical: (point: string, message: string, data?: any) =>
          console.error(`[${point}] 🚨 ${message}`, data),
      };
    }
  }
  return debugLogger;
};

// Helper functions that use the unified logger
const logToDebugSystem = (message: string, data?: any): void => {
  const logger = initializeDebugLogger();
  if (logger) {
    logger.log("dependencies", message, data, "info");
  }
};

const logWarnToDebugSystem = (message: string, data?: any): void => {
  const logger = initializeDebugLogger();
  if (logger) {
    logger.warn("dependencies", message, data);
  }
};

const logErrorToDebugSystem = (message: string, data?: any): void => {
  const logger = initializeDebugLogger();
  if (logger) {
    logger.error("dependencies", message, data);
  }
};

// Get dependency state from unified debug system
const getDependencyState = () => {
  const globalDebug = (globalThis as any).surfaceDebug;
  if (globalDebug?.getDependencyStatus) {
    return globalDebug.getDependencyStatus();
  }

  // Fallback: Get state from debug settings system
  const debugState = getGlobalDebugState();
  return (
    debugState.dependencies || {
      enabled: false,
      level: "normal",
      filter: "all",
      allowedHooks: null,
      excludedHooks: [],
      throttleMs: 100,
    }
  );
};

// Enhanced dependency change tracking with smarter frequency detection
const dependencyChangeTracking = new Map<
  string,
  {
    count: number;
    lastChange: number;
    isFrequent: boolean;
    firstSeen: number;
    changeIntervals: number[]; // Track timing patterns
  }
>();

// Track app initialization phase
const initializationPhase = {
  startTime: Date.now(),
  isActive: true,
  endTimeout: null as NodeJS.Timeout | null,

  // Mark initialization as complete after 5 seconds of no new components
  markComponentSeen() {
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
    }
    this.endTimeout = setTimeout(() => {
      this.isActive = false;
      logToDebugSystem(
        "🏁 App initialization phase completed - switching to runtime severity"
      );
    }, 5000);
  },

  getPhase(): "initialization" | "runtime" {
    return this.isActive ? "initialization" : "runtime";
  },
};

function trackDependencyChange(
  hookName: string,
  propName: string,
  changeType: "function" | "object" | "primitive"
) {
  const key = `${hookName}.${propName}`;
  const now = Date.now();
  const existing = dependencyChangeTracking.get(key);

  // Mark that we've seen a component (for initialization phase tracking)
  initializationPhase.markComponentSeen();

  if (existing) {
    existing.count++;
    const timeSinceLastChange = now - existing.lastChange;
    existing.changeIntervals.push(timeSinceLastChange);

    // Keep only last 5 intervals for pattern analysis
    if (existing.changeIntervals.length > 5) {
      existing.changeIntervals.shift();
    }

    // Progressive frequency detection based on phase and change type
    let frequencyThreshold: number;
    const phase = initializationPhase.getPhase();

    if (phase === "initialization") {
      // During initialization, be much more lenient
      frequencyThreshold = changeType === "function" ? 2000 : 5000;
    } else {
      // Runtime: stricter detection
      frequencyThreshold =
        changeType === "function"
          ? 1000
          : changeType === "object"
            ? 2000
            : 3000;
    }

    // Enhanced frequency detection
    if (existing.count >= 3) {
      // Pattern-based detection: if last 3 changes were all rapid
      const recentIntervals = existing.changeIntervals.slice(-3);
      const allRecentFast = recentIntervals.every(
        (interval) => interval < frequencyThreshold
      );
      const averageInterval =
        recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;

      // More sophisticated frequency detection
      existing.isFrequent =
        allRecentFast && averageInterval < frequencyThreshold;
    } else {
      // For first few changes, use simple threshold
      existing.isFrequent = timeSinceLastChange < frequencyThreshold;
    }

    existing.lastChange = now;
  } else {
    dependencyChangeTracking.set(key, {
      count: 1,
      lastChange: now,
      isFrequent: false,
      firstSeen: now,
      changeIntervals: [],
    });
  }

  return dependencyChangeTracking.get(key)!;
}

// Enhanced shouldLogDependency function using unified state
function shouldLogDependency(
  hookName: string,
  changeType: "function" | "object" | "primitive",
  isStable: boolean
): boolean {
  // Emergency stop check
  if ((globalThis as any).__SURFACE_EMERGENCY_STOP?.active) {
    return false;
  }

  const dependencyState = getDependencyState();

  // Global enabled check
  if (!dependencyState.enabled) {
    return false;
  }

  // Hook filtering
  if (dependencyState.allowedHooks) {
    if (!dependencyState.allowedHooks.includes(hookName)) {
      return false;
    }
  }

  if (dependencyState.excludedHooks.includes(hookName)) {
    return false;
  }

  // Level filtering
  switch (dependencyState.level) {
    case "silent":
      return false;
    case "quiet":
      // Only show functions and potential loop risks
      return changeType === "function" || !isStable;
    case "init-aware":
      // Initialization-aware: show functions always, objects only if problematic
      const phase = initializationPhase.getPhase();
      if (changeType === "function") return true;
      if (changeType === "object") {
        // During init: only show if really frequent (3+ rapid changes)
        // During runtime: show if unstable
        return phase === "runtime" ? !isStable : false;
      }
      return !isStable; // Primitives only if unstable
    case "normal":
      // Show functions and objects, hide primitives unless unstable
      return changeType !== "primitive" || !isStable;
    case "verbose":
      // Show everything
      return true;
    case "debug":
      // Show everything with extra detail
      return true;
  }

  // Type filtering
  switch (dependencyState.filter) {
    case "functions-only":
      return changeType === "function";
    case "objects-only":
      return changeType === "object";
    case "unstable-only":
      return !isStable;
    case "stable-only":
      return isStable;
    case "loop-risks":
      // Functions and frequently changing objects
      return (
        changeType === "function" || (changeType === "object" && !isStable)
      );
    case "all":
    default:
      return true;
  }
}

/**
 * Enhanced dependency tracking that respects unified debug controls
 * FIXED: Always call hooks in same order to comply with Rules of Hooks
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  // ALWAYS call hooks first - never conditionally skip them
  const previousProps = useRef<Record<string, any> | undefined>(undefined);
  const lastLogTime = useRef(0);

  const dependencyState = getDependencyState();

  // Check if we should do any work (but hooks are already called)
  const shouldTrack =
    dependencyState.enabled &&
    !(globalThis as any).__SURFACE_EMERGENCY_STOP?.active;

  useEffect(() => {
    // Early exit if tracking is disabled, but still update previousProps
    if (!shouldTrack) {
      previousProps.current = props;
      return;
    }

    const currentDependencyState = getDependencyState();

    // Throttling
    const now = Date.now();
    if (now - lastLogTime.current < currentDependencyState.throttleMs) {
      previousProps.current = props;
      return;
    }

    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: ChangedProps = {};
      const changesToLog: Array<{
        key: string;
        change: { from: any; to: any };
        type: "function" | "object" | "primitive";
        isStable: boolean;
        trackingInfo: {
          count: number;
          lastChange: number;
          isFrequent: boolean;
          firstSeen: number;
          changeIntervals: number[];
        };
      }> = [];

      allKeys.forEach((key) => {
        if (previousProps.current![key] !== props[key]) {
          const from = previousProps.current![key];
          const to = props[key];
          const fromType = typeof from;
          const toType = typeof to;

          let changeType: "function" | "object" | "primitive";
          if (fromType === "function" || toType === "function") {
            changeType = "function";
          } else if (fromType === "object" || toType === "object") {
            changeType = "object";
          } else {
            changeType = "primitive";
          }

          const trackingInfo = trackDependencyChange(name, key, changeType);
          const isStable = !trackingInfo.isFrequent;

          changedProps[key] = { from, to };

          if (shouldLogDependency(name, changeType, isStable)) {
            changesToLog.push({
              key,
              change: { from, to },
              type: changeType,
              isStable,
              trackingInfo, // Add tracking info for counter display
            });
          }
        }
      });

      // Log changes if any should be logged
      if (changesToLog.length > 0) {
        // Summary log
        logToDebugSystem(
          `🔄 [${name}] Dependencies changed:`,
          Object.fromEntries(changesToLog.map((c) => [c.key, c.change]))
        );

        // Detailed logs based on level and phase
        const currentPhase = initializationPhase.getPhase();

        changesToLog.forEach(
          ({ key, change, type, isStable, trackingInfo }) => {
            const { from, to } = change;
            const fromType = typeof from;
            const toType = typeof to;

            // Smart severity detection
            const shouldWarn = !isStable && currentPhase === "runtime";
            const phaseIndicator =
              currentPhase === "initialization" ? " 🚀" : "";
            const stabilityIndicator = shouldWarn
              ? " ⚠️ FREQUENT"
              : !isStable && currentPhase === "initialization"
                ? " 📋 INIT"
                : "";

            // Add counter for tracking
            const counterIndicator = ` (#${trackingInfo.count})`;

            if (type === "function") {
              if (currentPhase === "runtime" && !isStable) {
                logWarnToDebugSystem(
                  `📝 [${name}] ${key}: function changed${counterIndicator} (function → function)${stabilityIndicator}`
                );
              } else {
                logToDebugSystem(
                  `📝 [${name}] ${key}: function changed${counterIndicator} (function → function)${phaseIndicator}${stabilityIndicator}`
                );
              }
            } else if (type === "object") {
              if (currentDependencyState.level === "debug") {
                const logFn = shouldWarn
                  ? logWarnToDebugSystem
                  : logToDebugSystem;
                logFn(
                  `📦 [${name}] ${key}: object changed${counterIndicator}${phaseIndicator}${stabilityIndicator}`,
                  {
                    from,
                    to,
                  }
                );
              } else {
                const logFn = shouldWarn
                  ? logWarnToDebugSystem
                  : logToDebugSystem;
                logFn(
                  `📦 [${name}] ${key}: object changed${counterIndicator}${phaseIndicator}${stabilityIndicator}`
                );
              }
            } else {
              // Primitive changes (only in verbose/debug mode)
              if (
                currentDependencyState.level === "verbose" ||
                currentDependencyState.level === "debug"
              ) {
                logToDebugSystem(
                  `🔧 [${name}] ${key}: ${fromType} → ${toType}${counterIndicator}${phaseIndicator}`,
                  {
                    from,
                    to,
                  }
                );
              }
            }
          }
        );

        lastLogTime.current = now;
      }
    }

    previousProps.current = props;
  }); // Deliberately no deps - we want this to run on every render to track changes
}

/**
 * Enhanced version that tracks render count and warns about excessive renders
 */
export function useRenderTracker(
  name: string,
  props: Record<string, any>
): void {
  const renderCount = useRef(0);
  const lastWarning = useRef(0);

  renderCount.current += 1;

  // Warn every 10 renders after threshold
  if (renderCount.current > 10 && renderCount.current % 10 === 0) {
    const now = Date.now();
    if (now - lastWarning.current > 1000) {
      // Throttle warnings to once per second
      logWarnToDebugSystem(
        `⚠️ [${name}] High render count detected: ${renderCount.current}`
      );
      lastWarning.current = now;
    }
  }

  useWhyDidYouUpdate(name, props);
}
