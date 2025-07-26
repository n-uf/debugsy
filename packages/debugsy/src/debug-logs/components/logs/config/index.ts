/**
 * Debug Logs Configuration - Index file
 *
 * Centralized exports for all debug logs configuration including:
 * - Copy progression settings
 * - Timing constants
 * - Default configurations
 * - Alternative configurations
 */

export * from "./copy-config";

// Re-export commonly used items for convenience
export {
  COPY_TIMING_CONFIG,
  DEFAULT_COPY_CONFIG,
  createCustomCopyConfig,
  getAutoResetAfterDelay,
  getButtonTransitionDuration,
  getDisplayDuration,
  getProgressBarDuration,
  validateCopyConfig,
} from "./copy-config";
