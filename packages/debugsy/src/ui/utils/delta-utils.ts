/**
 * Delta Calculation Utilities
 * Ported from debugsy V1 for advanced dependency change tracking
 */

import { safeSuperjsonStringify } from "./safe-stringify";

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
  trackingInfo?: {
    count: number;
    isFrequent: boolean;
    isStable?: boolean;
  }
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
    if (trackingInfo.isFrequent && trackingInfo.isStable !== true) {
      return "high";
    }

    // Medium impact: Some frequency but not critical
    if (trackingInfo.count >= 3 && trackingInfo.isStable !== true) {
      return "medium";
    }

    // Low impact: Stable or low count changes
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
    const isReferenceChange = (() => {
      try {
        return (
          from !== to &&
          safeSuperjsonStringify(from) === safeSuperjsonStringify(to)
        );
      } catch {
        return false;
      }
    })();

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

  // Function delta
  if (fromType === "function" && toType === "function") {
    const fromString = from.toString();
    const toString = to.toString();
    const isSameCode = fromString === toString;

    return {
      type: "reference",
      delta: isSameCode ? "ref change" : "code change",
      impact,
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
 * Format delta for display
 */
export const formatDelta = (delta: DeltaInfo): string => {
  const impactIcon =
    delta.impact === "high" ? "🔴" : delta.impact === "medium" ? "🟡" : "🟢";
  return `${impactIcon} ${delta.delta}`;
};

/**
 * Get impact color for UI
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
