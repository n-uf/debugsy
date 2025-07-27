/**
 * Deps State Management
 *
 * RESPONSIBILITY: State access and management for deps tracking
 * - Unified state access via debugsy system
 * - Fallback to debug settings when needed
 * - Clean interface for deps configuration
 */

import { type DepsSettings } from "../debugsy-space/debugsy-constants";
import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";

/**
 * Simplified deps state access using unified system
 * UNIFIED: Now delegates to the core debugsy system for all state management
 */
export const getDepsSettings = (): DepsSettings => {
  // Ensure unified system is available
  if (!globalThis.debugsySpace) {
    initializeDebugsySpace();
  }

  // Use unified system's deps status
  return globalThis.debugsySpace.getDepsSettings();
};
