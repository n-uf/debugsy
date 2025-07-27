/**
 * Dependency State Management
 *
 * RESPONSIBILITY: State access and management for dependency tracking
 * - Unified state access via debugsy system
 * - Fallback to debug settings when needed
 * - Clean interface for dependency configuration
 */

import type {
  DependencyFilter,
  DependencyLogLevel,
} from "../debugsy-shared/debug-constants";
import { getGlobalDebugState } from "../debugsy-shared/debug-settings";
import { initializeUnifiedDebugSystem } from "../debugsy-shared/debug-space";

export interface DependencyState {
  enabled: boolean;
  level: DependencyLogLevel;
  filter: DependencyFilter;
  allowedHooks: string[] | null;
  excludedHooks: string[];
  throttleMs: number;
}

/**
 * Simplified dependency state access using unified system
 * UNIFIED: Now delegates to the core debugsy system for all state management
 */
export const getDependencyState = (): DependencyState => {
  // Ensure unified system is available
  if (!globalThis.surfaceDebug) {
    initializeUnifiedDebugSystem();
  }

  // Use unified system's dependency status
  const unifiedStatus = globalThis.surfaceDebug.getDependencyStatus();
  if (unifiedStatus) {
    return unifiedStatus;
  }

  // Fallback to debug settings
  const debugState = getGlobalDebugState();
  return {
    enabled: debugState.enabled.has("dependencies"),
    level: debugState.dependencies.level,
    filter: debugState.dependencies.filter,
    allowedHooks: debugState.dependencies.allowedHooks,
    excludedHooks: debugState.dependencies.excludedHooks,
    throttleMs: debugState.dependencies.throttleMs,
  };
};
