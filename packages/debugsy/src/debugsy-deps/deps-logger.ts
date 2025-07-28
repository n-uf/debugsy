/**
 * Dependency Logger - Unified Debugsy Integration
 *
 * RESPONSIBILITY: Logging system for dependency tracking
 * - Simple delegation to the core debugsy logging system
 * - Provides clean API for dependency-specific logging
 * - Ensures unified system initialization
 */

import {
  type LogLevel,
  type LogType,
} from "../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";

/**
 * Core dependency logger that delegates to unified debugsy system
 */
class DependencyLogger {
  private ensureDebugsy() {
    if (!globalThis.debugsy) {
      initializeDebugsySpace();
    }
    return globalThis.debugsy;
  }

  log(
    message: string,
    data?: any,
    level: LogLevel = "info",
    logType?: LogType
  ): void {
    const debugsy = this.ensureDebugsy();
    debugsy.log("dependencies", message, data, level, logType);
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

/**
 * Get the debug manager, ensuring it's initialized
 * This is the bridge function for dependency tracking hooks
 */
export function getDepsDebugManager() {
  // Auto-initialize if needed (should already be done via module import)
  if (!globalThis.debugsy) {
    initializeDebugsySpace();
  }
  return globalThis.debugsy;
}

// Simplified logging API using unified debugsy system
// Note: These functions accept generic LogType but are typically used with DependencyLogType
export const logToDebugSystem = (
  message: string,
  data?: any,
  logType?: LogType
): void => {
  dependencyLogger.log(message, data, "info", logType);
};

export const logWarnToDebugSystem = (
  message: string,
  data?: any,
  logType?: LogType
): void => {
  dependencyLogger.warn(message, data, logType);
};

export const logErrorToDebugSystem = (
  message: string,
  data?: any,
  logType?: LogType
): void => {
  dependencyLogger.error(message, data, logType);
};
