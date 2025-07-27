import type { DebugLogEntry } from "../../../../debugsy-shared/debug-constants";
import {
  getLogTypeConfig,
  type DependencyLogType,
} from "../../../../debugsy-shared/debug-point-config";
import type { LogSeverity } from "../default-log-formatter";
import { COMPONENT_NAME_REGEX } from "./constants";

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
  type: DependencyLogType | "unknown";
  icon: string;
} => {
  // Use debug point configuration (primary approach)
  if (log.logType && log.point === "dependencies") {
    const config = getLogTypeConfig(log.point, log.logType);
    if (config) {
      return {
        type: log.logType as DependencyLogType,
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
 * Format dependency change data
 */
export const formatDependencyData = (data: any, logType: string) => {
  if (!data || logType !== "dependency-change" || typeof data !== "object") {
    return data;
  }

  return Object.entries(data)
    .map(([key, change]: [string, any]) => {
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
          type:
            typeof change.from === "function"
              ? "function"
              : typeof change.from === "object"
                ? "object"
                : "primitive",
        };
      }
      return null;
    })
    .filter(Boolean);
};
