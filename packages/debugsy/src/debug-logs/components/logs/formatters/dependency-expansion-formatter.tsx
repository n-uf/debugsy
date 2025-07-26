"use client";

import React, { useMemo } from "react";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { JsonUtils, safeJsonStringify } from "../utils/json/json-utilities";
import { type LogSeverity } from "./default-log-formatter";
import { formatTime, formatValue } from "./health-expansion-formatter";

/**
 * Dependency log types based on the integrated debug-deps.ts system
 */
type DependencyLogType =
  | "dependency-change" // 🔄 Dependencies changed
  | "function-recreation" // 📝 function changed
  | "object-recreation" // 📦 object changed
  | "primitive-change" // 🔧 primitive changes
  | "render-warning" // ⚠️ High render count
  | "circuit-breaker" // 🚨 Circuit breaker events
  | "emergency-stop" // 🚨 Emergency stop events
  | "hook-execution" // 🛑 Hook execution events
  | "unknown";

/**
 * OPTIMIZED: Parse dependency log type with memoization-friendly logic
 */
const parseDependencyLogType = (message: string): DependencyLogType => {
  // Use includes for faster string matching
  if (message.includes("Dependencies changed:")) return "dependency-change";
  if (message.includes("function changed")) return "function-recreation";
  if (message.includes("object changed")) return "object-recreation";
  if (message.includes("High render count detected")) return "render-warning";
  if (message.includes("CIRCUIT BREAKER")) return "circuit-breaker";
  if (message.includes("EMERGENCY STOP")) return "emergency-stop";
  if (message.includes("Hook execution")) return "hook-execution";
  if (message.includes("→")) return "primitive-change";
  return "unknown";
};

/**
 * OPTIMIZED: Extract component name with cached regex
 */
const COMPONENT_NAME_REGEX = /\[([^\]]+)\]/;
const extractComponentName = (message: string): string => {
  const match = message.match(COMPONENT_NAME_REGEX);
  return match?.[1] ?? "Unknown";
};

/**
 * Get dependency log severity directly from log record
 * The severity is already determined by debug-deps.ts when creating the log
 */
const getDependencySeverity = (log: DebugLogEntry): LogSeverity => {
  // Use the log's level as the severity - it's already been determined
  // by the smart logic in debug-deps.ts
  return log.level as LogSeverity;
};

/**
 * OPTIMIZED: Format dependency change data with memoization
 */
