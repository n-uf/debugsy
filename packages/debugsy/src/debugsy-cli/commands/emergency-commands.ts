/**
 * Browser CLI Emergency Commands
 * Provides emergency stop/start functionality for the debugsy browser console interface
 */

export interface EmergencyCommands {
  activate: () => void;
  deactivate: () => void;
  status: () => void;
}

/**
 * Creates the emergency commands interface
 */
export function createEmergencyCommands(): EmergencyCommands {
  return {
    activate: () => {
      console.error(
        "🚨 EMERGENCY STOP ACTIVATED - All Debugsy logging disabled"
      );
      globalThis.__DEBUGSY_EMERGENCY_STOP.active = true;
    },

    deactivate: () => {
      console.log("✅ Emergency stop deactivated - Debug logging restored");
      globalThis.__DEBUGSY_EMERGENCY_STOP.active = false;
    },

    status: () => {
      const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};
      console.log("🔍 Debugsy Emergency Status:", {
        emergencyActive: globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false,
        dependencyTracking: depState.enabled,
        level: depState.level,
        filter: depState.filter,
      });
    },
  };
}
