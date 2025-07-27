/**
 * Dependency Filtering Logic
 *
 * RESPONSIBILITY: Determine what dependency changes should be logged
 * - Level-based filtering (silent, quiet, normal, verbose, debug)
 * - Type-based filtering (functions, objects, primitives)
 * - Hook-based filtering (allowed/excluded hooks)
 * - Emergency stop and initialization-aware logic
 */

import { getDepsSettings } from "./deps-settings";
import { initializationPhase } from "./logic/change-tracking";

/**
 * Enhanced shouldLogDependency function using unified state
 *
 * Determines whether a dependency change should be logged based on:
 * - Global enabled state
 * - Emergency stop status
 * - Hook allow/exclude lists
 * - Log level settings
 * - Change type and stability
 * - App initialization phase
 */
export function shouldLogDependency(
  hookName: string,
  changeType: "function" | "object" | "primitive",
  isStable: boolean
): boolean {
  // Emergency stop check
  if ((globalThis as any).__DEBUGSY_EMERGENCY_STOP?.active) {
    return false;
  }

  const dependencyState = getDepsSettings();

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

  // Level filtering - simplified for unified system
  switch (dependencyState.level) {
    case "silent":
      return false;
    case "quiet":
      // Only show functions and potential loop risks
      return changeType === "function" || !isStable;
    case "normal":
      // Show functions and objects, hide primitives unless unstable
      // Enhanced with initialization-aware logic for better UX
      const phase = initializationPhase.getPhase();
      if (changeType === "function") return true;
      if (changeType === "object") {
        // During init: only show if really frequent, during runtime: show if unstable
        return phase === "runtime" ? !isStable : false;
      }
      return !isStable; // Primitives only if unstable
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
