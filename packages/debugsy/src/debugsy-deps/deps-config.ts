/**
 * Dependency Tracking Configuration
 *
 * RESPONSIBILITY: Centralized configuration for all dependency tracking thresholds
 * - Frequency detection thresholds
 * - Timing and throttling settings
 * - UI notification configuration
 * - Pattern analysis parameters
 * - Storage and performance limits
 */

export interface DepsConfigThresholds {
  // === INITIALIZATION PHASE ===
  /** Time to wait before switching from initialization to runtime phase (ms) */
  initializationPhaseTimeout: number;

  // === FREQUENCY DETECTION (INITIALIZATION PHASE) ===
  /** Function change threshold during app initialization (ms) */
  initFrequencyFunction: number;
  /** Object change threshold during app initialization (ms) */
  initFrequencyObject: number;
  /** Primitive change threshold during app initialization (ms) */
  initFrequencyPrimitive: number;

  // === FREQUENCY DETECTION (RUNTIME PHASE) ===
  /** Function change threshold during runtime (ms) */
  runtimeFrequencyFunction: number;
  /** Object change threshold during runtime (ms) */
  runtimeFrequencyObject: number;
  /** Primitive change threshold during runtime (ms) */
  runtimeFrequencyPrimitive: number;

  // === PATTERN ANALYSIS ===
  /** Number of recent intervals to keep for pattern analysis */
  patternAnalysisWindow: number;
  /** Minimum change count before pattern-based frequency detection */
  patternAnalysisMinCount: number;

  // === RENDER RATE TRACKING ===
  /** Default render count threshold before warnings */
  renderRateDefaultThreshold: number;
  /** Multiplier for error vs warning severity (error = threshold * multiplier) */
  renderRateSeverityMultiplier: number;
  /** Cooldown between render rate notifications (ms) */
  renderRateNotificationCooldown: number;
  /** UI display duration for render rate alerts (ms) */
  renderRateDisplayDuration: number;

  // === MOUNT TRACKING ===
  /** Default mount count threshold before warnings */
  mountRateDefaultThreshold: number;
  /** Multiplier for error vs warning severity for mounts (error = threshold * multiplier) */
  mountRateSeverityMultiplier: number;
  /** Cooldown between mount rate notifications (ms) */
  mountRateNotificationCooldown: number;
  /** UI display duration for mount rate alerts (ms) */
  mountRateDisplayDuration: number;

  // === THROTTLING ===
  /** Default throttling for dependency logging (ms) */
  dependencyThrottleMs: number;
  /** Throttling for UI notifications (ms) */
  notificationThrottleMs: number;

  // === STORAGE & PERFORMANCE ===
  /** Maximum number of logs to store in memory */
  maxStoredLogs: number;
}

/**
 * Default configuration values for dependency tracking
 *
 * These values have been carefully tuned for:
 * - Good UX during app initialization
 * - Accurate detection of render loops
 * - Performance optimization
 * - Minimal false positives
 */
export const DEPS_CONFIG_DEFAULTS: DepsConfigThresholds = {
  // === INITIALIZATION PHASE ===
  initializationPhaseTimeout: 5000, // 5 seconds

  // === FREQUENCY DETECTION (INITIALIZATION PHASE) ===
  // More lenient during app startup
  initFrequencyFunction: 2000, // 2 seconds
  initFrequencyObject: 5000, // 5 seconds
  initFrequencyPrimitive: 5000, // 5 seconds

  // === FREQUENCY DETECTION (RUNTIME PHASE) ===
  // Stricter detection for production use
  runtimeFrequencyFunction: 1000, // 1 second
  runtimeFrequencyObject: 2000, // 2 seconds
  runtimeFrequencyPrimitive: 3000, // 3 seconds

  // === PATTERN ANALYSIS ===
  patternAnalysisWindow: 5, // Last 5 intervals
  patternAnalysisMinCount: 3, // Need 3+ changes for pattern detection

  // === RENDER RATE TRACKING ===
  renderRateDefaultThreshold: 3, // 10 renders before warning
  renderRateSeverityMultiplier: 3, // 30+ renders = error
  renderRateNotificationCooldown: 3000, // 3 seconds between notifications
  renderRateDisplayDuration: 8000, // Show alerts for 8 seconds

  // === MOUNT TRACKING ===
  mountRateDefaultThreshold: 3, // 3 mounts before warning
  mountRateSeverityMultiplier: 3, // 30+ mounts = error
  mountRateNotificationCooldown: 3000, // 3 seconds between notifications
  mountRateDisplayDuration: 8000, // Show alerts for 8 seconds

  // === THROTTLING ===
  dependencyThrottleMs: 100, // 100ms between dependency logs
  notificationThrottleMs: 16, // 16ms (~60fps) for UI updates

  // === STORAGE & PERFORMANCE ===
  maxStoredLogs: 10000, // 10K logs maximum
};

/**
 * Get frequency threshold for a specific change type and phase
 */
export function getFrequencyThreshold(
  changeType: "function" | "object" | "primitive",
  phase: "initialization" | "runtime",
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): number {
  if (phase === "initialization") {
    switch (changeType) {
      case "function":
        return config.initFrequencyFunction;
      case "object":
        return config.initFrequencyObject;
      case "primitive":
        return config.initFrequencyPrimitive;
    }
  } else {
    switch (changeType) {
      case "function":
        return config.runtimeFrequencyFunction;
      case "object":
        return config.runtimeFrequencyObject;
      case "primitive":
        return config.runtimeFrequencyPrimitive;
    }
  }
}

/**
 * Get render rate severity level based on threshold and multiplier
 */
export function getRenderRateSeverity(
  renderRate: number,
  threshold: number,
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): "warning" | "error" {
  return renderRate > threshold * config.renderRateSeverityMultiplier
    ? "error"
    : "warning";
}

/**
 * Determine severity level for mount rate notifications based on configuration
 */
export function getMountRateSeverity(
  mountRate: number,
  threshold: number,
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): "warning" | "error" {
  return mountRate > threshold * config.mountRateSeverityMultiplier
    ? "error"
    : "warning";
}

/**
 * Validate configuration values for safety
 */
export function validateDepsConfig(config: DepsConfigThresholds): void {
  const validations = [
    {
      value: config.initializationPhaseTimeout,
      min: 1000,
      name: "initializationPhaseTimeout",
    },
    {
      value: config.initFrequencyFunction,
      min: 100,
      name: "initFrequencyFunction",
    },
    {
      value: config.runtimeFrequencyFunction,
      min: 100,
      name: "runtimeFrequencyFunction",
    },
    {
      value: config.patternAnalysisWindow,
      min: 2,
      name: "patternAnalysisWindow",
    },
    {
      value: config.patternAnalysisMinCount,
      min: 2,
      name: "patternAnalysisMinCount",
    },
    {
      value: config.renderRateDefaultThreshold,
      min: 1,
      name: "renderRateDefaultThreshold",
    },
    {
      value: config.mountRateDefaultThreshold,
      min: 1,
      name: "mountRateDefaultThreshold",
    },
    {
      value: config.dependencyThrottleMs,
      min: 0,
      name: "dependencyThrottleMs",
    },
    { value: config.maxStoredLogs, min: 100, name: "maxStoredLogs" },
  ];

  for (const { value, min, name } of validations) {
    if (value < min) {
      throw new Error(
        `Invalid deps config: ${name} must be >= ${min}, got ${value}`
      );
    }
  }
}
