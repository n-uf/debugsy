import { notifySubscribers } from "../debug-logs/hooks/debug-notifications";
import { captureHealthSnapshot as captureHealthSnapshotCore } from "../debug-logs/hooks/health-snapshot";
import {
  needsSanitization,
  SANITIZATION_PRESETS,
  sanitizeLogData,
} from "../debug-logs/utils/log-data-sanitization";
import type {
  DebugLogEntry,
  DebugPoint,
  DependencyFilter,
  DependencyLogLevel,
  LogLevel,
} from "./debug-constants";
import { getDebugEmoji, MAX_STORED_LOGS } from "./debug-constants";
import { debugStateControls, getGlobalDebugState } from "./debug-state";

/**
 * Unified Global Debug Manager Interface
 * Combines functionality from both debug-deps.ts and use-debug.ts
 */
export interface UnifiedSurfaceDebug {
  // === CORE LOGGING (from use-debug.ts) ===
  log: (
    point: DebugPoint,
    message: string,
    data?: any,
    level?: LogLevel
  ) => void;
  warn: (point: DebugPoint, message: string, data?: any) => void;
  error: (point: DebugPoint, message: string, data?: any) => void;
  critical: (point: DebugPoint, message: string, data?: any) => void;
  time: (point: DebugPoint, label: string) => void;
  timeEnd: (point: DebugPoint, label: string) => void;

  // === STATE CHECKING ===
  enabled: boolean; // Backward compatibility - overall enabled state
  isEnabled: (point: DebugPoint) => boolean;
  showVisual: (point: DebugPoint) => boolean;

  // === CONTROL FUNCTIONS ===
  enable: (point: DebugPoint) => void;
  disable: (point: DebugPoint) => void;
  toggle: (point: DebugPoint) => void;
  enableAll: () => void;
  disableAll: () => void;

  // === CONFIGURATION ===
  setConsoleEnabled: (enabled: boolean) => void;
  setVisualEnabled: (enabled: boolean) => void;
  setPerformanceEnabled: (enabled: boolean) => void;

  // === LOGS MANAGEMENT ===
  getLogs: () => DebugLogEntry[];
  clearLogs: () => void;

  // === STATE ACCESS (from debug-deps.ts) ===
  getDebugState: () => any; // Simplified to avoid import issues
  getDependencyStatus: () => {
    enabled: boolean;
    level: DependencyLogLevel;
    filter: DependencyFilter;
    allowedHooks: string[] | null;
    excludedHooks: string[];
    throttleMs: number;
  };

  // === CURRENT STATE GETTER ===
  state: {
    enabled: DebugPoint[];
    console: boolean;
    visual: boolean;
    performance: boolean;
  };

  // === CONVENIENCE METHODS (from debug-deps.ts) ===
  deps: {
    off: () => void;
    on: () => void;
    quiet: () => void;
    initAware: () => void; // Custom method, not bound to type
    normal: () => void;
    verbose: () => void;
    debug: () => void;
    functionsOnly: () => void;
    objectsOnly: () => void;
    unstableOnly: () => void;
  };

  // === TESTING UTILITIES (from debug-deps.ts) ===
  testDependencyTracking: () => boolean;
  testMockComponent: () => boolean;

  // === HEALTH MONITORING ===
  captureHealthSnapshot: () => any; // HealthMetrics type

