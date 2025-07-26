/**
 * Debug Dependencies Module
 *
 * Provides React hook dependency tracking and performance monitoring tools
 * to debug circular re-rendering, ineffective memoization, and render loops.
 */

// Core dependency tracking hooks
export {
  useCircuitBreakerTracker,
  useEmergencySafeHook,
  useRenderTracker,
  useSafeHook,
  useWhyDidYouUpdate,
} from "./debug-deps";

// Circuit breaker controls
export { circuitBreakerControl, emergencyStop } from "./debug-deps";

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
