/**
 * Copy Configuration - Centralized settings for copy progression behavior
 *
 * This file contains all configuration related to the copy logs functionality:
 * - Progression steps and timing
 * - Reset behavior flags
 * - Animation and delay constants
 * - Default configurations
 */

import type {
  CopyProgressionConfig,
  CopyStepValue,
} from "../utils/copy-utilities";
import { COPY_THEMES, createAdaptiveConfig } from "../utils/copy-utilities";

/**
 * Timing constants for copy progress animations and behavior
 * These ensure visual consistency across all copy-related interactions
 */
export const COPY_TIMING_CONFIG = {
  // Animation durations (milliseconds)
  PROGRESS_BAR_DURATION: 300, // Progress bar fill animation
  BUTTON_TRANSITION: 200, // Button hover/click feedback

  // Display and reset timing (milliseconds)
  DISPLAY_DURATION: 1700, // How long progress state is visible (3 seconds)

  // Behavior flags
  RESET_ON_COMPLETE: false, // Don't cycle back to beginning when progression is complete
  AUTO_RESET_AFTER_DELAY: true, // Auto-reset after display duration
} as const;

/**
 * Copy configuration with optimal defaults
 * Combines progression steps, behavior flags, and timing
 */
export const DEFAULT_COPY_CONFIG: CopyProgressionConfig = createAdaptiveConfig(
  [20, 200, "50%", "All"], // Progression: 20 → 200 → 50% → All logs
  {
    theme: COPY_THEMES.default,
    resetOnComplete: COPY_TIMING_CONFIG.RESET_ON_COMPLETE,
    autoResetAfterDelay: COPY_TIMING_CONFIG.AUTO_RESET_AFTER_DELAY,
    animationDuration: COPY_TIMING_CONFIG.PROGRESS_BAR_DURATION,
  }
);

// Alternative configurations removed - use createCustomCopyConfig() for custom needs

/**
 * Configuration validation
 */
export const validateCopyConfig = (
  config: Partial<CopyProgressionConfig>
): boolean => {
  return !!(config.steps && config.steps.length > 0);
};

/**
 * Create custom copy configuration (for special use cases)
 */
export const createCustomCopyConfig = (
  steps: CopyStepValue[],
  options?: {
    resetOnComplete?: boolean;
    autoResetAfterDelay?: boolean;
    animationDuration?: number;
  }
): CopyProgressionConfig => {
  return createAdaptiveConfig(steps, {
    theme: COPY_THEMES.default,
    resetOnComplete:
      options?.resetOnComplete ?? COPY_TIMING_CONFIG.RESET_ON_COMPLETE,
    autoResetAfterDelay:
      options?.autoResetAfterDelay ?? COPY_TIMING_CONFIG.AUTO_RESET_AFTER_DELAY,
    animationDuration:
      options?.animationDuration ?? COPY_TIMING_CONFIG.PROGRESS_BAR_DURATION,
  });
};

/**
 * Timing accessors for UI components
 */
export const getDisplayDuration = () => COPY_TIMING_CONFIG.DISPLAY_DURATION;
export const getAutoResetAfterDelay = () =>
  COPY_TIMING_CONFIG.AUTO_RESET_AFTER_DELAY;
export const getProgressBarDuration = () =>
  COPY_TIMING_CONFIG.PROGRESS_BAR_DURATION;
export const getButtonTransitionDuration = () =>
  COPY_TIMING_CONFIG.BUTTON_TRANSITION;