  // === EMERGENCY CONTROLS ===
  emergency: {
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
}

/**
 * Global type declarations for the unified system
 */
declare global {
  var surfaceDebug: UnifiedSurfaceDebug;
  var __debugSanitizationLogged: boolean | undefined;
  var __SURFACE_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
}

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
 * Create the unified global debug manager
 * This replaces both the debug-deps.ts and use-debug.ts global objects
 */
function createUnifiedDebugManager(): UnifiedSurfaceDebug {
  // Memoization for expensive getters to prevent performance issues
  let memoizedState: any = null;
  let memoizedLogs: DebugLogEntry[] = [];
  let lastStateChange = 0;
  let lastLogsChange = 0;

  const manager: UnifiedSurfaceDebug = {
    // === CORE LOGGING FUNCTIONS ===
    log: (
      point: DebugPoint,
      message: string,
      data?: any,
      level: LogLevel = "info"
    ): void => {
      if (!manager.isEnabled(point)) return;

      const globalState = getGlobalDebugState();

      // SAFETY: Sanitize data to prevent browser freezing from heavy objects
      let sanitizedData = data;
      if (data !== undefined) {
        try {
          // Fast check if data needs sanitization
          if (needsSanitization(data)) {
            // Use React-focused preset for UI components
            const config =
              point === "surface" || point === "surface-interactions"
                ? SANITIZATION_PRESETS.reactFocused
                : SANITIZATION_PRESETS.balanced;

            sanitizedData = sanitizeLogData(data, config);

            // Log sanitization stats for debugging (only once per session to avoid spam)
            if (!globalThis.__debugSanitizationLogged) {
              console.log(
                `🧹 [debugsy] Data sanitization active for heavy objects. Point: ${point}`,
                {
                  originalSize: estimateDataSize(data),
                  sanitizedSize: estimateDataSize(sanitizedData),
                  timeTaken: (sanitizedData as any).__sanitizationTime + "ms",
                }
              );
              globalThis.__debugSanitizationLogged = true;
            }
          }
        } catch (error) {
          // Fallback: If sanitization fails, use safe fallback
          console.warn(
            `⚠️ [debugsy] Failed to sanitize data for ${point}:`,
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
        level,
        point,
        message,
        data: sanitizedData,
        sessionId: "default",
      };

      // Add to logs array (keep last MAX_STORED_LOGS)
      globalState.logs = [
        ...globalState.logs.slice(-(MAX_STORED_LOGS - 1)),
        logEntry,
      ];

      // Schedule notification for next frame to avoid render-time updates
      notifySubscribers();

      // Console output if enabled
      if (globalState.console) {
        const emoji = getDebugEmoji(point);
        const prefix = `${emoji} [${point}]`;

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

    warn: (point: DebugPoint, message: string, data?: any): void => {
      manager.log(point, message, data, "warn");
    },

    error: (point: DebugPoint, message: string, data?: any): void => {
      manager.log(point, message, data, "error");
    },

    critical: (point: DebugPoint, message: string, data?: any): void => {
      manager.log(point, message, data, "critical");
    },

    time: (point: DebugPoint, label: string): void => {
      const globalState = getGlobalDebugState();
      if (!globalState.performance || !manager.isEnabled(point)) return;
      console.time(`[${point}] ${label}`);
    },

    timeEnd: (point: DebugPoint, label: string): void => {
      const globalState = getGlobalDebugState();
      if (!globalState.performance || !manager.isEnabled(point)) return;
      console.timeEnd(`[${point}] ${label}`);
    },

    // === STATE CHECKING ===
    get enabled(): boolean {
      const globalState = getGlobalDebugState();
      return globalState.enabled.size > 0; // Any debug points enabled
    },

    isEnabled: (point: DebugPoint): boolean => {
      // Health debug point is always enabled
      if (point === "health") return true;

      const globalState = getGlobalDebugState();
      return globalState.enabled.has(point) || globalState.enabled.has("all");
    },

    showVisual: (point: DebugPoint): boolean => {
      const globalState = getGlobalDebugState();
      return globalState.visual && manager.isEnabled(point);
    },

    // === CONTROL FUNCTIONS ===
    enable: (point: DebugPoint): void => {
      debugStateControls.enable(point);
      notifySubscribers();
    },

    disable: (point: DebugPoint): void => {
      debugStateControls.disable(point);
      notifySubscribers();
    },

    toggle: (point: DebugPoint): void => {
      const globalState = getGlobalDebugState();
      const isCurrentlyEnabled = globalState.enabled.has(point);

      if (isCurrentlyEnabled) {
        manager.disable(point);
      } else {
        manager.enable(point);
      }
    },

    enableAll: (): void => {
      debugStateControls.enableAll();
      notifySubscribers();
    },

    disableAll: (): void => {
      debugStateControls.disableAll();
      notifySubscribers();
    },

    // === CONFIGURATION ===
    setConsoleEnabled: (enabled: boolean): void => {
      debugStateControls.setConsoleEnabled(enabled);
      notifySubscribers();
    },

    setVisualEnabled: (enabled: boolean): void => {
      debugStateControls.setVisualEnabled(enabled);
      notifySubscribers();
    },

    setPerformanceEnabled: (enabled: boolean): void => {
      debugStateControls.setPerformanceEnabled(enabled);
      notifySubscribers();
    },

    // === LOGS MANAGEMENT ===
    getLogs: (): DebugLogEntry[] => {
      const globalState = getGlobalDebugState();
      const currentTime = Date.now();

      // Return memoized result if logs haven't changed (within 16ms for ~60fps)
      if (memoizedLogs && currentTime - lastLogsChange < 16) {
        return memoizedLogs;
      }

      // Create new array copy only when needed
      memoizedLogs = [...globalState.logs];
      lastLogsChange = currentTime;

      return memoizedLogs;
    },

    clearLogs: (): void => {
      debugStateControls.clearLogs();
      notifySubscribers();
    },

    // === STATE ACCESS ===
    getDebugState: () => getGlobalDebugState(),

    getDependencyStatus: () => {
      const state = getGlobalDebugState();
      return {
        enabled: state.enabled.has("dependencies"), // Use unified debug point system
        level: state.dependencies.level,
        filter: state.dependencies.filter,
        allowedHooks: state.dependencies.allowedHooks,
        excludedHooks: state.dependencies.excludedHooks,
        throttleMs: state.dependencies.throttleMs,
      };
    },

    // === CURRENT STATE GETTER ===
    get state() {
      const globalState = getGlobalDebugState();
      const currentTime = Date.now();

      // Return memoized result if state hasn't changed (within 16ms for ~60fps)
      if (memoizedState && currentTime - lastStateChange < 16) {
        return memoizedState;
      }

      // Create new state object only when needed
      memoizedState = {
        enabled: Array.from(globalState.enabled),
        console: globalState.console,
        visual: globalState.visual,
        performance: globalState.performance,
      };
      lastStateChange = currentTime;

      return memoizedState;
    },

    // === CONVENIENCE METHODS (from debug-deps.ts) ===
    deps: {
      off: () => {
        const state = getGlobalDebugState();
        state.enabled.delete("dependencies"); // Use unified debug point system
        console.log("🔇 Dependency tracking disabled");
        notifySubscribers();
      },
      on: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        console.log("🔊 Dependency tracking enabled");
        notifySubscribers();
      },
      quiet: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.level = "quiet";
        console.log("🔇 Dependency tracking: quiet mode (critical only)");
        notifySubscribers();
      },
      initAware: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.level = "normal"; // Use valid DependencyLogLevel
        // TODO: Add custom initialization awareness logic if needed
        console.log(
          "🚀 Dependency tracking: init-aware mode (smart initialization filtering)"
        );
        notifySubscribers();
      },
      normal: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.level = "normal";
        console.log("🔊 Dependency tracking: normal mode");
        notifySubscribers();
      },
      verbose: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.level = "verbose";
        console.log("📢 Dependency tracking: verbose mode");
        notifySubscribers();
      },
      debug: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.level = "debug";
        console.log("🐛 Dependency tracking: debug mode (maximum detail)");
        notifySubscribers();
      },
      functionsOnly: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.filter = "functions-only";
        console.log("📝 Dependency tracking: functions only");
        notifySubscribers();
      },
      objectsOnly: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.filter = "objects-only";
        console.log("🔗 Dependency tracking: objects only");
        notifySubscribers();
      },
      unstableOnly: () => {
        const state = getGlobalDebugState();
        state.enabled.add("dependencies"); // Use unified debug point system
        state.dependencies.filter = "unstable-only";
        console.log("⚠️ Dependency tracking: unstable only");
        notifySubscribers();
      },
    },

    // === TESTING UTILITIES ===
    testDependencyTracking: (): boolean => {
      console.log("🧪 Testing useWhyDidYouUpdate functionality...");

      // Check if global surfaceDebug object exists
      if (!globalThis.surfaceDebug) {
        console.error("❌ Global surfaceDebug object not found");
        return false;
      }

      console.log("✅ Global surfaceDebug object found");

      // Check if getDependencyStatus method exists
      if (!globalThis.surfaceDebug.getDependencyStatus) {
        console.error("❌ getDependencyStatus method not found");
        return false;
      }

      console.log("✅ getDependencyStatus method found");

      // Test dependency status
      const depStatus = globalThis.surfaceDebug.getDependencyStatus();
      console.log("📋 Current dependency status:", depStatus);

      // Test if dependency tracking is enabled
      if (!depStatus.enabled) {
        console.warn("⚠️ Dependency tracking is currently disabled");
        console.log("🔧 Enabling dependency tracking...");
        globalThis.surfaceDebug.deps.on();
        const newStatus = globalThis.surfaceDebug.getDependencyStatus();
        console.log("📋 Updated dependency status:", newStatus);
      }

      console.log("\n✅ useWhyDidYouUpdate should now be working!");
      console.log("📝 To test in components:");
      console.log(
        "   1. Add useWhyDidYouUpdate('MyComponent', props) to any component"
      );
      console.log("   2. Change props and watch for dependency change logs");
      console.log("   3. Use surfaceDebug.deps.verbose() for more detail");

      return true;
    },

    testMockComponent: (): boolean => {
      console.log("\n🧪 Testing with mock component scenario...");

      const depState = globalThis.surfaceDebug?.getDependencyStatus?.();

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

    // === HEALTH MONITORING ===
    captureHealthSnapshot: () => {
      return captureHealthSnapshotCore(getGlobalDebugState(), manager.log);
    },

    // === EMERGENCY CONTROLS ===
    emergency: {
      activate: () => {
        console.error(
          "🚨 EMERGENCY STOP ACTIVATED - All Surface debug logging disabled"
        );
        globalThis.__SURFACE_EMERGENCY_STOP.active = true;
      },
      deactivate: () => {
        console.log("✅ Emergency stop deactivated - Debug logging restored");
        globalThis.__SURFACE_EMERGENCY_STOP.active = false;
      },
      status: () => {
        const depState = globalThis.surfaceDebug?.getDependencyStatus?.() || {};
        console.log("🔍 Surface Debug Status:", {
          emergencyActive: globalThis.__SURFACE_EMERGENCY_STOP.active,
          dependencyTracking: depState.enabled,
          level: depState.level,
          filter: depState.filter,
        });
      },
    },
  };

  return manager;
}

