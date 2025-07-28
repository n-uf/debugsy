/**
 * Dependency Settings Access
 *
 * Provides access to dependency tracking configuration from the unified debugsy system.
 */

import { initializeDebugsySpace } from "../debugsy-space/debugsy-space";

/**
 * Get dependency tracking settings from unified debugsy system
 */
export function getDepsSettings() {
  // Auto-initialize if needed (should already be done via module import)
  if (!globalThis.debugsy) {
    initializeDebugsySpace();
  }

  return globalThis.debugsy.getDepsSettings();
}
