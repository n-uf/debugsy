"use client";

import React, { useState } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { DefaultLogFormatter, type LogSeverity } from "./default-log-formatter";

/**
 * Formats a timestamp for display in log entries
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().replace("T", " ").slice(0, -1);
};

/**
 * Formats values for display - handles different data types appropriately
 */
export const formatValue = (value: any): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";
  if (typeof value === "boolean") return value.toString();
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return `[${value.length} items]`;
  if (typeof value === "object") return `{${Object.keys(value).length} props}`;
  return String(value);
};

/**
 * Component for rendering expandable metric categories
 */
export const CategorySection: React.FC<{
  title: string;
  emoji: string;
  data: Record<string, any>;
  defaultExpanded?: boolean;
}> = ({ title, emoji, data, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div style={{ marginBottom: "8px" }}>
      {/* Category Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          cursor: "pointer",
          padding: "4px 6px",
          backgroundColor: "#1f292922",
          borderRadius: "3px",
          border: "1px solid #1f292944",
          marginBottom: isExpanded ? "6px" : "0px",
          transition: "all 0.2s ease",
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ fontSize: "10px" }}>{emoji}</span>
        <span
          style={{
            color: "#60a5fa",
            fontWeight: "bold",
            fontSize: "9px",
            flex: 1,
          }}
        >
          {title}
        </span>
        <span style={{ color: "#9ca3af", fontSize: "8px" }}>
          {isExpanded ? "▼" : "▶"}
        </span>
      </div>

      {/* Category Content */}
      {isExpanded && (
        <div
          style={{
            paddingLeft: "12px",
            borderLeft: "2px solid #374151",
            backgroundColor: "#0f172a11",
            borderRadius: "0 3px 3px 0",
            padding: "6px 8px",
          }}
        >
          <div style={{ display: "grid", gap: "3px" }}>
            {Object.entries(data).map(([key, value]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "8px",
                  lineHeight: "1.3",
                }}
              >
                <span style={{ color: "#9ca3af", fontWeight: "normal" }}>
                  {key}:
                </span>
                <span
                  style={{
                    color: "#e5e7eb",
                    fontWeight: "bold",
                    textAlign: "right",
                    maxWidth: "120px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={String(value)}
                >
                  {formatValue(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Get health log severity based on metrics
 */
const getHealthSeverity = (data: any): LogSeverity => {
  if (!data?.fullMetrics) return "info";

  const metrics = data.fullMetrics;

  // Check for critical conditions
  if (metrics.debugActivity?.emergencyMode === "active") return "critical";
  if (metrics.dependencyTracking?.circuitBreakers?.some((cb: any) => cb.isOpen))
    return "error";

  // Check for warnings
  if (metrics.performance?.memoryUsage?.usage > 0.8) return "warn";
  if (metrics.debugActivity?.totalLogs > 5000) return "warn";

  // Check for success conditions
  if (metrics.debugActivity?.systemStatus === "healthy") return "success";

  return "info";
};

/**
 * Render the rich health metrics content
 */
const HealthMetricsContent: React.FC<{ log: DebugLogEntry }> = ({ log }) => {
  if (!log.data?.fullMetrics) {
    return (
      <div style={{ color: "#9ca3af", fontSize: "9px", fontStyle: "italic" }}>
        No detailed health metrics available
      </div>
    );
  }

  const metrics = log.data.fullMetrics;

  return (
    <div style={{ fontFamily: "monospace" }}>
      {/* Summary */}
      {log.data.summary && (
        <div
          style={{
            marginBottom: "8px",
            padding: "4px 6px",
            backgroundColor: "#065f4611",
            borderRadius: "3px",
            border: "1px solid #065f4622",
          }}
        >
          <div
            style={{ color: "#6ee7b7", fontSize: "9px", fontWeight: "bold" }}
          >
            📊 {log.data.summary}
          </div>
          <div style={{ color: "#10b981", fontSize: "8px", marginTop: "2px" }}>
            Captured at {formatTime(metrics.timestamp || log.timestamp)}
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      {metrics.performance && (
        <CategorySection
          title="Performance"
          emoji="⚡"
          data={metrics.performance}
          defaultExpanded={true}
        />
      )}

      {/* Debug Activity */}
      {metrics.debugActivity && (
        <CategorySection
          title="Debug Activity"
          emoji="🎯"
          data={metrics.debugActivity}
          defaultExpanded={false}
        />
      )}

      {/* Dependencies */}
      {metrics.dependencyTracking && (
        <CategorySection
          title="Dependencies"
          emoji="🔄"
          data={metrics.dependencyTracking}
          defaultExpanded={false}
        />
      )}

      {/* Circuit Breakers */}
      {metrics.circuitBreakers && metrics.circuitBreakers.length > 0 && (
        <CategorySection
          title="Circuit Breakers"
          emoji="🚨"
          data={{
            total: metrics.circuitBreakers.length,
            open: metrics.circuitBreakers.filter((cb: any) => cb.isOpen).length,
            closed: metrics.circuitBreakers.filter((cb: any) => !cb.isOpen)
              .length,
          }}
          defaultExpanded={false}
        />
      )}

      {/* System Info */}
      {metrics.system && (
        <CategorySection
          title="System"
          emoji="💻"
          data={metrics.system}
          defaultExpanded={false}
        />
      )}
    </div>
  );
};

/**
 * Health log formatter - uses DefaultLogFormatter with rich expandable content
 */
export const HealthLogFormatter: React.FC<{ log: DebugLogEntry }> = ({
  log,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (log.point !== "health") {
    return null;
  }

  const severity = getHealthSeverity(log.data);

  return (
    <DefaultLogFormatter
      log={log}
      index={0} // Health logs don't need alternating colors since they're styled differently
      severity={severity}
      showExpandButton={true} // Explicitly control expand behavior
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded(!isExpanded)}
      expandedContent={<HealthMetricsContent log={log} />}
    />
  );
};
