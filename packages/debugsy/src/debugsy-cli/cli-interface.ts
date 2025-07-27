import {
  createDepsCommands,
  type DepsCommands,
} from "./commands/deps-commands";
import {
  createEmergencyCommands,
  type EmergencyCommands,
} from "./commands/emergency-commands";
import {
  createStatusCommands,
  type StatusCommands,
} from "./commands/status-commands";
import { createTestCommands } from "./commands/test-commands";

/**
 * Browser CLI Interface for Debugsy
 *
 * This provides a comprehensive command-line interface accessible through the browser console.
 * All commands are designed to be typed directly into the browser's developer console.
 *
 * Usage Examples:
 *   debugsy.status()                 - Show overall system status
 *   debugsy.deps.verbose()           - Enable verbose dependency tracking
 *   debugsy.emergency.activate()     - Emergency stop all logging
 *   debugsy.testDependencyTracking() - Test dependency tracking functionality
 */

export interface DebugsyCLI {
  // === STATUS REPORTING ===
  status: StatusCommands;

  // === DEPENDENCY CONTROL ===
  deps: DepsCommands;

  // === EMERGENCY CONTROLS ===
  emergency: EmergencyCommands;

  // === TESTING UTILITIES ===
  testDependencyTracking: () => boolean;
  testMockComponent: () => boolean;

  // === HEALTH MONITORING ===
  captureHealthSnapshot: () => any;
}

/**
 * Creates the complete CLI interface
 */
export function createDebugsyCLI(coreManager: any): DebugsyCLI {
  const statusCommands = createStatusCommands();
  const depsCommands = createDepsCommands();
  const emergencyCommands = createEmergencyCommands();
  const testCommands = createTestCommands();

  return {
    // Status commands
    status: statusCommands,

    // Dependency commands
    deps: depsCommands,

    // Emergency commands
    emergency: emergencyCommands,

    // Test commands (flattened to top level for convenience)
    testDependencyTracking: testCommands.testDependencyTracking,
    testMockComponent: testCommands.testMockComponent,

    // Health monitoring (delegated to core manager)
    captureHealthSnapshot: coreManager.captureHealthSnapshot,
  };
}

/**
 * CLI Command Help System
 */
export function printCLIHelp(): void {
  console.log(`
🚀 Debugsy Browser CLI - Available Commands

📊 STATUS COMMANDS:
  debugsy.status()                 - Show overall system status
  debugsy.status.full()            - Detailed status with all settings
  debugsy.status.deps()            - Dependency tracking status only
  debugsy.status.emergency()       - Emergency system status

🎛️ DEPENDENCY CONTROL:
  debugsy.deps.off()              - Disable dependency logs
  debugsy.deps.on()               - Enable dependency logs
  debugsy.deps.quiet()            - Only critical changes
  debugsy.deps.initAware()        - 🌟 RECOMMENDED: Smart init filtering
  debugsy.deps.normal()           - Standard dependency tracking
  debugsy.deps.verbose()          - Detailed dependency tracking
  debugsy.deps.debug()            - Maximum detail for debugging
  debugsy.deps.functionsOnly()    - Only function changes
  debugsy.deps.objectsOnly()      - Only object changes
  debugsy.deps.unstableOnly()     - Only changing dependencies

🚨 EMERGENCY CONTROLS:
  debugsy.emergency.activate()    - Stop ALL logging immediately
  debugsy.emergency.deactivate()  - Restore normal operation
  debugsy.emergency.status()      - Check emergency status

🧪 TESTING UTILITIES:
  debugsy.testDependencyTracking() - Verify functionality
  debugsy.testMockComponent()      - Test mock scenarios

💊 HEALTH MONITORING:
  debugsy.captureHealthSnapshot()  - Capture current system health

🆘 HELP:
  debugsy.help()                   - Show this help message

🎯 Quick Start:
  1. debugsy.status()              - Check current status
  2. debugsy.deps.initAware()      - Enable smart dependency tracking
  3. Watch console for dependency change logs as you interact with the app
  4. Use debugsy.deps.verbose() for more detail if needed
`);
}

/**
 * Extended CLI interface that includes help
 */
export interface DebugsyCLIWithHelp extends DebugsyCLI {
  help: () => void;
}

/**
 * Creates the complete CLI interface with help system
 */
export function createFullDebugsyCLI(coreManager: any): DebugsyCLIWithHelp {
  const baseCLI = createDebugsyCLI(coreManager);

  return {
    ...baseCLI,
    help: printCLIHelp,
  };
}
