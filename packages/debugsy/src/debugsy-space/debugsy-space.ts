// Import CLI utilities for browser console integration
import {
  createFullDebugsyCLI,
  type DebugsyCLIWithHelp,
} from "../debugsy-cli/cli-interface";
import { notifySubscribers } from "../debugsy-logs/hooks/debugsy-notifications";
import { captureHealthSnapshot as captureHealthSnapshotCore } from "../debugsy-logs/logic/health-snapshot";
import { registerSuperjsonCustomSerializers } from "../shared/superjson-config";
import {
  getDebugPointEmoji,
  MAX_STORED_LOGS,
  type LogLevel,
  type DebugLogEntry,
  type DebugPoint,
} from "./debugsy-constants";
import {
  debugSettingsControls,
  getGlobalDebugState,
} from "./debugsy-space-settings";
import { getAllPointKeys, isKnownPoint } from "../config";
import { applyConsole, consoleExposed, readSpace, rememberConsoleExposed, writeSpace } from "./space-holder";

const IS_DEVELOPMENT = (() => {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false; // no bundler-provided process.env
  }
})();

/** Unknown point keys already warned about: each warns once */
const warnedUnknownPoints = new Set<string>();
/** Unknown point keys with a check queued, so a burst of calls queues one */
const queuedUnknownPoints = new Set<string>();

/**
 * Development only: a log call to a point no module registered is dropped,
 * since nothing in the panel can turn that point on. Say so once per key.
 * The registry is checked again a microtask later, so a module registered
 * right after the call doesn't warn.
 */
function warnUnknownPointOnce(point: DebugPoint): void {
  if (warnedUnknownPoints.has(point) || queuedUnknownPoints.has(point)) return;
  queuedUnknownPoints.add(point);
  queueMicrotask(() => {
    queuedUnknownPoints.delete(point);
    if (isKnownPoint(point)) return;
    warnedUnknownPoints.add(point);
    console.warn(
      `[debugsy] No module registers the debug point "${point}", so log calls to it are dropped. ` +
        `Point keys are bare ("session", not "auth.session"); register them with registerModule(). ` +
        `Registered points: ${getAllPointKeys().join(", ")}.`
    );
  });
}

/**
 * Core Debug Manager Interface
 * Focused on debug functionality without CLI concerns
 */
export interface DebugsySpace {
  // === CORE LOGGING ===
  log: (
    point: DebugPoint,
    message: string,
    data?: any,
    level?: LogLevel,
    tags?: string[]
  ) => void;
  warn: (
    point: DebugPoint,
    message: string,
    data?: any,
    tags?: string[]
  ) => void;
  error: (
    point: DebugPoint,
    message: string,
    data?: any,
    tags?: string[]
  ) => void;
  critical: (
    point: DebugPoint,
    message: string,
    data?: any,
    tags?: string[]
  ) => void;
  time: (point: DebugPoint, label: string) => void;
  timeEnd: (point: DebugPoint, label: string) => void;

  // === STATE CHECKING ===
  isEnabled: (point: DebugPoint) => boolean;
  isConsoleEnabled: () => boolean;
  isVisualEnabled: () => boolean;
  isPerformanceEnabled: () => boolean;
  showVisual: (point: DebugPoint) => boolean;

  // === STATE CONTROL ===
  enable: (point: DebugPoint) => void;
  disable: (point: DebugPoint) => void;
  toggle: (point: DebugPoint) => void;
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
  getDepsSettings: () => any;
  state: any; // Getter for current state

  // === HEALTH MONITORING ===
  captureHealthSnapshot: () => any;
}

/**
 * Combined Interface for Browser Console
 * Composition of core debug functionality + CLI commands
 */
export interface DebugsySpaceWithCLI extends DebugsySpace, DebugsyCLIWithHelp {}

/**
 * Global type declarations for the unified system
 */
declare global {
  /** The console command: the debug space, while exposeConsole allows it (development by default) */
  var debugsy: DebugsySpaceWithCLI | undefined;
  var __debugsySanitizationLogged: boolean | undefined;
  var __DEBUGSY_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
}

/**
 * Create the core debug manager (without CLI)
 * This is the clean separation between debug functionality and CLI
 */
