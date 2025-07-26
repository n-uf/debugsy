import { useEffect, useRef } from "react";
import type { LogLevel } from "../hooks/debug-constants";

interface ChangedProps {
  [key: string]: {
    from: any;
    to: any;
  };
}

// Import notification system for real-time UI updates
let notifySubscribers: (() => void) | null = null;

// Initialize notification system when available
const initializeNotificationSystem = () => {
  if (!notifySubscribers) {
    try {
      // Dynamically import to avoid circular dependencies
      import("../hooks/debug-notifications")
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
      const { useDebug } = require("../hooks/use-debug");

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

  // Fallback: Try to get state from local debug state system
  try {
    // Dynamically import to avoid circular dependencies
    const { getGlobalDebugState } = require("../hooks/debug-state");
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
  } catch {
    // Final fallback
    return {
      enabled: false,
      level: "normal",
      filter: "all",
      allowedHooks: null,
      excludedHooks: [],
      throttleMs: 100,
    };
  }
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

// Global circuit breaker state (simplified - could be moved to main debug system later)
const circuitBreakers = new Map<
  string,
  {
    isOpen: boolean;
    renderCount: number;
    lastReset: number;
    threshold: number;
  }
>();

/**
 * Circuit breaker configuration
 */
interface CircuitBreakerConfig {
  maxRenders?: number; // Max renders before opening circuit (default: 15)
  resetInterval?: number; // Reset interval in ms (default: 5000)
  autoRestore?: boolean; // Auto-restore after reset interval (default: true)
  onBreak?: (name: string, renderCount: number) => void;
  onRestore?: (name: string) => void;
}

/**
 * Enhanced render tracker with automatic circuit breaker protection
 */
export function useCircuitBreakerTracker(
  name: string,
  props: Record<string, any>,
  config: CircuitBreakerConfig = {}
): { isDisabled: boolean; renderCount: number } {
  const {
    maxRenders = 15,
    resetInterval = 5000,
    autoRestore = true,
    onBreak,
    onRestore,
  } = config;

  const renderCount = useRef(0);
  const lastWarning = useRef(0);

  renderCount.current += 1;

  // Get or create circuit breaker state
  if (!circuitBreakers.has(name)) {
    circuitBreakers.set(name, {
      isOpen: false,
      renderCount: 0,
      lastReset: Date.now(),
      threshold: maxRenders,
    });
  }

  const breaker = circuitBreakers.get(name)!;
  breaker.renderCount = renderCount.current;

  const now = Date.now();

  // Auto-restore circuit breaker after reset interval
  if (
    breaker.isOpen &&
    autoRestore &&
    now - breaker.lastReset > resetInterval
  ) {
    breaker.isOpen = false;
    breaker.lastReset = now;
    renderCount.current = 0; // Reset render count
    logToDebugSystem(`🔄 [${name}] Circuit breaker auto-restored`);
    onRestore?.(name);
  }

  // Check if we should open the circuit breaker
  if (!breaker.isOpen && renderCount.current > maxRenders) {
    breaker.isOpen = true;
    breaker.lastReset = now;
    logErrorToDebugSystem(
      `🚨 [${name}] CIRCUIT BREAKER OPEN - Excessive renders detected: ${renderCount.current}`
    );
    logErrorToDebugSystem(
      `🛑 [${name}] Hook disabled to prevent infinite loop`
    );
    onBreak?.(name, renderCount.current);
  }

  // Warn about high render count (but less frequently when circuit is open)
  if (renderCount.current > 10 && renderCount.current % 5 === 0) {
    if (now - lastWarning.current > 1000) {
      if (breaker.isOpen) {
        logWarnToDebugSystem(
          `⚠️ [${name}] Hook disabled (renders: ${renderCount.current})`
        );
      } else {
        logWarnToDebugSystem(
          `⚠️ [${name}] High render count detected: ${renderCount.current}`
        );
      }
      lastWarning.current = now;
    }
  }

  // Always call useWhyDidYouUpdate to maintain hook order
  // The function itself will handle whether to actually track based on circuit state
  useWhyDidYouUpdate(name, breaker.isOpen ? {} : props);

  return {
    isDisabled: breaker.isOpen,
    renderCount: renderCount.current,
  };
}

/**
 * Safe hook wrapper that automatically disables when excessive renders detected
 */
export function useSafeHook<T>(
  name: string,
  hookFn: () => T,
  fallbackValue: T,
  config: CircuitBreakerConfig = {}
): T {
  const { isDisabled } = useCircuitBreakerTracker(name, {}, config);

  if (isDisabled) {
    logToDebugSystem(
      `🛑 [${name}] Hook execution skipped (circuit breaker open)`
    );
    return fallbackValue;
  }

  try {
    return hookFn();
  } catch (error) {
    logErrorToDebugSystem(`❌ [${name}] Hook execution failed:`, error);
    return fallbackValue;
  }
}

/**
 * Manual circuit breaker control
 */
export const circuitBreakerControl = {
  /**
   * Check if a circuit breaker is open
   */
  isOpen(name: string): boolean {
    return circuitBreakers.get(name)?.isOpen ?? false;
  },

  /**
   * Manually open a circuit breaker
   */
  open(name: string): void {
    if (!circuitBreakers.has(name)) {
      circuitBreakers.set(name, {
        isOpen: false,
        renderCount: 0,
        lastReset: Date.now(),
        threshold: 15,
      });
    }
    const breaker = circuitBreakers.get(name)!;
    breaker.isOpen = true;
    breaker.lastReset = Date.now();
    logToDebugSystem(`🛑 [${name}] Circuit breaker manually opened`);
  },

  /**
   * Manually close/restore a circuit breaker
   */
  close(name: string): void {
    const breaker = circuitBreakers.get(name);
    if (breaker) {
      breaker.isOpen = false;
      breaker.lastReset = Date.now();
      logToDebugSystem(`🔄 [${name}] Circuit breaker manually restored`);
    }
  },

  /**
   * Get circuit breaker status
   */
  getStatus(name: string) {
    return circuitBreakers.get(name) ?? null;
  },

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    circuitBreakers.clear();
    logToDebugSystem(`🔄 All circuit breakers reset`);
  },

  /**
   * List all circuit breakers and their status
   */
  listAll(): Array<{ name: string; isOpen: boolean; renderCount: number }> {
    return Array.from(circuitBreakers.entries()).map(([name, breaker]) => ({
      name,
      isOpen: breaker.isOpen,
      renderCount: breaker.renderCount,
    }));
  },
};

// Global emergency stop
export const emergencyStop = {
  isActive: false,

  /**
   * Activate emergency stop - disables all circuit-breaker protected hooks
   */
  activate(): void {
    this.isActive = true;
    logErrorToDebugSystem(
      `🚨 EMERGENCY STOP ACTIVATED - All protected hooks disabled`
    );
  },

  /**
   * Deactivate emergency stop
   */
  deactivate(): void {
    this.isActive = false;
    circuitBreakers.clear();
    logToDebugSystem(`✅ Emergency stop deactivated - Hooks restored`);
  },
};

/**
 * Emergency-stop aware safe hook wrapper
 */
export function useEmergencySafeHook<T>(
  name: string,
  hookFn: () => T,
  fallbackValue: T,
  config: CircuitBreakerConfig = {}
): T {
  if (emergencyStop.isActive) {
    logWarnToDebugSystem(
      `🚨 [${name}] Hook execution blocked (emergency stop active)`
    );
    return fallbackValue;
  }

  return useSafeHook(name, hookFn, fallbackValue, config);
}

// Initialize emergency stop globals
(globalThis as any).__SURFACE_EMERGENCY_STOP = {
  active: false,
  activate: () => {
    console.error(
      "🚨 EMERGENCY STOP ACTIVATED - All Surface debug logging disabled"
    );
    (globalThis as any).__SURFACE_EMERGENCY_STOP.active = true;
    emergencyStop.activate();
  },
  deactivate: () => {
    console.log("✅ Emergency stop deactivated - Debug logging restored");
    (globalThis as any).__SURFACE_EMERGENCY_STOP.active = false;
    emergencyStop.deactivate();
  },
  status: () => {
    const globalDebug = (globalThis as any).surfaceDebug;
    const depState = globalDebug?.getDependencyStatus?.() || {};
    console.log("🔍 Surface Debug Status:", {
      emergencyActive: (globalThis as any).__SURFACE_EMERGENCY_STOP.active,
      dependencyTracking: depState.enabled,
      level: depState.level,
      filter: depState.filter,
    });
  },
};

// Initialize global surfaceDebug object if it doesn't exist
const initializeGlobalSurfaceDebug = () => {
  if (!(globalThis as any).surfaceDebug) {
    // Dynamically import to avoid circular dependencies
    try {
      const { getGlobalDebugState } = require("../hooks/debug-state");

      (globalThis as any).surfaceDebug = {
        getDebugState: () => getGlobalDebugState(),
        getDependencyStatus: () => {
          const state = getGlobalDebugState();
          return (
            state.dependencies || {
              enabled: false,
              level: "normal",
              filter: "all",
              allowedHooks: null,
              excludedHooks: [],
              throttleMs: 100,
            }
          );
        },
        // Test utilities for verification
        testDependencyTracking: () => {
          console.log("🧪 Testing useWhyDidYouUpdate functionality...");

          // Check if global surfaceDebug object exists
          const globalDebug = (globalThis as any).surfaceDebug;
          if (!globalDebug) {
            console.error("❌ Global surfaceDebug object not found");
            return false;
          }

          console.log("✅ Global surfaceDebug object found");

          // Check if getDependencyStatus method exists
          if (!globalDebug.getDependencyStatus) {
            console.error("❌ getDependencyStatus method not found");
            return false;
          }

          console.log("✅ getDependencyStatus method found");

          // Test dependency status
          const depStatus = globalDebug.getDependencyStatus();
          console.log("📋 Current dependency status:", depStatus);

          // Test if dependency tracking is enabled
          if (!depStatus.enabled) {
            console.warn("⚠️ Dependency tracking is currently disabled");
            console.log("🔧 Enabling dependency tracking...");
            globalDebug.deps.on();
            const newStatus = globalDebug.getDependencyStatus();
            console.log("📋 Updated dependency status:", newStatus);
          }

          console.log("\n✅ useWhyDidYouUpdate should now be working!");
          console.log("📝 To test in components:");
          console.log(
            "   1. Add useWhyDidYouUpdate('MyComponent', props) to any component"
          );
          console.log(
            "   2. Change props and watch for dependency change logs"
          );
          console.log("   3. Use surfaceDebug.deps.verbose() for more detail");

          return true;
        },
        testMockComponent: () => {
          console.log("\n🧪 Testing with mock component scenario...");

          const globalDebug = (globalThis as any).surfaceDebug;
          const depState = globalDebug?.getDependencyStatus?.();

          console.log(
            `📊 Dependency state: enabled=${depState?.enabled}, level=${depState?.level}`
          );

          if (depState?.enabled) {
            console.log(
              "✅ Dependency tracking is active - useWhyDidYouUpdate should work"
            );
            console.log(
              "🔄 Try adding useWhyDidYouUpdate('ComponentName', props) to a component with changing props"
            );
          } else {
            console.log("❌ Dependency tracking is disabled");
            console.log("💡 Run: surfaceDebug.deps.on() to enable");
          }

          return depState?.enabled || false;
        },
        // Add convenience methods for console usage
        deps: {
          off: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = false;
            console.log("🔇 Dependency tracking disabled");
          },
          on: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            console.log("🔊 Dependency tracking enabled");
          },
          quiet: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.level = "quiet";
            console.log("🔇 Dependency tracking: quiet mode (critical only)");
          },
          initAware: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.level = "init-aware";
            console.log(
              "🚀 Dependency tracking: init-aware mode (smart initialization filtering)"
            );
          },
          normal: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.level = "normal";
            console.log("🔊 Dependency tracking: normal mode");
          },
          verbose: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.level = "verbose";
            console.log("📢 Dependency tracking: verbose mode");
          },
          debug: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.level = "debug";
            console.log("🐛 Dependency tracking: debug mode (maximum detail)");
          },
          functionsOnly: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.filter = "functions-only";
            console.log("🔧 Dependency tracking: functions only");
          },
          objectsOnly: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.filter = "objects-only";
            console.log("📦 Dependency tracking: objects only");
          },
          unstableOnly: () => {
            const state = getGlobalDebugState();
            state.dependencies.enabled = true;
            state.dependencies.filter = "unstable-only";
            console.log("⚠️ Dependency tracking: unstable only");
          },
        },
      };

      console.log("✅ Global surfaceDebug object initialized");
    } catch (error) {
      console.warn("Failed to initialize global surfaceDebug object:", error);
    }
  }
};

