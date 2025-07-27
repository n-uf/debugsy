/**
 * Dependencies Tracking Type Definitions
 *
 * Contains all types and interfaces related to dependency tracking and monitoring.
 * Renamed from "dependency" to "deps" for consistency and brevity.
 */

// Deps tracking log levels
export type DepsLogLevel = "silent" | "quiet" | "normal" | "verbose" | "debug";

// Deps filtering options
export type DepsFilter =
  | "all"
  | "functions-only"
  | "objects-only"
  | "unstable-only"
  | "stable-only"
  | "loop-risks";

// Base deps configuration (shared fields)
export interface DepsConfig {
  level: DepsLogLevel;
  filter: DepsFilter;
  allowedHooks: string[] | null;
  excludedHooks: string[];
  throttleMs: number;
}

// Deps configuration for storage (no enabled field - derived from debug point system)
export interface DepsTrackingConfig extends DepsConfig {
  // enabled is derived from globalState.enabled.has("dependencies")
}

// Deps configuration with runtime state (includes enabled status)
export interface DepsSettings extends DepsConfig {
  enabled: boolean; // Derived from debug point system
}
