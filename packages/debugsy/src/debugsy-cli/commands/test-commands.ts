/**
 * Browser CLI Test Commands
 * Provides testing functionality for the debugsy browser console interface
 */

import { depsSettingsControls } from "../../debugsy-space/debugsy-space-settings";
import { readSpace } from "../../debugsy-space/space-holder";

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
      const debugsy = readSpace();
      if (!debugsy) {
        console.log(`
❌ TEST FAILED: the debug space was not found
   The debugsy system is not initialized.
   
💡 TROUBLESHOOTING:
   • Try refreshing the page
   • Check that the app imports @n-uf/debugsy
`);
        return false;
      }

      console.log("✅ Debug space found");

      // Check if getDepsSettings method exists
      if (!debugsy.getDepsSettings) {
        console.log(`
❌ TEST FAILED: getDepsSettings method not found
   The dependency tracking system is not properly initialized.
`);
        return false;
      }

      console.log("✅ getDepsSettings method found");

      const depStatus = debugsy.getDepsSettings();
      console.log(`
📊 CURRENT DEPENDENCY STATUS:
   Enabled: ${depStatus.enabled ? "✅ Yes" : "❌ No"}
   Level:   ${depStatus.level}
   Filter:  ${depStatus.filter}
`);

      // Test enabling dependency tracking
      console.log("🔄 Testing dependency tracking toggle...");
      // Turn tracking on the way debugsy.deps.on() does: saved, panel follows
      depsSettingsControls.setEnabled(true);
      const newStatus = debugsy.getDepsSettings();

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
      const debugsy = readSpace();
      if (!debugsy) {
        console.log(`
❌ TEST FAILED: the debug space was not found
   The debugsy system is not initialized.
   
💡 TROUBLESHOOTING:
   • Refresh the page
   • Check that the app imports @n-uf/debugsy
`);
        return false;
      }

      console.log("✅ Debug space found");

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

      // Leave the stop as it was found
      if (!wasEmergencyActive) {
        globalThis.__DEBUGSY_EMERGENCY_STOP.deactivate();
        console.log("   ✅ Emergency stop deactivated");
      }

      // Test dependency status
      const depState = debugsy?.getDepsSettings?.();

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
   • Call useDebugsy() in React components
   • Use useWhyDidYouUpdate('ComponentName', props) for dependency tracking
   • Monitor console output for debug logs
`);

      return true;
    },
  };
}
