/**
 * Dependency Logger - Unified Debugsy Integration
 *
 * RESPONSIBILITY: Logging system for dependency tracking
 * - Simple delegation to the core debugsy logging system
 * - Provides clean API for dependency-specific logging
 * - Ensures unified system initialization
 */

import type { LogLevel } from "../debugsy-shared/debug-constants";
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

  log(message: string, data?: any, level: LogLevel = "info"): void {
    const debugsy = this.ensureDebugsy();
    switch (level) {
      case "warn":
        debugsy.warn("dependencies", message, data);
        break;
      case "error":
        debugsy.error("dependencies", message, data);
        break;
      case "critical":
        debugsy.critical("dependencies", message, data);
        break;
      default:
        debugsy.log("dependencies", message, data, level);
    }
  }

  warn(message: string, data?: any): void {
    this.log(message, data, "warn");
  }

  error(message: string, data?: any): void {
    this.log(message, data, "error");
  }

  critical(message: string, data?: any): void {
    this.log(message, data, "critical");
  }
}

// Singleton dependency logger instance - delegates to unified debugsy
export const dependencyLogger = new DependencyLogger();

// Simplified logging API using unified debugsy system
export const logToDebugSystem = (message: string, data?: any): void => {
  dependencyLogger.log(message, data);
};

export const logWarnToDebugSystem = (message: string, data?: any): void => {
  dependencyLogger.warn(message, data);
};

export const logErrorToDebugSystem = (message: string, data?: any): void => {
  dependencyLogger.error(message, data);
};
