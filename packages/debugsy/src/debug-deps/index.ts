/**
 * Debug Dependencies Module
 *
 * Provides React hook dependency tracking and performance monitoring tools
 * to debug circular re-rendering, ineffective memoization, and render loops.
 */

// Core dependency tracking functionality
export { useRenderTracker, useWhyDidYouUpdate } from "./debug-deps";

// UI state management and controls
export { useDependencyState } from "./debug-deps-controls";

// Types (re-export for convenience)
export type {
  DebugLogEntry,
  DependencyFilter,
  DependencyLogLevel,
} from "../shared/debug-constants";

// Test utilities (for development/debugging)
// Note: Test utilities are available globally via surfaceDebug object

// Note: Types are defined internally and not exported
// See debug-deps.ts for CircuitBreakerConfig interface definition

/**
 * Quick Start Examples:
 *
 * // Basic dependency tracking
 * useWhyDidYouUpdate('MyComponent', props);
 *
 * // Track renders with warnings
 * useRenderTracker('MyComponent', props);
 *
 * // Safe hook with automatic circuit breaker
 * const { isDisabled } = useCircuitBreakerTracker('MyComponent', props);
 *
 * // Console commands
 * surfaceDebug.deps.verbose(); // Enable detailed tracking
 * surfaceDebug.deps.quiet();   // Only critical changes
 * surfaceDebug.deps.off();     // Disable tracking
 */
