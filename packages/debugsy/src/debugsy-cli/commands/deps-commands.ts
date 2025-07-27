/**
 * Deps Commands - CLI Interface for Dependency Tracking
 *
 * Provides command-line control over dependency tracking features:
 * - Enable/disable tracking
 * - Set log levels (quiet, normal, verbose, debug)
 * - Configure filters (functions-only, objects-only, unstable-only)
 * - View current settings and status
 */

import { getGlobalDebugState } from "../../debugsy-space/debugsy-space-settings";

/**
 * Enable deps tracking with quiet level
 */
export function enableDepsQuiet(): string {
  try {
    const state = getGlobalDebugState();

    // Enable deps tracking
    state.enabled.add("dependencies");

    // Set quiet level
    state.deps.level = "quiet";

    return `✅ Deps tracking enabled (quiet level)
    
📊 Current Settings:
    Enabled: ✅ Yes
    Level:   quiet (errors and function changes only)
    Filter:  ${state.deps.filter}
    
💡 Use 'deps-normal' or 'deps-verbose' for more detailed tracking`;
  } catch (error) {
    return `❌ Failed to enable deps tracking: ${error}`;
  }
}

/**
 * Enable deps tracking with normal level
 */
export function enableDepsNormal(): string {
  try {
    const state = getGlobalDebugState();

    // Enable deps tracking
    state.enabled.add("dependencies");

    // Set normal level
    state.deps.level = "normal"; // Use valid DepsLogLevel

    return `✅ Deps tracking enabled (normal level)
    
📊 Current Settings:
    Enabled: ✅ Yes  
    Level:   normal (warns + errors, functions + unstable objects)
    Filter:  ${state.deps.filter}
    
💡 Use 'deps-verbose' for maximum detail or 'deps-quiet' for minimal output`;
  } catch (error) {
    return `❌ Failed to enable deps tracking: ${error}`;
  }
}

/**
 * Reset deps tracking to default normal level
 */
export function resetDepsTracking(): string {
  try {
    const state = getGlobalDebugState();

    // Enable and reset to normal
    state.enabled.add("dependencies");
    state.deps.level = "normal";

    return `🔄 Deps tracking reset to normal level
    
📊 Current Settings:
    Enabled: ✅ Yes
    Level:   normal (balanced output)
    Filter:  ${state.deps.filter}
    
💡 This is the recommended setting for most debugging scenarios`;
  } catch (error) {
    return `❌ Failed to reset deps tracking: ${error}`;
  }
}

/**
 * Enable deps tracking with verbose level
 */
export function enableDepsVerbose(): string {
  try {
    const state = getGlobalDebugState();

    // Enable deps tracking
    state.enabled.add("dependencies");

    // Set verbose level
    state.deps.level = "verbose";

    return `✅ Deps tracking enabled (verbose level)
    
📊 Current Settings:
    Enabled: ✅ Yes
    Level:   verbose (shows all dependency changes)
    Filter:  ${state.deps.filter}
    
⚠️  Verbose mode generates significant output - use for targeted debugging`;
  } catch (error) {
    return `❌ Failed to enable verbose deps tracking: ${error}`;
  }
}

/**
 * Enable deps tracking with debug level (maximum detail)
 */
export function enableDepsDebug(): string {
  try {
    const state = getGlobalDebugState();

    // Enable deps tracking
    state.enabled.add("dependencies");

    // Set debug level
    state.deps.level = "debug";

    return `🔬 Deps tracking enabled (debug level)
    
📊 Current Settings:
    Enabled: ✅ Yes
    Level:   debug (maximum detail + internal diagnostics)
    Filter:  ${state.deps.filter}
    
🚨 Debug mode generates extensive output - use only for deep analysis`;
  } catch (error) {
    return `❌ Failed to enable debug deps tracking: ${error}`;
  }
}

/**
 * Set deps filter to functions-only
 */
export function setDepsFunctionsOnly(): string {
  try {
    const state = getGlobalDebugState();

    // Update filter
    state.deps.filter = "functions-only";

    return `🎯 Deps filter set to functions-only
    
📊 Current Settings:
    Enabled: ${state.enabled.has("dependencies") ? "✅ Yes" : "❌ No"}
    Level:  ${state.deps.level}
    Filter: functions-only (shows only function reference changes)
    
💡 Ideal for debugging memoization issues and callback dependencies`;
  } catch (error) {
    return `❌ Failed to set functions-only filter: ${error}`;
  }
}

/**
 * Set deps filter to objects-only
 */
export function setDepsObjectsOnly(): string {
  try {
    const state = getGlobalDebugState();

    // Update filter
    state.deps.filter = "objects-only";

    return `📦 Deps filter set to objects-only
    
📊 Current Settings:
    Enabled: ${state.enabled.has("dependencies") ? "✅ Yes" : "❌ No"}
    Level:  ${state.deps.level}
    Filter: objects-only (shows only object reference changes)
    
💡 Useful for debugging props and complex state dependencies`;
  } catch (error) {
    return `❌ Failed to set objects-only filter: ${error}`;
  }
}

/**
 * Set deps filter to unstable-only (frequently changing items)
 */
export function setDepsUnstableOnly(): string {
  try {
    const state = getGlobalDebugState();

    // Update filter
    state.deps.filter = "unstable-only";

    return `⚡ Deps filter set to unstable-only
    
📊 Current Settings:
    Enabled: ${state.enabled.has("dependencies") ? "✅ Yes" : "❌ No"}
    Level:  ${state.deps.level}
    Filter: unstable-only (shows only frequently changing dependencies)
    
💡 Perfect for identifying render loop culprits and unstable references`;
  } catch (error) {
    return `❌ Failed to set unstable-only filter: ${error}`;
  }
}
