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
      console.log(`
🚨 Emergency Control System

⚠️  EMERGENCY STOP ACTIVATED
   All Debugsy logging has been immediately disabled.
   
📊 SYSTEM STATUS:
   • Debug logging: ❌ Stopped
   • Performance tracking: ❌ Stopped  
   • Visual panels: ⚠️ May not update
   • Console output: ❌ Suppressed
   
🎯 EMERGENCY MODE EFFECTS:
   • Prevents potential infinite loops
   • Stops all debug overhead
   • Preserves system performance
   • Allows for safe debugging
   
🔧 TO RESTORE NORMAL OPERATION:
   debugsy.emergency.deactivate() - Restore all functionality
   debugsy.emergency.status()     - Check current status
`);
      globalThis.__DEBUGSY_EMERGENCY_STOP.active = true;
    },

    deactivate: () => {
      console.log(`
🚨 Emergency Control System

✅ EMERGENCY STOP DEACTIVATED
   Debug logging has been restored to normal operation.
   
📊 SYSTEM STATUS:
   • Debug logging: ✅ Restored
   • Performance tracking: ✅ Restored
   • Visual panels: ✅ Active
   • Console output: ✅ Enabled
   
🎯 NORMAL OPERATION RESUMED:
   • All debug functionality available
   • Performance tracking active
   • Visual panels updating
   • Console output restored
   
💡 NEXT STEPS:
   debugsy.status()           - Check overall system status
   debugsy.deps.initAware()   - Enable smart dependency tracking
   debugsy.help()             - See all available commands
`);
      globalThis.__DEBUGSY_EMERGENCY_STOP.active = false;
    },

    status: () => {
      const depState = globalThis.debugsySpace?.getDependencyStatus?.() || {};
      const emergencyActive =
        globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;

      console.log(`
🚨 Emergency System Status Report

📊 EMERGENCY STATE:
   Emergency Stop: ${emergencyActive ? "🚨 ACTIVE - All logging disabled" : "✅ Inactive - Normal operation"}
   System Health:  ${emergencyActive ? "⚠️ Limited functionality" : "✅ Full functionality available"}

🎛️ CORE SYSTEMS:
   Debug Logging:     ${emergencyActive ? "❌ Disabled" : "✅ Available"}
   Dependency Track:  ${depState.enabled ? "✅ Enabled" : "❌ Disabled"} (${depState.level || "N/A"})
   Performance:       ${emergencyActive ? "❌ Stopped" : "✅ Active"}
   Visual Panels:     ${emergencyActive ? "⚠️ Limited" : "✅ Updating"}

🔧 AVAILABLE CONTROLS:
   ${
     emergencyActive
       ? "debugsy.emergency.deactivate() - Restore normal operation"
       : "debugsy.emergency.activate()   - Emergency stop all logging"
   }
   debugsy.emergency.status()       - Check emergency status
   debugsy.status()                 - Full system status
   debugsy.help()                   - Show all commands

${
  emergencyActive
    ? `
⚠️  EMERGENCY MODE ACTIVE:
   • All debug logging is disabled
   • Performance tracking stopped  
   • Visual panels may not update
   • Use deactivate() to restore functionality
   
💡 Emergency mode is designed to:
   • Stop infinite render loops
   • Reduce system overhead
   • Allow safe debugging environment
`
    : `
✅ NORMAL OPERATION:
   • All systems functional
   • Full debug capability available
   • Performance tracking active
   • Ready for development workflow
`
}
`);
    },
  };
}