function createDebugsySpace(): DebugsySpace {
  // Memoization for expensive getters to prevent performance issues
  let memoizedLogs: DebugLogEntry[] | null = null;
  let memoizedLogsSource: DebugLogEntry[] | null = null;
  let lastLogsChange = 0;
  let memoizedState: any = null;
  let lastStateChange = 0;

  // Register superjson serializers for complex object logging
  registerSuperjsonCustomSerializers();

  const coreLog = (
    point: DebugPoint,
    message: string,
    data?: any,
    level: LogLevel = "info",
    tags?: string[]
  ): void => {
    // debugsy.emergency.activate(): nothing is logged until deactivate()
    if (globalThis.__DEBUGSY_EMERGENCY_STOP?.active) return;

    const globalState = getGlobalDebugState();

    if (!globalState.enabled.has(point)) {
      if (IS_DEVELOPMENT && !isKnownPoint(point)) {
        warnUnknownPointOnce(point);
      }
      return;
    }

    const logEntry: DebugLogEntry = {
      timestamp: Date.now(),
      point,
      level,
      message,
      data,
      sessionId: "default",
      tags,
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
        level === "error" || level === "critical" ? console.error : console.log;

      if (data) {
        logMethod(prefix, message, data);
      } else {
        logMethod(prefix, message);
      }
    }

    notifySubscribers();
  };

  return {
    // === CORE LOGGING ===
    log: coreLog,

    warn: (
      point: DebugPoint,
      message: string,
      data?: any,
      tags?: string[]
    ): void => {
      coreLog(point, message, data, "warn", tags);
    },

    error: (
      point: DebugPoint,
      message: string,
      data?: any,
      tags?: string[]
    ): void => {
      coreLog(point, message, data, "error", tags);
    },

    critical: (
      point: DebugPoint,
      message: string,
      data?: any,
      tags?: string[]
    ): void => {
      coreLog(point, message, data, "critical", tags);
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
        coreLog(point, `⏱️ ${label}: ${duration}ms`, undefined, "info");
        globalState.timers.delete(key);
      }
    },

    // === STATE CHECKING ===
    isEnabled: (point: DebugPoint): boolean => {
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

    showVisual: (point: DebugPoint): boolean => {
      const globalState = getGlobalDebugState();
      return globalState.visual && globalState.enabled.has(point);
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

    toggle: (point: DebugPoint): void => {
      const globalState = getGlobalDebugState();
      if (globalState.enabled.has(point)) {
        debugSettingsControls.disable(point);
      } else {
        debugSettingsControls.enable(point);
      }
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

      // Reuse the copy for repeated reads within a frame (16 ms), but only
      // while the log is the one it copied: a clear swaps in a new array, a
      // new line makes it longer, and a line past MAX_STORED_LOGS swaps in a
      // new array of the same length.
      if (
        memoizedLogs &&
        memoizedLogsSource === globalState.logs &&
        memoizedLogs.length === globalState.logs.length &&
        currentTime - lastLogsChange < 16
      ) {
        return memoizedLogs;
      }

      memoizedLogs = [...globalState.logs];
      memoizedLogsSource = globalState.logs;
      lastLogsChange = currentTime;

      return memoizedLogs;
    },

    clearLogs: (): void => {
      debugSettingsControls.clearLogs();
      notifySubscribers();
    },

    // === STATE ACCESS ===
    getDebugState: () => getGlobalDebugState(),

    getDepsSettings: () => {
      const state = getGlobalDebugState();
      return {
        enabled: state.enabled.has("dependencies"),
        level: state.deps.level,
        filter: state.deps.filter,
        allowedHooks: state.deps.allowedHooks,
        excludedHooks: state.deps.excludedHooks,
        throttleMs: state.deps.throttleMs,
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
      return captureHealthSnapshotCore(getGlobalDebugState(), coreLog);
    },
  };
}

/**
 * Initialize the unified global debug system
 * Now properly separates core debug functionality from CLI
 */
export function initializeDebugsySpace(): void {
  const isReinit = !!readSpace();

  // Register superjson custom serializers for React Fiber and DOM elements
  registerSuperjsonCustomSerializers();

  // Emergency stop: while active, the core log call drops every log
  if (!globalThis.__DEBUGSY_EMERGENCY_STOP) {
    globalThis.__DEBUGSY_EMERGENCY_STOP = {
      active: false,
      activate: () => {
        globalThis.__DEBUGSY_EMERGENCY_STOP.active = true;
        console.warn(
          "🛑 [debugsy] Emergency stop on: nothing is logged until debugsy.emergency.deactivate()."
        );
      },
      deactivate: () => {
        globalThis.__DEBUGSY_EMERGENCY_STOP.active = false;
        console.log("✅ [debugsy] Emergency stop off: logging again.");
      },
      status: () => {
        console.log(
          globalThis.__DEBUGSY_EMERGENCY_STOP.active
            ? "🛑 [debugsy] Emergency stop on: nothing is logged."
            : "✅ [debugsy] Emergency stop off."
        );
      },
    };
  }

  // Create the core debug manager (clean separation of concerns)
  const coreDebugManager = createDebugsySpace();

  // Create the CLI interface that uses the core debug manager
  const cliInterface = createFullDebugsyCLI(coreDebugManager);

  // Always (re-)create unified interface so HMR picks up new closures
  writeSpace({
    ...coreDebugManager,
    ...cliInterface,
  } as DebugsySpaceWithCLI);
  // The console command follows: the app's last exposeConsole call, else on in development only
  applyConsole(consoleExposed(IS_DEVELOPMENT));

  if (!isReinit && IS_DEVELOPMENT) {
    console.log("✅ Debugsy System initialized");
  }
}

/**
 * Get debugsy instance with auto-initialization
 * Safe to use in any context - React or non-React
 * BULLETPROOF: Guaranteed to never return undefined
 */
export function getDebugsy(): DebugsySpaceWithCLI {
  if (!readSpace()) {
    initializeDebugsySpace();
  }

  // Final safety check: if initialization somehow failed,
  // return minimal working interface to prevent crashes
  const space = readSpace();
  if (!space) {
    console.error(
      "❌ CRITICAL: Debugsy initialization failed - using emergency fallback"
    );
    return {
      log: () => {},
      warn: () => {},
      error: () => {},
      critical: () => {},
      time: () => {},
      timeEnd: () => {},
      isEnabled: () => false,
      isConsoleEnabled: () => false,
      isVisualEnabled: () => false,
      isPerformanceEnabled: () => false,
      showVisual: () => false,
      enable: () => {},
      disable: () => {},
      toggle: () => {},
      enableAll: () => {},
      disableAll: () => {},
      setConsoleEnabled: () => {},
      setVisualEnabled: () => {},
      setPerformanceEnabled: () => {},
      getLogs: () => [],
      clearLogs: () => {},
      getDebugState: () => ({}),
      getDepsSettings: () => ({}),
      state: {},
      captureHealthSnapshot: () => ({}),
    } as any; // Emergency fallback - minimal interface
  }

  return space;
}

/**
 * Puts the `debugsy` console command on the page (`globalThis.debugsy`), or takes it off. Default: on in
 * development, off in production builds, so a live site doesn't hand every visitor its log. An app that gates its
 * debugging (a token, a signed-in admin) turns it on once allowed. Logging, the hooks and the panel work either
 * way; the choice holds for every copy of debugsy on the page and through HMR.
 */
export function exposeConsole(on: boolean): void {
  rememberConsoleExposed(on);
  if (on) getDebugsy();
  applyConsole(on);
}

// ===== AUTO-INITIALIZATION =====
// Initialize debugsy automatically when this module is imported
// This ensures debugsy is always available everywhere
initializeDebugsySpace();

/**
 * Convenient short export for non-React usage
 * GUARANTEED SAFE: Uses getDebugsy() which handles edge cases
 *
 * Why safer than the console command (globalThis.debugsy, absent in production by default):
 * 1. Handles potential CLI initialization failures
 * 2. Provides auto-recovery if needed
 * 3. Always returns a valid DebugsySpaceWithCLI object
 * 4. Consistent with getDebugsy() function behavior
 */
export const dsy = getDebugsy();
