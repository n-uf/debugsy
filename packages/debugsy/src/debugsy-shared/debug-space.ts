import { initializeDebugsyCLI, type DebugsyCLIWithHelp } from "../debugsy-cli";
import { notifySubscribers } from "../debugsy-logs/hooks/debug-notifications";
import { captureHealthSnapshot as captureHealthSnapshotCore } from "../debugsy-logs/hooks/health-snapshot";
import {
  getDebugPointEmoji,
  LogLevel,
  LogType,
  MAX_STORED_LOGS,
  type DebugLogEntry,
  type DebugPoint,
} from "./debug-constants";
import { debugSettingsControls, getGlobalDebugState } from "./debug-settings";
import { registerSuperjsonCustomSerializers } from "./superjson-config";

/**
 * Unified Global Debug Manager Interface
 * Combines functionality from both debug-deps.ts and use-debug.ts
 */
export interface DebugsySpace extends DebugsyCLIWithHelp {
  // === CORE LOGGING (from use-debug.ts) ===
  log: (
    point: DebugPoint,
    message: string,
    data?: any,
    level?: LogLevel,
    logType?: LogType
  ) => void;
  warn: (
    point: DebugPoint,
    message: string,
    data?: any,
    logType?: LogType
  ) => void;
  error: (
    point: DebugPoint,
    message: string,
    data?: any,
    logType?: LogType
  ) => void;
  critical: (
    point: DebugPoint,
    message: string,
    data?: any,
    logType?: LogType
  ) => void;
  time: (point: DebugPoint, label: string) => void;
  timeEnd: (point: DebugPoint, label: string) => void;

  // === STATE CHECKING ===
  isEnabled: (point: DebugPoint) => boolean;
  isConsoleEnabled: () => boolean;
  isVisualEnabled: () => boolean;
  isPerformanceEnabled: () => boolean;

  // === STATE CONTROL ===
  enable: (point: DebugPoint) => void;
  disable: (point: DebugPoint) => void;
  enableAll: () => void;
  disableAll: () => void;
  setConsoleEnabled: (enabled: boolean) => void;
  setVisualEnabled: (enabled: boolean) => void;
  setPerformanceEnabled: (enabled: boolean) => void;

  // === LOGS MANAGEMENT ===
  getLogs: () => DebugLogEntry[];
  clearLogs: () => void;

  // === STATE ACCESS ===
  getDebugState: () => any;
  getDependencyStatus: () => any;
  state: any; // Getter for current state

  // CLI commands are now inherited from DebugsyCLIWithHelp
}

/**
 * Global type declarations for the unified system
 */
declare global {
  var debugsySpace: DebugsySpace;
  var debugsy: DebugsySpace; // Convenient alias
  var __debugsySanitizationLogged: boolean | undefined;
  var __DEBUGSY_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
}

/**
 * Create the unified global debug manager
 * This replaces both the debug-deps.ts and use-debug.ts global objects
 */