const formatDependencyData = (data: any, type: DependencyLogType) => {
  if (!data || type !== "dependency-change" || typeof data !== "object") {
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

/**
 * OPTIMIZED: Dependency expansion content with memoized computations
 * This component provides the expansion content for dependency logs
 */
export const DependencyExpansionContent: React.FC<{
  log: DebugLogEntry;
  maxHeight?: number;
}> = React.memo(({ log, maxHeight = 400 }) => {
  // Memoize parsed log data to prevent recomputation
  const dependencyMeta = useMemo(() => {
    const logType = parseDependencyLogType(log.message);
    const componentName = extractComponentName(log.message);
    const severity = getDependencySeverity(log);
    const dependencyData = formatDependencyData(log.data, logType);

    return {
      logType,
      componentName,
      severity,
      dependencyData,
    };
  }, [log.message, log.data, log.level]);

  const displayStrategy = useMemo(() => {
    if (!log.data) return { isComplex: false, shouldShow: false };

    const isComplex = JsonUtils.isComplex(log.data);

    return {
      isComplex,
      shouldShow: true,
      content: log.data,
    };
  }, [log.data]);

  return (
    <div style={{ fontFamily: "monospace" }}>
      {/* Component Info */}
      <div
        style={{
          marginBottom: "8px",
          padding: "4px 6px",
          backgroundColor: "#1e3a8a11",
          borderRadius: "3px",
          border: "1px solid #1e3a8a22",
        }}
      >
        <div style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}>
          🧩 Component: {dependencyMeta.componentName}
        </div>
        <div style={{ color: "#93c5fd", fontSize: "8px", marginTop: "2px" }}>
          Logged at {formatTime(log.timestamp)}
        </div>
      </div>

      {/* Dependency Changes Detail */}
      {dependencyMeta.logType === "dependency-change" &&
        dependencyMeta.dependencyData &&
        Array.isArray(dependencyMeta.dependencyData) && (
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                color: "#60a5fa",
                fontWeight: "bold",
                marginBottom: "6px",
                fontSize: "9px",
              }}
            >
              🔍 Changed Properties:
            </div>
            <div style={{ display: "grid", gap: "4px" }}>
              {dependencyMeta.dependencyData.map((item: any, index: number) => (
                <div
                  key={index}
                  style={{
                    padding: "4px 6px",
                    backgroundColor: "#0f172a22",
                    borderRadius: "2px",
                    fontSize: "8px",
                  }}
                >
                  <div style={{ color: "#60a5fa", fontWeight: "bold" }}>
                    {item.type === "function"
                      ? "📝"
                      : item.type === "object"
                        ? "📦"
                        : "🔧"}{" "}
                    {item.property}
                  </div>
                  <div
                    style={{
                      color: "#9ca3af",
                      marginLeft: "12px",
                      marginTop: "2px",
                    }}
                  >
                    <span style={{ color: "#f87171" }}>from:</span>{" "}
                    {formatValue(item.from)}
                  </div>
                  <div style={{ color: "#9ca3af", marginLeft: "12px" }}>
                    <span style={{ color: "#34d399" }}>to:</span>{" "}
                    {formatValue(item.to)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Raw Data for non-dependency-change types */}
      {log.data && dependencyMeta.logType !== "dependency-change" && (
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              color: "#60a5fa",
              fontWeight: "bold",
              marginBottom: "4px",
              fontSize: "9px",
            }}
          >
            📊 Raw Data:
          </div>
          <div
            style={{
              color: "#d1d5db",
              fontSize: "8px",
              backgroundColor: "#0f172a22",
              padding: "4px 6px",
              borderRadius: "2px",
              fontFamily: "monospace",
              overflow: "auto",
              maxHeight: "100px",
            }}
          >
            <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {displayStrategy.isComplex
                ? JsonUtils.stringify(log.data)
                : safeJsonStringify(log.data)}
            </pre>
          </div>
        </div>
      )}

      {/* MIGRATED: Updated condition to use JsonUtils.isComplex */}
      {displayStrategy.isComplex && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
          <span className="mr-1">⚠️</span>
          Large dependency object - performance optimized view
        </div>
      )}

      {/* Contextual Help Messages */}
      <DependencyHelpMessage logType={dependencyMeta.logType} />
    </div>
  );
});

DependencyExpansionContent.displayName = "DependencyExpansionContent";

/**
 * OPTIMIZED: Memoized help message component
 */
const DependencyHelpMessage: React.FC<{ logType: DependencyLogType }> =
  React.memo(({ logType }) => {
    // Memoize help content based on log type
    const helpContent = useMemo(() => {
      switch (logType) {
        case "function-recreation":
        case "object-recreation":
          return {
            bgColor: "#065f4611",
            borderColor: "#065f4622",
            titleColor: "#10b981",
            textColor: "#6ee7b7",
            icon: "💡",
            title: "Smart Dependency Tracking:",
            text: "🚀📋 = Normal during app initialization. ⚠️ FREQUENT = Performance issue - consider useCallback/useMemo. Gray = Normal change.",
          };

        case "render-warning":
          return {
            bgColor: "#92400e11",
            borderColor: "#92400e22",
            titleColor: "#f59e0b",
            textColor: "#fbbf24",
            icon: "⚠️",
            title: "Performance Warning:",
            text: "This component is re-rendering frequently. Check for unstable dependencies.",
          };

        case "circuit-breaker":
          return {
            bgColor: "#7f1d1d11",
            borderColor: "#7f1d1d22",
            titleColor: "#ef4444",
            textColor: "#fca5a5",
            icon: "🚨",
            title: "Circuit Breaker Activated:",
            text: "Component disabled to prevent infinite loop. Will auto-restore shortly.",
          };

        case "emergency-stop":
          return {
            bgColor: "#7f1d1d11",
            borderColor: "#7f1d1d22",
            titleColor: "#ef4444",
            textColor: "#fca5a5",
            icon: "🛑",
            title: "Emergency Stop:",
            text: "System stopped dangerous operation. Check your component logic.",
          };

        default:
          return null;
      }
    }, [logType]);

    if (!helpContent) return null;

    return (
      <div
        style={{
          marginBottom: "8px",
          padding: "6px",
          backgroundColor: helpContent.bgColor,
          borderRadius: "3px",
          border: `1px solid ${helpContent.borderColor}`,
        }}
      >
        <div
          style={{
            color: helpContent.titleColor,
            fontWeight: "bold",
            fontSize: "9px",
            marginBottom: "3px",
          }}
        >
          {helpContent.icon} {helpContent.title}
        </div>
        <div
          style={{
            color: helpContent.textColor,
            fontSize: "8px",
            lineHeight: "1.3",
          }}
        >
          {helpContent.text}
        </div>
      </div>
    );
  });

DependencyHelpMessage.displayName = "DependencyHelpMessage";

/**
 * OPTIMIZED: Get dependency log metadata for external use
 * Used by DefaultLogFormatter to determine severity and expand behavior
 */
export const getDependencyLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "dependencies") {
    return null;
  }

  const logType = parseDependencyLogType(log.message);
  const componentName = extractComponentName(log.message);
  const severity = getDependencySeverity(log);

  return {
    logType,
    componentName,
    severity,
    shouldExpand: true, // Dependencies always benefit from expansion
    expansionContent: DependencyExpansionContent,
  };
};

/**
 * LEGACY: Full custom dependency formatter (for backward compatibility)
 * This provides the old interface for full custom formatting
 */
export const DependencyLogFormatter: React.FC<{ log: DebugLogEntry }> = ({
  log,
}) => {
  // For legacy support, we can still provide a full formatter
  // but internally it uses the optimized expansion system
  const meta = getDependencyLogMeta(log);

  if (!meta) {
    return null;
  }

  // Import DefaultLogFormatter here to avoid circular dependency
  const DefaultLogFormatter =
    require("./default-log-formatter").DefaultLogFormatter;

  return (
    <DefaultLogFormatter
      log={log}
      index={0}
      severity={meta.severity}
      showExpandButton={true}
      expandedContent={<DependencyExpansionContent log={log} />}
    />
  );
};

/**
 * Export both expansion content and full formatter for flexibility
 */
export { DependencyLogFormatter as LegacyDependencyLogFormatter };
export default DependencyExpansionContent;
