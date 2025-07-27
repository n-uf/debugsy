/**
 * Debugsy Browser CLI Module
 *
 * This module provides a comprehensive command-line interface for the debugsy system
 * that runs in the browser console. It extracts all CLI-related functionality from
 * the core debug-space.ts into organized, modular command groups.
 *
 * Features:
 * - Status reporting commands
 * - Dependency tracking control
 * - Emergency stop/start functionality
 * - Testing utilities
 * - Built-in help system
 *
 * Usage:
 *   debugsy.help()           - Show all available commands
 *   debugsy.status()         - Quick status check
 *   debugsy.deps.verbose()   - Enable detailed dependency tracking
 */

// Main CLI interface
export {
  createDebugsyCLI,
  createFullDebugsyCLI,
  printCLIHelp,
  type DebugsyCLI,
  type DebugsyCLIWithHelp,
} from "./cli-interface";

// Individual command modules (for advanced usage)
export {
  createStatusCommands,
  type StatusCommands,
} from "./commands/status-commands";

export {
  createDepsCommands,
  type DepsCommands,
} from "./commands/deps-commands";

export {
  createEmergencyCommands,
  type EmergencyCommands,
} from "./commands/emergency-commands";

export {
  createTestCommands,
  type TestCommands,
} from "./commands/test-commands";

// Import for local usage
import { createFullDebugsyCLI } from "./cli-interface";

// Quick initialization helper
export function initializeDebugsyCLI(coreManager: any) {
  return createFullDebugsyCLI(coreManager);
}