function createDebugsySpace(): DebugsySpace {
  // Memoization for expensive getters to prevent performance issues
  let memoizedLogs: DebugLogEntry[] | null = null;
  let lastLogsChange = 0;
  let memoizedState: any = null;
  let lastStateChange = 0;

  // Register superjson serializers for complex object logging
  registerSuperjsonCustomSerializers();

  const coreManager = {
    // === CORE LOGGING (from use-debug.ts) ===
    log: (
      point: DebugPoint,
      message: string,
      data?: any,
      level: LogLevel = "info",
      logType?: LogType
    ): void => {
      const globalState = getGlobalDebugState();

      if (!globalState.enabled.has(point) && point !== "health") {
        return;
      }

      const logEntry: DebugLogEntry = {
        timestamp: Date.now(),
        point,
        level,
        message,
        data,
        sessionId: "default", // Add required sessionId
        logType, // Optional logType
      };

      globalState.logs.push(logEntry);

      if (globalState.logs.length > MAX_STORED_LOGS) {
        globalState.logs = globalState.logs.slice(-MAX_STORED_LOGS);
      }

      if (globalState.console) {
        const emoji = getDebugPointEmoji(point);
        const timestamp = new Date(logEntry.timestamp).toLocaleTimeString();
        const prefix = `[${timestamp}] ${emoji} [${point}]`;

        const logMethod =
          level === "error" || level === "critical"
            ? console.error
            : console.log;

        if (data) {
          logMethod(prefix, message, data);
        } else {
          logMethod(prefix, message);
        }
      }

      notifySubscribers();
    },

    warn: (
      point: DebugPoint,
      message: string,
      data?: any,
      logType?: LogType
    ): void => {
      coreManager.log(point, message, data, "warn", logType);
    },

    error: (
      point: DebugPoint,
      message: string,
      data?: any,
      logType?: LogType
    ): void => {
      coreManager.log(point, message, data, "error", logType);
    },

    critical: (
      point: DebugPoint,
      message: string,
      data?: any,
      logType?: LogType
    ): void => {
      coreManager.log(point, message, data, "critical", logType);
    },

    time: (point: DebugPoint, label: string): void => {
      const globalState = getGlobalDebugState();
      const key = `${point}-${label}`;
      globalState.timers.set(key, Date.now());
    },

    timeEnd: (point: DebugPoint, label: string): void => {
      const globalState = getGlobalDebugState();
      const key = `${point}-${label}`;
      const startTime = globalState.timers.get(key);

      if (startTime) {
        const duration = Date.now() - startTime;
        coreManager.log(point, `⏱️ ${label}: ${duration}ms`, undefined, "info");
        globalState.timers.delete(key);
      }
    },

    // === STATE CHECKING ===
    isEnabled: (point: DebugPoint): boolean => {
      // Health debug point is always enabled
      if (point === "health") return true;

      const globalState = getGlobalDebugState();
      return globalState.enabled.has(point);
    },

    isConsoleEnabled: (): boolean => {
      const globalState = getGlobalDebugState();
      return globalState.console;
    },

    isVisualEnabled: (): boolean => {
      const globalState = getGlobalDebugState();
      return globalState.visual;
    },

    isPerformanceEnabled: (): boolean => {
      const globalState = getGlobalDebugState();
      return globalState.performance;
    },

    // === STATE CONTROL ===
    enable: (point: DebugPoint): void => {
      debugSettingsControls.enable(point);
      notifySubscribers();
    },

    disable: (point: DebugPoint): void => {
      debugSettingsControls.disable(point);
      notifySubscribers();
    },

    enableAll: (): void => {
      debugSettingsControls.enableAll();
      notifySubscribers();
    },

    disableAll: (): void => {
      debugSettingsControls.disableAll();
      notifySubscribers();
    },

    setConsoleEnabled: (enabled: boolean): void => {
      debugSettingsControls.setConsoleEnabled(enabled);
      notifySubscribers();
    },

    setVisualEnabled: (enabled: boolean): void => {
      debugSettingsControls.setVisualEnabled(enabled);
      notifySubscribers();
    },

    setPerformanceEnabled: (enabled: boolean): void => {
      debugSettingsControls.setPerformanceEnabled(enabled);
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
      debugSettingsControls.clearLogs();
      notifySubscribers();
    },

    // === STATE ACCESS ===
    getDebugState: () => getGlobalDebugState(),

    getDependencyStatus: () => {
      const state = getGlobalDebugState();
      return {
        enabled: state.enabled.has("dependencies"),
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

    // === HEALTH MONITORING ===
    captureHealthSnapshot: () => {
      return captureHealthSnapshotCore(getGlobalDebugState(), coreManager.log);
    },
  };

  // Create the CLI interface with all commands
  const cliInterface = initializeDebugsyCLI(coreManager);

  // Combine core manager with CLI interface
  return {
    ...coreManager,
    ...cliInterface,
  };
}

/**
 * Initialize the unified global debug system
 * This replaces both debug-deps.ts and use-debug.ts initialization
 */
export function initializeDebugsySpace(): void {
  if (globalThis.debugsySpace) {
    return; // Already initialized
  }

  console.log("🚀 Initializing Unified Surface Debug System...");

  // Register superjson custom serializers for React Fiber and DOM elements
  registerSuperjsonCustomSerializers();

  // Initialize emergency stop
  if (!globalThis.__DEBUGSY_EMERGENCY_STOP) {
    globalThis.__DEBUGSY_EMERGENCY_STOP = {
      active: false,
      activate: () => {
        console.error(
          "🚨 EMERGENCY STOP ACTIVATED - All Surface debug logging disabled"
        );
        globalThis.__DEBUGSY_EMERGENCY_STOP.active = true;
      },
      deactivate: () => {
        console.log("✅ Emergency stop deactivated - Debug logging restored");
        globalThis.__DEBUGSY_EMERGENCY_STOP.active = false;
      },
      status: () => {
        const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};
        console.log("🔍 Surface Debug Status:", {
          emergencyActive: globalThis.__DEBUGSY_EMERGENCY_STOP.active,
          dependencyTracking: depState.enabled,
          level: depState.level,
          filter: depState.filter,
        });
      },
    };
  }

  // Create the unified debug manager
  globalThis.debugsySpace = createDebugsySpace();

  // Create convenient alias for easier access
  (globalThis as any).debugsy = globalThis.debugsySpace;

  console.log("✅ Debugsy System initialized");
  console.log(
    "🔍 Available methods on debugsy:",
    Object.keys(globalThis.debugsy)
  );
  console.log("🔍 debugsy.help type:", typeof globalThis.debugsy.help);
  console.log(
    "💡 Type 'debugsy.help()' in console to see all available commands"
  );
}

// Add a global initialization trigger for debugging
(globalThis as any).initDebugsyManually = () => {
  console.log("🔧 Manually triggering debugsy initialization...");
  initializeDebugsySpace();
  return globalThis.debugsy;
};
