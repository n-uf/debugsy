/**
 * Change Tracking System
 *
 * RESPONSIBILITY: Frequency detection and initialization phase tracking
 * - Enhanced dependency change tracking with smart frequency detection
 * - App initialization phase management for better UX during startup
 * - Pattern analysis for detecting render loops and unstable dependencies
 */

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

  // Mark initialization as complete after 5 seconds of no new components
  markComponentSeen() {
    if (this.endTimeout) {
      clearTimeout(this.endTimeout);
    }
    this.endTimeout = setTimeout(() => {
      this.isActive = false;
      logToDebugSystem(
        "🏁 App initialization phase completed - switching to runtime severity"
      );
    }, 5000);
  },

  getPhase(): "initialization" | "runtime" {
    return this.isActive ? "initialization" : "runtime";
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
 */
export function trackDependencyChange(
  hookName: string,
  propName: string,
  changeType: "function" | "object" | "primitive"
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

    // Keep only last 5 intervals for pattern analysis
    if (existing.changeIntervals.length > 5) {
      existing.changeIntervals.shift();
    }

    // Progressive frequency detection based on phase and change type
    let frequencyThreshold: number;
    const phase = initializationPhase.getPhase();

    if (phase === "initialization") {
      // During initialization, be much more lenient
      frequencyThreshold = changeType === "function" ? 2000 : 5000;
    } else {
      // Runtime: stricter detection
      frequencyThreshold =
        changeType === "function"
          ? 1000
          : changeType === "object"
            ? 2000
            : 3000;
    }

    // Enhanced frequency detection
    if (existing.count >= 3) {
      // Pattern-based detection: if last 3 changes were all rapid
      const recentIntervals = existing.changeIntervals.slice(-3);
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
