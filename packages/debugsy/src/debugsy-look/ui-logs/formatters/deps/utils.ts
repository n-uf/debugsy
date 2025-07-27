import type { DebugLogEntry } from "../../../../debugsy-space/debugsy-constants";

import {
  getLogTypeConfig,
  type LogType,
} from "../../../../debugsy-space/debugsy-point";
import type { LogSeverity } from "../default-log-formatter";
import { COMPONENT_NAME_REGEX } from "./constants";

/**
 * Enhanced delta information for dependency changes
 */
export interface DeltaInfo {
  type: "numeric" | "size" | "type" | "content" | "reference";
  delta: number | string;
  impact: "low" | "medium" | "high";
  description: string;
  fromValue?: any;
  toValue?: any;
  metrics?: {
    sizeChange?: number;
    complexityChange?: number;
    performanceImpact?: "minimal" | "moderate" | "significant";
  };
}

/**
 * Calculate enhanced delta information for a change with frequency-based impact
 */
export const calculateDelta = (
  from: any,
  to: any,
  propertyName: string,
  trackingInfo?: any
): DeltaInfo | null => {
  // Handle null/undefined cases
  if (from == null && to == null) return null;
  if (from == null) {
    return {
      type: "content",
      delta: "added",
      impact: "medium",
      description: `${propertyName} was added`,
      toValue: to,
    };
  }
  if (to == null) {
    return {
      type: "content",
      delta: "removed",
      impact: "medium",
      description: `${propertyName} was removed`,
      fromValue: from,
    };
  }

  const fromType = typeof from;
  const toType = typeof to;

  // Calculate frequency-based impact from tracking information
  const getFrequencyBasedImpact = (): "low" | "medium" | "high" => {
    if (!trackingInfo) return "low";

    // High impact: Frequent changes (⚠️ FREQUENT)
    if (trackingInfo.isFrequent && !trackingInfo.isStable) {
      return "high";
    }

    // Medium impact: Some frequency but not critical
    if (trackingInfo.count >= 3 && !trackingInfo.isStable) {
      return "medium";
    }

    // Low impact: Stable or low count changes (📋 INIT or normal)
    return "low";
  };

  const impact = getFrequencyBasedImpact();

  // Type change
  if (fromType !== toType) {
    return {
      type: "type",
      delta: `${fromType} → ${toType}`,
      impact,
      description: `Type changed from ${fromType} to ${toType}`,
      fromValue: from,
      toValue: to,
    };
  }

  // Numeric delta
  if (fromType === "number" && toType === "number") {
    const delta = to - from;
    const percentChange = from !== 0 ? Math.abs(delta / from) * 100 : 100;

    return {
      type: "numeric",
      delta: delta > 0 ? `+${delta}` : `${delta}`,
      impact,
      description: `${propertyName} changed by ${delta} (${percentChange.toFixed(1)}%)`,
      fromValue: from,
      toValue: to,
      metrics: {
        sizeChange: delta,
        performanceImpact:
          impact === "high"
            ? "significant"
            : impact === "medium"
              ? "moderate"
              : "minimal",
      },
    };
  }

  // String delta
  if (fromType === "string" && toType === "string") {
    const fromLength = from.length;
    const toLength = to.length;
    const lengthDelta = toLength - fromLength;

    return {
      type: "size",
      delta: lengthDelta > 0 ? `+${lengthDelta} chars` : `${lengthDelta} chars`,
      impact,
      description: `String length changed by ${lengthDelta} characters`,
      fromValue: from,
      toValue: to,
      metrics: {
        sizeChange: lengthDelta,
        performanceImpact: impact === "high" ? "moderate" : "minimal",
      },
    };
  }

  // Array delta
  if (Array.isArray(from) && Array.isArray(to)) {
    const fromLength = from.length;
    const toLength = to.length;
    const lengthDelta = toLength - fromLength;

    return {
      type: "size",
      delta: lengthDelta > 0 ? `+${lengthDelta} items` : `${lengthDelta} items`,
      impact,
      description: `Array size changed by ${lengthDelta} items`,
      fromValue: from,
      toValue: to,
      metrics: {
        sizeChange: lengthDelta,
        complexityChange: calculateComplexityChange(from, to),
        performanceImpact: impact === "high" ? "significant" : "minimal",
      },
    };
  }

  // Object delta
  if (fromType === "object" && toType === "object") {
    const fromKeys = Object.keys(from || {});
    const toKeys = Object.keys(to || {});
    const keyDelta = toKeys.length - fromKeys.length;

    // Check if it's a reference change (different objects with same structure)
    const isReferenceChange =
      from !== to && JSON.stringify(from) === JSON.stringify(to);

    if (isReferenceChange) {
      return {
        type: "reference",
        delta: "ref change",
        impact,
        description: `${propertyName} reference changed (same content)`,
        fromValue: from,
        toValue: to,
        metrics: {
          performanceImpact: impact === "high" ? "moderate" : "minimal",
        },
      };
    }

    return {
      type: "size",
      delta:
        keyDelta > 0
          ? `+${keyDelta} props`
          : keyDelta < 0
            ? `${keyDelta} props`
            : "modified",
      impact,
      description:
        keyDelta === 0
          ? `${propertyName} properties modified`
          : `${propertyName} ${keyDelta > 0 ? "gained" : "lost"} ${Math.abs(keyDelta)} properties`,
      fromValue: from,
      toValue: to,
      metrics: {
        sizeChange: keyDelta,
        complexityChange: calculateComplexityChange(from, to),
        performanceImpact: impact === "high" ? "moderate" : "minimal",
      },
    };
  }

  // Function delta (reverted to frequency-based impact)
  if (fromType === "function" && toType === "function") {
    const fromString = from.toString();
    const toString = to.toString();
    const isSameCode = fromString === toString;

    return {
      type: "reference",
      delta: isSameCode ? "ref change" : "code change",
      impact, // Now frequency-based, not always high
      description: isSameCode
        ? `${propertyName} function reference changed (same code)`
        : `${propertyName} function implementation changed`,
      fromValue: from,
      toValue: to,
      metrics: {
        performanceImpact: impact === "high" ? "moderate" : "minimal",
      },
    };
  }

  // Boolean/primitive delta
  return {
    type: "content",
    delta: `${from} → ${to}`,
    impact,
    description: `${propertyName} value changed`,
    fromValue: from,
    toValue: to,
    metrics: {
      performanceImpact: "minimal",
    },
  };
};

