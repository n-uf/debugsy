/**
 * Dependency State Management
 *
 * RESPONSIBILITY: State access and management for dependency tracking
 * - Unified state access via debugsy system
 * - Fallback to debug settings when needed
 * - Clean interface for dependency configuration
 */

import {
  type DependencyFilter as DepsFilter,
  type DependencyLogLevel as DepsLogLevel,
} from "../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";
import { getGlobalDebugState } from "../debugsy-space/debugsy-space-settings";

export interface DepsSettings {
  enabled: boolean;
  level: DepsLogLevel;
  filter: DepsFilter;
  allowedHooks: string[] | null;
  excludedHooks: string[];
  throttleMs: number;
}

/**
 * Simplified dependency state access using unified system
 * UNIFIED: Now delegates to the core debugsy system for all state management
 */
export const getDepsSettings = (): DepsSettings => {
  // Ensure unified system is available
  if (!globalThis.debugsySpace) {
    initializeDebugsySpace();
  }

  // Use unified system's dependency status
  const unifiedStatus = globalThis.debugsySpace.getDepsSettings();
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
