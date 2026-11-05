/**
 * Browser CLI Interface for Debugsy
 *
 * Provides a complete command-line style interface accessible via browser console.
 * Combines core debug functionality with CLI commands for maximum control.
 */

import {
  createDepsCommands,
  type DepsCommands,
} from "./commands/deps-commands";
import {
  createEmergencyCommands,
  type EmergencyCommands,
} from "./commands/emergency-commands";
import { statusCommands } from "./commands/status-commands";
import {
  createTestCommands,
  type TestCommands,
} from "./commands/test-commands";

/**
 * CLI interface that extends core debugsy functionality
 */
export interface DebugsyCLI {
  // === STATUS REPORTING ===
  status: typeof statusCommands;

  // === DEPENDENCY CONTROL ===
  deps: DepsCommands;

  // === EMERGENCY CONTROLS ===
  emergency: EmergencyCommands;

  // === TESTING UTILITIES ===
  test: TestCommands;

  // === HEALTH MONITORING ===
  captureHealthSnapshot: () => any;
}

/**
 * Enhanced interface that includes help and CLI functionality
 */
export interface DebugsyCLIWithHelp extends DebugsyCLI {
  help: () => void;
}

/**
 * Creates the complete CLI interface
 */
export function createDebugsyCLI(coreManager: any): DebugsyCLI {
  return {
    // Status commands
    status: statusCommands,

    // Dependency tracking level and filter
    deps: createDepsCommands(),

    // Emergency commands
    emergency: createEmergencyCommands(),

    // Test commands
    test: createTestCommands(),

    // Health monitoring
    captureHealthSnapshot: () => {
      return coreManager.captureHealthSnapshot?.() || {};
    },
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
 * Creates the full CLI interface with help functionality
 */
export function createFullDebugsyCLI(coreManager: any): DebugsyCLIWithHelp {
  const baseCLI = createDebugsyCLI(coreManager);

  return {
    ...baseCLI,
    help: () => {
      console.log(`
🔍 Debugsy CLI Help

📊 STATUS COMMANDS:
  debugsy.status.status()    - Show system status
  debugsy.status.list()      - List debug points
  debugsy.status.deps()      - Dependency tracking status
  debugsy.status.logs(10)    - Show recent logs

🔧 DEPENDENCY COMMANDS:
  debugsy.deps.reset()       - Reset dependency tracking

🚨 EMERGENCY COMMANDS:
  debugsy.emergency.activate()   - Emergency stop
  debugsy.emergency.deactivate() - Restore normal operation
  debugsy.emergency.status()     - Emergency system status

🧪 TEST COMMANDS:
  debugsy.test.testDependencyTracking() - Test dependency system
  debugsy.test.testMockComponent()      - Test mock component

📋 CORE METHODS:
  debugsy.log(point, message, data)     - Log message
  debugsy.enable(point)                 - Enable debug point
  debugsy.disable(point)                - Disable debug point
  debugsy.getLogs()                     - Get all logs
  debugsy.clearLogs()                   - Clear logs

💡 TIP: All commands are accessible via browser console
      `);
    },
  };
}
