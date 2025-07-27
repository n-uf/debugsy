/**
 * Dependency Utilities
 *
 * RESPONSIBILITY: Utility functions for dependency change analysis and logging
 * - Change type detection (function, object, primitive)
 * - Change analysis and filtering
 * - Log message formatting with indicators
 * - Structured change logging with severity detection
 */

import {
  initializationPhase,
  trackDependencyChange,
  type ChangeTrackingInfo,
} from "./change-tracking";
import { shouldLogDependency } from "./dependency-filters";
import { logToDebugSystem, logWarnToDebugSystem } from "./dependency-logger";
import { getDepsSettings } from "./dependency-settings";

/**
 * Change information for a single prop
 */
export interface PropChange {
  key: string;
  change: { from: any; to: any };
  type: "function" | "object" | "primitive";
  isStable: boolean;
  trackingInfo: ChangeTrackingInfo;
}

/**
 * Determine the type of change based on from/to values
 */
export function detectChangeType(
  from: any,
  to: any
): "function" | "object" | "primitive" {
  const fromType = typeof from;
  const toType = typeof to;

  if (fromType === "function" || toType === "function") {
    return "function";
  } else if (fromType === "object" || toType === "object") {
    return "object";
  } else {
    return "primitive";
  }
}

/**
 * Analyze prop changes and determine which should be logged
 */
export function analyzeChanges(
  name: string,
  previousProps: Record<string, any>,
  currentProps: Record<string, any>
): PropChange[] {
  const allKeys = Object.keys({ ...previousProps, ...currentProps });
  const changesToLog: PropChange[] = [];

  allKeys.forEach((key) => {
    if (previousProps[key] !== currentProps[key]) {
      const from = previousProps[key];
      const to = currentProps[key];
      const changeType = detectChangeType(from, to);

      const trackingInfo = trackDependencyChange(name, key, changeType);
      const isStable = !trackingInfo.isFrequent;

      if (shouldLogDependency(name, changeType, isStable)) {
        changesToLog.push({
          key,
          change: { from, to },
          type: changeType,
          isStable,
          trackingInfo,
        });
      }
    }
  });

  return changesToLog;
}

/**
 * Generate severity and indicator information for a change
 */
export function getChangeIndicators(
  isStable: boolean,
  trackingInfo: ChangeTrackingInfo
): {
  shouldWarn: boolean;
  phaseIndicator: string;
  stabilityIndicator: string;
  counterIndicator: string;
} {
  const currentPhase = initializationPhase.getPhase();
  const shouldWarn = !isStable && currentPhase === "runtime";

  const phaseIndicator = currentPhase === "initialization" ? " 🚀" : "";
  const stabilityIndicator = shouldWarn
    ? " ⚠️ FREQUENT"
    : !isStable && currentPhase === "initialization"
      ? " 📋 INIT"
      : "";
  const counterIndicator = ` (#${trackingInfo.count})`;

  return {
    shouldWarn,
    phaseIndicator,
    stabilityIndicator,
    counterIndicator,
  };
}

/**
 * Log a single prop change with appropriate formatting and severity
 */
export function logPropChange(name: string, propChange: PropChange): void {
  const { key, change, type, isStable, trackingInfo } = propChange;
  const { from, to } = change;
  const fromType = typeof from;
  const toType = typeof to;

  const { shouldWarn, phaseIndicator, stabilityIndicator, counterIndicator } =
    getChangeIndicators(isStable, trackingInfo);

  const dependencyState = getDepsSettings();

  if (type === "function") {
    const message = `📝 [${name}] ${key}: function changed${counterIndicator} (function → function)${phaseIndicator}${stabilityIndicator}`;

    if (shouldWarn) {
      logWarnToDebugSystem(message, undefined, "function-recreation");
    } else {
      logToDebugSystem(message, undefined, "function-recreation");
    }
  } else if (type === "object") {
    const message = `📦 [${name}] ${key}: object changed${counterIndicator}${phaseIndicator}${stabilityIndicator}`;
    const logFn = shouldWarn ? logWarnToDebugSystem : logToDebugSystem;

    if (dependencyState.level === "debug") {
      logFn(message, { from, to }, "object-recreation");
    } else {
      logFn(message, undefined, "object-recreation");
    }
  } else {
    // Primitive changes (only in verbose/debug mode)
    if (
      dependencyState.level === "verbose" ||
      dependencyState.level === "debug"
    ) {
      logToDebugSystem(
        `🔧 [${name}] ${key}: ${fromType} → ${toType}${counterIndicator}${phaseIndicator}`,
        { from, to },
        "primitive-change"
      );
    }
  }
}

/**
 * Log all dependency changes with summary and detailed logs
 */
export function logDependencyChanges(
  name: string,
  changes: PropChange[]
): void {
  if (changes.length === 0) return;

  // Enhanced summary log with tracking information
  const enhancedData = Object.fromEntries(
    changes.map((c) => [
      c.key,
      {
        from: c.change.from,
        to: c.change.to,
        // Include tracking information for frequency-based coloring
        tracking: {
          count: c.trackingInfo.count,
          isFrequent: c.trackingInfo.isFrequent,
          isStable: c.isStable,
          changeType: c.type,
        },
      },
    ])
  );

  logToDebugSystem(
    `🔄 [${name}] Dependencies changed:`,
    enhancedData,
    "dependency-change"
  );

  // Detailed logs for each change
  changes.forEach((change) => {
    logPropChange(name, change);
  });
}
