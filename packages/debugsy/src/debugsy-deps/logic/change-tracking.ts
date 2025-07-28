/**
 * Change Tracking System
 *
 * RESPONSIBILITY: Frequency detection and initialization phase tracking
 * - Enhanced dependency change tracking with smart frequency detection
 * - App initialization phase management for better UX during startup
 * - Pattern analysis for detecting render loops and unstable dependencies
 */

import {
  DEPS_CONFIG_DEFAULTS,
  getFrequencyThreshold,
  type DepsConfigThresholds,
} from "../deps-config";
import { logToDebugSystem } from "../deps-logger";

export interface ChangeTrackingInfo {
  count: number;
  lastChange: number;
  isFrequent: boolean;
  firstSeen: number;
  changeIntervals: number[]; // Track timing patterns
}

// Enhanced dependency change tracking with smarter frequency detection
const dependencyChangeTracking = new Map<string, ChangeTrackingInfo>();

// Track app initialization phase
export const initializationPhase = {
  startTime: Date.now(),
  isActive: true,
  endTimeout: null as NodeJS.Timeout | null,
  config: DEPS_CONFIG_DEFAULTS,

  // Mark initialization as complete after configured timeout
  markComponentSeen() {
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
    }
    this.endTimeout = setTimeout(() => {
      this.isActive = false;
      logToDebugSystem(
        "🏁 App initialization phase completed - switching to runtime severity"
      );
    }, this.config.initializationPhaseTimeout);
  },

  getPhase(): "initialization" | "runtime" {
    return this.isActive ? "initialization" : "runtime";
  },

  // Allow configuration updates
  updateConfig(newConfig: DepsConfigThresholds) {
    this.config = newConfig;
  },
};

/**
 * Track dependency changes with intelligent frequency detection
 *
 * Features:
 * - Progressive frequency thresholds based on app phase
 * - Pattern analysis using recent change intervals
 * - Different thresholds for functions vs objects vs primitives
 * - Automatic initialization phase detection
 * - Configurable thresholds via deps-config
 */
export function trackDependencyChange(
  hookName: string,
  propName: string,
  changeType: "function" | "object" | "primitive",
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): ChangeTrackingInfo {
  const key = `${hookName}.${propName}`;
  const now = Date.now();
  const existing = dependencyChangeTracking.get(key);

  // Mark that we've seen a component (for initialization phase tracking)
  initializationPhase.markComponentSeen();

  if (existing) {
    existing.count++;
    const timeSinceLastChange = now - existing.lastChange;
    existing.changeIntervals.push(timeSinceLastChange);

    // Keep only configured number of intervals for pattern analysis
    if (existing.changeIntervals.length > config.patternAnalysisWindow) {
      existing.changeIntervals.shift();
    }

    // Get frequency threshold from centralized config
    const phase = initializationPhase.getPhase();
    const frequencyThreshold = getFrequencyThreshold(changeType, phase, config);

    // Enhanced frequency detection
    if (existing.count >= config.patternAnalysisMinCount) {
      // Pattern-based detection: if last N changes were all rapid
      const recentIntervals = existing.changeIntervals.slice(
        -config.patternAnalysisMinCount
      );
      const allRecentFast = recentIntervals.every(
        (interval) => interval < frequencyThreshold
      );
      const averageInterval =
        recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;

      // More sophisticated frequency detection
      existing.isFrequent =
        allRecentFast && averageInterval < frequencyThreshold;
    } else {
      // For first few changes, use simple threshold
      existing.isFrequent = timeSinceLastChange < frequencyThreshold;
    }

    existing.lastChange = now;
  } else {
    dependencyChangeTracking.set(key, {
      count: 1,
      lastChange: now,
      isFrequent: false,
      firstSeen: now,
      changeIntervals: [],
    });
  }

  return dependencyChangeTracking.get(key)!;
}
