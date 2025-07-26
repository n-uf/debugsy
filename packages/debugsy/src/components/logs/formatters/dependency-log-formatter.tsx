"use client";

import React, { useState } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import {
  isLikelyLargeObject,
  safeJsonStringify,
  smartJsonStringify,
} from "../utils/log-utilities";
import { DefaultLogFormatter, type LogSeverity } from "./default-log-formatter";
import { formatTime, formatValue } from "./health-log-formatter";

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
 * Parse dependency log type from message content
 */
const parseDependencyLogType = (message: string): DependencyLogType => {
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
 * Extract component name from log message
 */
const extractComponentName = (message: string): string => {
  const match = message.match(/\[([^\]]+)\]/);
  return match?.[1] ?? "Unknown";
};

/**
 * Get dependency log severity based on log type and content
 */
const getDependencySeverity = (
  logType: DependencyLogType,
  message: string
): LogSeverity => {
  switch (logType) {
    case "circuit-breaker":
    case "emergency-stop":
      return "critical";
    case "render-warning":
      return "warn";
    case "function-recreation":
    case "object-recreation":
      // Check for frequent changes
      return message.includes("⚠️ FREQUENT") ? "warn" : "error";
    case "dependency-change":
      return "info";
    case "hook-execution":
      return "warn";
    case "primitive-change":
      return "info";
    default:
      return "info";
  }
};

/**
 * Format dependency change data for display
 */
const formatDependencyData = (data: any, type: DependencyLogType) => {
  if (!data) return null;

  if (type === "dependency-change" && typeof data === "object") {
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
  }

  return data;
};

/**
 * Render the rich dependency tracking content
 */
const DependencyDetailsContent: React.FC<{
  log: DebugLogEntry;
  logType: DependencyLogType;
  componentName: string;
}> = ({ log, logType, componentName }) => {
  const dependencyData = formatDependencyData(log.data, logType);

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
          🧩 Component: {componentName}
        </div>
        <div style={{ color: "#93c5fd", fontSize: "8px", marginTop: "2px" }}>
          Logged at {formatTime(log.timestamp)}
        </div>
      </div>

      {/* Dependency Changes Detail */}
      {logType === "dependency-change" &&
        dependencyData &&
        Array.isArray(dependencyData) && (
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
              {dependencyData.map((item: any, index: number) => (
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

      {/* Raw Data */}
      {log.data && logType !== "dependency-change" && (
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
              {isLikelyLargeObject(log.data)
                ? smartJsonStringify(log.data, 3, 15)
                : safeJsonStringify(log.data, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Troubleshooting Tips */}
      {(logType === "function-recreation" ||
        logType === "object-recreation") && (
        <div
          style={{
            marginBottom: "8px",
            padding: "6px",
            backgroundColor: "#065f4611",
            borderRadius: "3px",
            border: "1px solid #065f4622",
          }}
        >
          <div
            style={{
              color: "#10b981",
              fontWeight: "bold",
              fontSize: "9px",
              marginBottom: "3px",
            }}
          >
            💡 Fix Suggestion:
          </div>
          <div style={{ color: "#6ee7b7", fontSize: "8px", lineHeight: "1.3" }}>
            {logType === "function-recreation"
              ? "Use useCallback() to memoize this function with stable dependencies"
              : "Use useMemo() to memoize this object or array with stable dependencies"}
          </div>
        </div>
      )}

      {logType === "render-warning" && (
        <div
          style={{
            marginBottom: "8px",
            padding: "6px",
            backgroundColor: "#92400e11",
            borderRadius: "3px",
            border: "1px solid #92400e22",
          }}
        >
          <div
            style={{
              color: "#f59e0b",
              fontWeight: "bold",
              fontSize: "9px",
              marginBottom: "3px",
            }}
          >
            ⚠️ Performance Warning:
          </div>
          <div style={{ color: "#fbbf24", fontSize: "8px", lineHeight: "1.3" }}>
            This component is re-rendering frequently. Check for unstable
            dependencies.
          </div>
        </div>
      )}

      {logType === "circuit-breaker" && (
        <div
          style={{
            marginBottom: "8px",
            padding: "6px",
            backgroundColor: "#7f1d1d11",
            borderRadius: "3px",
            border: "1px solid #7f1d1d22",
          }}
        >
          <div
            style={{
              color: "#ef4444",
              fontWeight: "bold",
              fontSize: "9px",
              marginBottom: "3px",
            }}
          >
            🚨 Circuit Breaker Activated:
          </div>
          <div style={{ color: "#fca5a5", fontSize: "8px", lineHeight: "1.3" }}>
            Component disabled to prevent infinite loop. Will auto-restore
            shortly.
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Dependency log formatter - uses DefaultLogFormatter with rich expandable content
 */
export const DependencyLogFormatter: React.FC<{ log: DebugLogEntry }> = ({
  log,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (log.point !== "dependencies") {
    return null;
  }

  const logType = parseDependencyLogType(log.message);
  const componentName = extractComponentName(log.message);
  const severity = getDependencySeverity(logType, log.message);

  return (
    <DefaultLogFormatter
      log={log}
      index={0} // Dependency logs don't need alternating colors since they're styled differently
      severity={severity}
      showExpandButton={true} // Explicitly control expand behavior
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={
        <DependencyDetailsContent
          log={log}
          logType={logType}
          componentName={componentName}
        />
      }
    />
  );
};