/**
 * Calculate complexity change between two values
 */
const calculateComplexityChange = (from: any, to: any): number => {
  const getComplexity = (value: any): number => {
    if (value == null) return 0;
    if (typeof value !== "object") return 1;
    if (Array.isArray(value)) return value.length;
    return Object.keys(value).length;
  };

  return getComplexity(to) - getComplexity(from);
};

/**
 * Format delta for display (simplified)
 */
export const formatDelta = (delta: DeltaInfo): string => {
  const impactIcon =
    delta.impact === "high" ? "🔴" : delta.impact === "medium" ? "🟡" : "🟢";
  return `${impactIcon} ${delta.delta}`;
};

/**
 * Get performance impact color for UI
 */
export const getImpactColor = (impact: "low" | "medium" | "high"): string => {
  switch (impact) {
    case "low":
      return "#22c55e"; // green
    case "medium":
      return "#f59e0b"; // yellow
    case "high":
      return "#ef4444"; // red
    default:
      return "#6b7280"; // gray
  }
};

/**
 * Enhanced trackable object display with modern formatting
 */
export const getEnhancedObjectDisplay = (
  value: any
): { display: string; type: string; badge?: string } => {
  if (value === null) return { display: "null", type: "null" };
  if (value === undefined) return { display: "undefined", type: "undefined" };

  if (typeof value === "object") {
    try {
      // Arrays with enhanced display
      if (Array.isArray(value)) {
        const badge = value.length > 10 ? "🔢" : value.length > 0 ? "📋" : "📄";
        return {
          display: `Array(${value.length})`,
          type: "array",
          badge,
        };
      }

      // Constructor-based objects with type badges
      const constructorName = value.constructor?.name;
      if (constructorName && constructorName !== "Object") {
        const badge =
          constructorName === "HTMLElement"
            ? "🌐"
            : constructorName.includes("Fiber")
              ? "⚛️"
              : constructorName === "Date"
                ? "📅"
                : constructorName === "Map"
                  ? "🗺️"
                  : constructorName === "Set"
                    ? "📦"
                    : "🏗️";
        return {
          display: `${constructorName}{}`,
          type: "constructor",
          badge,
        };
      }

      // Enhanced plain objects
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return { display: "{}", type: "object", badge: "📄" };
      } else if (keys.length <= 3) {
        return {
          display: `{${keys.join(", ")}}`,
          type: "object",
          badge: "📋",
        };
      } else {
        return {
          display: `{${keys.slice(0, 3).join(", ")}, +${keys.length - 3}}`,
          type: "object",
          badge: "📊",
        };
      }
    } catch (error) {
      return { display: "[Object]", type: "unknown", badge: "❓" };
    }
  }

  // Primitive values with type detection
  const type = typeof value;
  const badge =
    type === "string"
      ? "📝"
      : type === "number"
        ? "🔢"
        : type === "boolean"
          ? "✓"
          : "❓";

  return {
    display: String(value),
    type,
    badge,
  };
};

/**
 * Modern dependency log type parsing with configuration-driven approach
 */
export const getLogTypeMetadata = (
  log: DebugLogEntry
): {
  type: LogType | "unknown";
  icon: string;
} => {
  // Use debug point configuration (primary approach)
  if (log.logType && log.point === "dependencies") {
    const config = getLogTypeConfig(log.point, log.logType);
    if (config) {
      return {
        type: log.logType as LogType,
        icon: config.icon,
      };
    }
  }

  // Fallback for logs without logType (backwards compatibility)
  return { type: "unknown", icon: "❓" };
};

/**
 * Component name extraction utility
 */
export const extractComponentName = (message: string): string => {
  const match = message.match(COMPONENT_NAME_REGEX);
  return match?.[1] ?? "Unknown";
};

/**
 * Get dependency log severity
 */
export const getDependencySeverity = (log: DebugLogEntry): LogSeverity => {
  return log.level as LogSeverity;
};

/**
 * Format dependency change data with enhanced tracking information
 */
export const formatDependencyData = (data: any, logType: string) => {
  if (!data || logType !== "dependency-change" || typeof data !== "object") {
    return data;
  }

  return Object.entries(data)
    .map(([key, change]: [string, any]) => {
      // Handle both old format ({ from, to }) and new format ({ from, to, tracking })
      const hasTracking =
        change && typeof change === "object" && "tracking" in change;

      if (
        change &&
        typeof change === "object" &&
        "from" in change &&
        "to" in change
      ) {
        return {
          property: key,
          from: change.from,
          to: change.to,
          type: hasTracking
            ? change.tracking.changeType
            : typeof change.from === "function"
              ? "function"
              : typeof change.from === "object"
                ? "object"
                : "primitive",
          // Include tracking information for frequency-based coloring
          tracking: hasTracking ? change.tracking : undefined,
        };
      }
      return null;
    })
    .filter(Boolean);
};