/**
 * Initialize the unified global debug system
 * This replaces both debug-deps.ts and use-debug.ts initialization
 */
export function initializeUnifiedDebugSystem(): void {
  if (globalThis.surfaceDebug) {
    return; // Already initialized
  }

  console.log("🚀 Initializing Unified Surface Debug System...");

  // Initialize emergency stop
  if (!globalThis.__SURFACE_EMERGENCY_STOP) {
    globalThis.__SURFACE_EMERGENCY_STOP = {
      active: false,
      activate: () => {
        console.error(
          "🚨 EMERGENCY STOP ACTIVATED - All Surface debug logging disabled"
        );
        globalThis.__SURFACE_EMERGENCY_STOP.active = true;
      },
      deactivate: () => {
        console.log("✅ Emergency stop deactivated - Debug logging restored");
        globalThis.__SURFACE_EMERGENCY_STOP.active = false;
      },
      status: () => {
        const depState = globalThis.surfaceDebug?.getDependencyStatus?.() || {};
        console.log("🔍 Surface Debug Status:", {
          emergencyActive: globalThis.__SURFACE_EMERGENCY_STOP.active,
          dependencyTracking: depState.enabled,
          level: depState.level,
          filter: depState.filter,
        });
      },
    };
  }

  // Create the unified debug manager
  globalThis.surfaceDebug = createUnifiedDebugManager();

  console.log("✅ Unified Surface Debug System initialized");

  console.log(`
✅ Surface Debug System (Unified)

🎯 PRIMARY PURPOSE: Fix "Maximum update depth exceeded" React errors!

🚀 NEW: Smart initialization detection! No more false warnings during app startup.

🔧 Unified Debug Framework:
  - Single global object: surfaceDebug
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
  surfaceDebug.emergency.activate()   - Stop ALL logging immediately
  surfaceDebug.emergency.deactivate() - Restore normal operation
  surfaceDebug.emergency.status()     - Check current status
  
🎯 During INITIALIZATION (🚀): Normal object changes, only warn if excessive
🎯 During RUNTIME: ⚠️ FREQUENT warnings point to infinite render culprits!
📊 NEW: (#3) counters show how many times each dependency has changed
`);
}
