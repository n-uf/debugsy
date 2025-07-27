import { getGlobalDebugState } from "../../debugsy-shared/debug-settings";

/**
 * Browser CLI Status Commands
 * Provides status reporting functionality for the debugsy browser console interface
 */

export interface StatusCommands {
  (): void; // Default status method
  full: () => void; // Detailed status
  deps: () => void; // Dependency tracking status only
  emergency: () => void; // Emergency system status
}

/**
 * Creates the status command interface
 */
export function createStatusCommands(): StatusCommands {
  const defaultStatus = () => {
    const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};
    const emergencyActive =
      globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;

    console.log(`
🔍 Debugsy System Status

📊 OVERALL STATE:
  ${emergencyActive ? "🚨 EMERGENCY MODE ACTIVE" : "✅ Normal Operation"}
  
🎛️ DEPENDENCY TRACKING:
  Status: ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
  Level:  ${depState.level || "N/A"}
  Filter: ${depState.filter || "N/A"}

💡 For detailed status, use:
  debugsy.status.full()    - Complete system overview
  debugsy.status.deps()    - Dependency tracking details
  debugsy.status.emergency() - Emergency system status
`);
  };

  const fullStatus = () => {
    const globalState = getGlobalDebugState();
    const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};
    const emergencyActive =
      globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;

    console.log(`
🔍 Complete Debugsy System Status

📊 SYSTEM STATE:
  Emergency Mode: ${emergencyActive ? "🚨 ACTIVE" : "✅ Inactive"}
  Console Output: ${globalState.console ? "✅ Enabled" : "❌ Disabled"}
  Visual Panels:  ${globalState.visual ? "✅ Enabled" : "❌ Disabled"}
  Performance:    ${globalState.performance ? "✅ Enabled" : "❌ Disabled"}
  Total Logs:     ${globalState.logs.length} entries

🎯 ENABLED DEBUG POINTS:
  ${
    Array.from(globalState.enabled).length > 0
      ? Array.from(globalState.enabled)
          .map((p) => `✓ ${p}`)
          .join("\n  ")
      : "❌ No debug points enabled"
  }

🎛️ DEPENDENCY TRACKING:
  Status:        ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
  Level:         ${depState.level || "N/A"}
  Filter:        ${depState.filter || "all"}
  Allowed Hooks: ${depState.allowedHooks?.length ? depState.allowedHooks.join(", ") : "all"}
  Excluded Hooks: ${depState.excludedHooks?.length ? depState.excludedHooks.join(", ") : "none"}
  Throttle:      ${depState.throttleMs || 0}ms
`);
  };

  const depsStatus = () => {
    const depState = globalThis.debugsySpace?.getDependencyStatus?.();

    if (!depState) {
      console.log(`
🎛️ Dependency Tracking Status

❌ DEPENDENCY TRACKING UNAVAILABLE
  The dependency tracking system is not initialized.
  
💡 To enable: debugsy.deps.on()
`);
      return;
    }

    console.log(`
🎛️ Dependency Tracking Status

📊 CURRENT STATE:
  Status:        ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
  Level:         ${depState.level}
  Filter:        ${depState.filter}

🔧 CONFIGURATION:
  Allowed Hooks: ${
    depState.allowedHooks?.length
      ? depState.allowedHooks.join(", ")
      : "all hooks allowed"
  }
  Excluded Hooks: ${
    depState.excludedHooks?.length
      ? depState.excludedHooks.join(", ")
      : "no hooks excluded"
  }
  Throttle:      ${depState.throttleMs}ms

🎯 QUICK ACTIONS:
  debugsy.deps.on()        - Enable tracking
  debugsy.deps.verbose()   - Enable detailed logging
  debugsy.deps.quiet()     - Only critical changes
  debugsy.deps.initAware() - Smart initialization filtering
`);
  };

  const emergencyStatus = () => {
    const emergencyActive =
      globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;
    const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};

    console.log(`
🚨 Emergency System Status

📊 EMERGENCY STATE:
  Emergency Stop: ${emergencyActive ? "🚨 ACTIVE - All logging disabled" : "✅ Inactive"}
  System Health:  ${emergencyActive ? "⚠️ Limited functionality" : "✅ Full functionality"}

🎛️ DEPENDENCY TRACKING:
  Status: ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
  Level:  ${depState.level || "N/A"}

🔧 EMERGENCY CONTROLS:
  ${
    emergencyActive
      ? "debugsy.emergency.deactivate() - Restore normal operation"
      : "debugsy.emergency.activate()   - Emergency stop all logging"
  }
  debugsy.emergency.status()       - Check emergency status

${
  emergencyActive
    ? `
⚠️  EMERGENCY MODE EFFECTS:
  • All debug logging is disabled
  • Performance tracking stopped
  • Visual panels may not update
  • Use deactivate() to restore functionality
`
    : ""
}
`);
  };

  // Create callable function with methods attached
  return Object.assign(defaultStatus, {
    full: fullStatus,
    deps: depsStatus,
    emergency: emergencyStatus,
  });
}
