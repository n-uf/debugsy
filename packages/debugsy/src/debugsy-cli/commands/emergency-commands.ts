/**
 * Browser CLI Emergency Commands
 *
 * debugsy.emergency: while the stop is on, debugsy logs nothing (the core
 * log call drops every log). The stop lives on
 * globalThis.__DEBUGSY_EMERGENCY_STOP, which initializeDebugsySpace creates.
 */

export interface EmergencyCommands {
  /** Stop all logging */
  activate: () => void;
  /** Log again */
  deactivate: () => void;
  /** Print whether the stop is on */
  status: () => void;
}

/**
 * Creates the emergency commands interface
 */
export function createEmergencyCommands(): EmergencyCommands {
  return {
    activate: () => globalThis.__DEBUGSY_EMERGENCY_STOP.activate(),
    deactivate: () => globalThis.__DEBUGSY_EMERGENCY_STOP.deactivate(),
    status: () => globalThis.__DEBUGSY_EMERGENCY_STOP.status(),
  };
}
