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
} from "../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";

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
    tags?: string[]
  ): void {
    const debugsy = this.ensureDebugsy();
    debugsy.log("dependencies", message, data, level, tags);
  }

  warn(message: string, data?: any, tags?: string[]): void {
    this.log(message, data, "warn", tags);
  }

  error(message: string, data?: any, tags?: string[]): void {
    this.log(message, data, "error", tags);
  }

  critical(message: string, data?: any, tags?: string[]): void {
    this.log(message, data, "critical", tags);
  }
}

export const dependencyLogger = new DependencyLogger();

export function getDepsDebugManager() {
  if (!globalThis.debugsy) {
    initializeDebugsySpace();
  }
  return globalThis.debugsy;
}

export const logToDebugSystem = (
  message: string,
  data?: any,
  tags?: string[]
): void => {
  dependencyLogger.log(message, data, "info", tags);
};

export const logWarnToDebugSystem = (
  message: string,
  data?: any,
  tags?: string[]
): void => {
  dependencyLogger.warn(message, data, tags);
};

export const logErrorToDebugSystem = (
  message: string,
  data?: any,
  tags?: string[]
): void => {
  dependencyLogger.error(message, data, tags);
};
