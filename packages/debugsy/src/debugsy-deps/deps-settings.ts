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
  return globalThis.debugsySpace.getDepsSettings();
};
