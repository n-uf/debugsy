/**
 * Dependency Settings Access
 *
 * Provides access to dependency tracking configuration from the unified debugsy system.
 */

import { getDebugsy } from "../debugsy-space/debugsy-space";

/**
 * Get dependency tracking settings from unified debugsy system
 */
export function getDepsSettings() {
  return getDebugsy().getDepsSettings();
}
