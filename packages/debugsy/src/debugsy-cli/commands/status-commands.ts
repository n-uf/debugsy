import { getAllDebugPoints } from "../../debugsy-space/debugsy-constants";
import { getGlobalDebugState } from "../../debugsy-space/debugsy-space-settings";

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
    const globalState = getGlobalDebugState();
    const depState = globalThis.debugsySpace?.getDepsSettings?.() || {};
    const emergencyActive =
      globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;
    const allPoints = getAllDebugPoints();

    console.log(`
🔍 Complete Debugsy System Status

📊 SYSTEM STATE:
  Emergency Mode: ${emergencyActive ? "🚨 ACTIVE" : "✅ Inactive"}
  Console Output: ${globalState.console ? "✅ Enabled" : "❌ Disabled"}
  Visual Panels:  ${globalState.visual ? "✅ Enabled" : "❌ Disabled"}
  Performance:    ${globalState.performance ? "✅ Enabled" : "❌ Disabled"}
  Total Logs:     ${globalState.logs.length} entries

🎯 DEBUG POINTS:
  ${allPoints
    .map((point) => `${globalState.enabled.has(point) ? "✓" : "❌"} ${point}`)
    .join("\n  ")}

🎛️ DEPENDENCY TRACKING:
  Status:        ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
  Level:         ${depState.level || "N/A"}
  Filter:        ${depState.filter || "all"}
  Allowed Hooks: ${depState.allowedHooks?.length ? depState.allowedHooks.join(", ") : "all"}
  Excluded Hooks: ${depState.excludedHooks?.length ? depState.excludedHooks.join(", ") : "none"}
  Throttle:      ${depState.throttleMs || 0}ms

🚀 QUICK ACTIONS:
  debugsy.deps.initAware()    - Enable smart dependency tracking
  debugsy.deps.verbose()      - Enable detailed tracking  
  debugsy.emergency.status()  - Check emergency controls
  debugsy.help()              - Show all available commands

💡 SPECIALIZED STATUS VIEWS:
  debugsy.status.deps()       - Dependency tracking details only
  debugsy.status.emergency()  - Emergency system status only
`);
  };

  const fullStatus = () => {
    // Full status is now the same as default status
    defaultStatus();
  };

  const depsStatus = () => {
    const depState = globalThis.debugsySpace?.getDepsSettings?.();

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
    const depState = globalThis.debugsySpace?.getDepsSettings?.() || {};

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