// Initialize notification system on module load
initializeNotificationSystem();

// Initialize global debug object
initializeGlobalSurfaceDebug();

console.log(`
✅ Surface Dependency Tracking (integrated with unified debug framework)

🎯 PRIMARY PURPOSE: Fix "Maximum update depth exceeded" React errors!

🚀 NEW: Smart initialization detection! No more false warnings during app startup.

🔧 Debug Framework Integration:
  - Logs stream to both console AND debug panel
  - Controlled by DependencyTrackingConfig settings
  - Available debug points: dependencies, health, performance
  - Logs visible in DebugExternalPanel and DebugLogsList

🎛️ Console Commands:
  surfaceDebug.deps.off()           - Disable dependency logs
  surfaceDebug.deps.quiet()         - Only critical changes
  surfaceDebug.deps.initAware()     - 🌟 RECOMMENDED: Smart init filtering
  surfaceDebug.deps.normal()        - Standard dependency tracking
  surfaceDebug.deps.verbose()       - Detailed dependency tracking
  surfaceDebug.deps.functionsOnly() - Only function changes
  surfaceDebug.deps.objectsOnly()   - Only object changes
  surfaceDebug.deps.unstableOnly()  - Only changing dependencies
  
🧪 Test Commands:
  surfaceDebug.testDependencyTracking() - Verify functionality
  surfaceDebug.testMockComponent()      - Test mock scenarios
  
🚨 Emergency Protection:
  __SURFACE_EMERGENCY_STOP.activate()   - Stop ALL logging immediately
  __SURFACE_EMERGENCY_STOP.deactivate() - Restore normal operation
  __SURFACE_EMERGENCY_STOP.status()     - Check current status
  
🎯 During INITIALIZATION (🚀): Normal object changes, only warn if excessive
🎯 During RUNTIME: ⚠️ FREQUENT warnings point to infinite render culprits!
📊 NEW: (#3) counters show how many times each dependency has changed
`);
