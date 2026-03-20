/**
 * Debug Module Configuration Types
 *
 * Foundational types for the module-based debug point system.
 * Debugsy owns the type definitions; consuming packages
 * conform to them when declaring their own modules.
 */

// =============================================================================
// Point-level types
// =============================================================================

/** Metadata for a sub-type within a debug point */
export interface LogTypeConfig {
  icon: string;
  description?: string;
}

/** Single debug point definition within a module */
export interface DebugPointDef {
  emoji: string;
  label: string;
  description: string;
  logTypes?: Record<string, LogTypeConfig>;
}

// =============================================================================
// Module-level types
// =============================================================================

/** A module groups related debug points under one collapsible UI entry */
export interface DebugModuleDef {
  label: string;
  emoji: string;
  description: string;
  points: Record<string, DebugPointDef>;
}

// =============================================================================
// Module LED state (derived, not stored)
// =============================================================================

export type ModuleLedState = "all-on" | "partial" | "all-off";
