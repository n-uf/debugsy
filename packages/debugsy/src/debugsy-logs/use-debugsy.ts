import { useMemo } from "react";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../shared/debug-display-state";
import {
  type DebugLogEntry,
  type DebugPoint,
} from "../debugsy-space/debugsy-constants";
import {
  type HealthMetrics,
  type HealthSnapshotConfig,
} from "./logic/health-snapshot";
import {
  type StableDebugsyInterface,
  getStableDebugsyInterface,
} from "./logic/stabilizator";

// Import the unified system for type declarations
import type { DebugsySpace } from "../debugsy-space/debugsy-space";

// Re-export types for backward compatibility
export type { DebugLogEntry, DebugPoint, StableDebugsyInterface };

/**
 * Global type declarations to properly type globalThis extensions
 */
declare global {
  var __SURFACE_DEBUG_MANAGER: DebugsySpace | undefined;
  var __DEBUGSY_EMERGENCY_STOP: {
    active: boolean;
    activate: () => void;
    deactivate: () => void;
    status: () => void;
  };
  var __debugsySanitizationLogged: boolean | undefined;
  // REMOVED: var surfaceDebug - now handled by unified system
}

/**
 * Centralized debugsy hook - returns stable global debugsy interface
 * CLEAN: Now returns a single global interface, eliminating redundant point parameter
 */
export const useDebugsy = (): StableDebugsyInterface => {
  // Use useMemo to ensure React optimization
  return useMemo(() => {
    return getStableDebugsyInterface();
  }, []);
};

// Re-export utilities
export {
  clearDebugDisplayContent,
  setDebugDisplayContent,
  type HealthMetrics,
  type HealthSnapshotConfig,
};
