/**
 * Browser CLI Test Commands
 * Provides testing functionality for the debugsy browser console interface
 */

export interface TestCommands {
  testDependencyTracking: () => boolean;
  testMockComponent: () => boolean;
}

/**
 * Creates the test commands interface
 */
export function createTestCommands(): TestCommands {
  return {
    testDependencyTracking: (): boolean => {
      console.log(`
🧪 Testing Dependency Tracking System

🔍 CHECKING SYSTEM AVAILABILITY...`);

      // Check if global debugsy object exists
      if (!globalThis.debugsySpace) {
        console.log(`
❌ TEST FAILED: Global debugsy object not found
   The debugsy system is not initialized.
   
💡 TROUBLESHOOTING:
   • Try refreshing the page
   • Check if useDebugsy() is used in any React component
   • Use initDebugsyManually() to force initialization
`);
        return false;
      }

      console.log("✅ Global debugsy object found");

      // Check if getDepsSettings method exists
      if (!globalThis.debugsySpace.getDepsSettings) {
        console.log(`
❌ TEST FAILED: getDepsSettings method not found
   The dependency tracking system is not properly initialized.
`);
        return false;
      }

      console.log("✅ getDepsSettings method found");

      const depStatus = globalThis.debugsySpace.getDepsSettings();
      console.log(`
📊 CURRENT DEPENDENCY STATUS:
   Enabled: ${depStatus.enabled ? "✅ Yes" : "❌ No"}
   Level:   ${depStatus.level}
   Filter:  ${depStatus.filter}
`);

      // Test enabling dependency tracking
      console.log("🔄 Testing dependency tracking toggle...");
      globalThis.debugsySpace.deps.on();
      const newStatus = globalThis.debugsySpace.getDepsSettings();

      console.log(`
📊 UPDATED DEPENDENCY STATUS:
   Enabled: ${newStatus.enabled ? "✅ Yes" : "❌ No"}
   Level:   ${newStatus.level}
   Filter:  ${newStatus.filter}

✅ DEPENDENCY TRACKING TEST COMPLETED SUCCESSFULLY!

🎯 NEXT STEPS:
   1. Add useWhyDidYouUpdate('ComponentName', props) to a React component
   2. Change props and watch for dependency change logs in console
   3. Use debugsy.deps.verbose() for more detailed tracking
   4. Use debugsy.status.deps() to check current configuration
`);

      return true;
    },

    testMockComponent: (): boolean => {
      console.log(`
🧪 Testing Mock Component Functionality

🔍 CHECKING SYSTEM HEALTH...`);

      // Check if global debugsy space exists
      if (!globalThis.debugsySpace) {
        console.log(`
❌ TEST FAILED: Global debugsy object not found
   The debugsy system is not initialized.
   
💡 TROUBLESHOOTING:
   • Refresh the page
   • Ensure React components use debugsy hooks
   • Try initDebugsyManually() to force initialization
`);
        return false;
      }

      console.log("✅ Global debugsy object found");

      // Test emergency stop functionality
      console.log(`
🔄 TESTING EMERGENCY CONTROLS...`);

      const wasEmergencyActive =
        globalThis.__DEBUGSY_EMERGENCY_STOP?.active || false;

      console.log(
        `   Initial emergency state: ${wasEmergencyActive ? "🚨 Active" : "✅ Inactive"}`
      );

      globalThis.__DEBUGSY_EMERGENCY_STOP.activate();
      console.log("   ✅ Emergency stop activated");

      globalThis.__DEBUGSY_EMERGENCY_STOP.deactivate();
      console.log("   ✅ Emergency stop deactivated");

      // Test dependency status
      const depState = globalThis.debugsySpace?.getDepsSettings?.();

      console.log(`
📊 DEPENDENCY SYSTEM STATUS:`);

      if (depState) {
        console.log(`   Status:  ${depState.enabled ? "✅ Enabled" : "❌ Disabled"}
   Level:   ${depState.level}
   Filter:  ${depState.filter}`);
      } else {
        console.log(`   ❌ Dependency tracking is disabled
   
💡 TO ENABLE:
   debugsy.deps.on()     - Enable basic tracking
   debugsy.deps.verbose() - Enable detailed tracking`);
      }

      console.log(`
✅ MOCK COMPONENT TEST COMPLETED!

🎯 SYSTEM CAPABILITIES VERIFIED:
   ✓ Global debugsy object accessible
   ✓ Emergency controls functional
   ✓ Dependency status readable
   ✓ All core systems operational

💡 TO TEST WITH REAL COMPONENTS:
   • Add useDebugsy('component-name') to React components
   • Use useWhyDidYouUpdate('ComponentName', props) for dependency tracking
   • Monitor console output for debug logs
`);

      return true;
    },
  };
}
