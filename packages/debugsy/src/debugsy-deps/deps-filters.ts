/**
 * Deps Filters - Filtering Logic for Dependency Tracking
 *
 * RESPONSIBILITY: Determine what dependency changes should be logged
 * - Hook filtering (which hooks to track)
 * - Log level filtering (verbose vs minimal)
 * - Change type filtering (functions vs objects vs primitives)
 *
 * ARCHITECTURE:
 * - Pure functions for filtering logic
 * - Unified state access via getDepsSettings
 * - No React dependencies for testability
 */

import { getDepsSettings } from "./deps-settings";

/**
 * Check if a hook should be tracked based on current filter settings
 */
export function shouldTrackHook(hookName: string): boolean {
  const depsState = getDepsSettings();

  // Global disable check
  if (!depsState.enabled) {
    return false;
  }

  // Allowed hooks whitelist check
  if (depsState.allowedHooks) {
    if (!depsState.allowedHooks.includes(hookName)) {
      return false;
    }
  }

  // Excluded hooks blacklist check
  if (depsState.excludedHooks.includes(hookName)) {
    return false;
  }

  return true;
}

/**
 * Check if a specific log level should be logged
 */
export function shouldLogLevel(severity: "info" | "warn" | "error"): boolean {
  const depsState = getDepsSettings();

  switch (depsState.level) {
    case "silent":
      return false;
    case "quiet":
      return severity === "error";
    case "normal":
      return severity === "warn" || severity === "error";
    case "verbose":
      return true;
    case "debug":
      return true;
    default:
      return true;
  }
}

/**
 * Check if a specific change type should be logged based on filter settings
 */
export function shouldLogChangeType(
  changeType: "function" | "object" | "primitive" | "unstable"
): boolean {
  const depsState = getDepsSettings();

  switch (depsState.filter) {
    case "all":
      return true;
    case "functions-only":
      return changeType === "function";
    case "objects-only":
      return changeType === "object";
    case "unstable-only":
      return changeType === "unstable";
    case "stable-only":
      return changeType !== "unstable";
    case "loop-risks":
      return changeType === "function" || changeType === "unstable";
    default:
      return true;
  }
}
