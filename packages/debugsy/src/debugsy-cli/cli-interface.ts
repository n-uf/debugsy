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
 * What debugsy.help() prints. Every command named here exists on the
 * debug space (test/cli-commands.test.ts checks it), and the level
 * lines match the panel's advanced strip (dependency-advanced-panel.tsx).
 */
export const CLI_HELP = `
🔍 Debugsy console commands

📊 Status
  debugsy.status.status()                Debug points, console, dependency settings, stored logs
  debugsy.status.list()                  Debug points that are on
  debugsy.status.deps()                  Dependency tracking settings
  debugsy.status.logs(10)                The last 10 logs

🔧 Dependency tracking (every command but off() turns it on)
  debugsy.deps.on()                      Turn tracking on
  debugsy.deps.off()                     Turn tracking off
  debugsy.deps.quiet()                   Warnings only: functions and objects that keep changing after start-up (ends after 5 s with no change), render and remount warnings
  debugsy.deps.normal()                  Quiet, plus each render's changed dependencies and every recreated function and object
  debugsy.deps.verbose()                 Normal, plus each changed primitive value with its old and new value
  debugsy.deps.all()                     Every kind of change
  debugsy.deps.functionsOnly()           Recreated functions; ones that keep changing count as unstable, so Quiet logs none
  debugsy.deps.objectsOnly()             Recreated objects and arrays; ones that keep changing count as unstable, so Quiet logs none
  debugsy.deps.unstableOnly()            Dependencies that keep changing
  debugsy.deps.reset()                   Back to normal and all

🛑 Emergency
  debugsy.emergency.activate()           Log nothing until deactivate()
  debugsy.emergency.deactivate()         Log again
  debugsy.emergency.status()             Whether the stop is on

🧪 Self-checks
  debugsy.test.testDependencyTracking()  Turn dependency tracking on and print its settings
  debugsy.test.testMockComponent()       Try the emergency stop and print the dependency settings

📋 Core
  debugsy.log(point, message, data)      Log to a debug point
  debugsy.enable(point)                  Turn a debug point on
  debugsy.disable(point)                 Turn a debug point off
  debugsy.getLogs()                      Every stored log
  debugsy.clearLogs()                    Clear the stored logs
  debugsy.captureHealthSnapshot()        Log and return a health snapshot
  debugsy.help()                         This list
`;

/**
 * Creates the full CLI interface with help functionality
 */
export function createFullDebugsyCLI(coreManager: any): DebugsyCLIWithHelp {
  const baseCLI = createDebugsyCLI(coreManager);

  return {
    ...baseCLI,
    help: () => {
      console.log(CLI_HELP);
    },
  };
}
