/**
 * Dependency Logger - Unified Debugsy Integration
 *
 * RESPONSIBILITY: Logging system for dependency tracking
 * - Simple delegation to the core debugsy logging system
 * - Provides clean API for dependency-specific logging
 * - Ensures unified system initialization
 */

import type {
  DependencyLogType,
  LogLevel,
  LogType,
} from "../debugsy-shared/debug-constants";
import { initializeUnifiedDebugSystem } from "../debugsy-shared/debug-space";

/**
 * Unified Debugsy Logger for Dependencies
 * Simple delegation to the core debugsy logging system
 *
 * ARCHITECTURE: Dependencies as Debugsy Extension
 * - Core debugsy handles all logging, state management, and UI integration
 * - Dependencies module focuses only on React-specific tracking logic
 * - Clean separation of concerns with unified interface
 */
class DependencyLogger {
  private ensureDebugsy() {
    if (!globalThis.surfaceDebug) {
      initializeUnifiedDebugSystem();
    }
    return globalThis.surfaceDebug;
  }

  log(
    message: string,
    data?: any,
    level: LogLevel = "info",
    logType?: LogType
  ): void {
    const debugsy = this.ensureDebugsy();
    switch (level) {
      case "warn":
        debugsy.warn("dependencies", message, data, logType);
        break;
      case "error":
        debugsy.error("dependencies", message, data, logType);
        break;
      case "critical":
        debugsy.critical("dependencies", message, data, logType);
        break;
      default:
        debugsy.log("dependencies", message, data, level, logType);
    }
  }

  warn(message: string, data?: any, logType?: LogType): void {
    this.log(message, data, "warn", logType);
  }

  error(message: string, data?: any, logType?: LogType): void {
    this.log(message, data, "error", logType);
  }

  critical(message: string, data?: any, logType?: LogType): void {
    this.log(message, data, "critical", logType);
  }
}

// Singleton dependency logger instance - delegates to unified debugsy
export const dependencyLogger = new DependencyLogger();

// Simplified logging API using unified debugsy system
// Note: These functions accept generic LogType but are typically used with DependencyLogType
export const logToDebugSystem = (
  message: string,
  data?: any,
  logType?: DependencyLogType
): void => {
  dependencyLogger.log(message, data, "info", logType);
};

export const logWarnToDebugSystem = (
  message: string,
  data?: any,
  logType?: DependencyLogType
): void => {
  dependencyLogger.warn(message, data, logType);
};

export const logErrorToDebugSystem = (
  message: string,
  data?: any,
  logType?: DependencyLogType
): void => {
  dependencyLogger.error(message, data, logType);
};
