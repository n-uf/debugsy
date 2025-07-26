"use client";

import React, { useMemo, useState } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { type LogSeverity } from "./default-log-formatter";

/**
 * Formats a timestamp for display in log entries
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().replace("T", " ").slice(0, -1);
};

/**
 * OPTIMIZED: Formats values for display - handles different data types appropriately
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
 * OPTIMIZED: Memoized category section for better performance
 */
export const CategorySection: React.FC<{
  title: string;
  emoji: string;
  data: Record<string, any>;
  defaultExpanded?: boolean;
}> = React.memo(({ title, emoji, data, defaultExpanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Memoize category entries to prevent recalculation
  const categoryEntries = useMemo(() => {
    return Object.entries(data);
  }, [data]);

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
            {categoryEntries.map(([key, value]) => (
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
});

CategorySection.displayName = "CategorySection";

/**
 * OPTIMIZED: Get health log severity with memoization-friendly logic
 */
const getHealthSeverity = (data: any): LogSeverity => {
  if (!data?.fullMetrics) return "info";

  const metrics = data.fullMetrics;

  // Check for critical conditions
  if (metrics.debugActivity?.emergencyMode === "active") return "critical";
  if (
    metrics.dependencyTracking?.circuitBreakers?.some?.((cb: any) => cb.isOpen)
  )
    return "error";

  // Check for warnings
  if (metrics.performance?.memoryUsage?.usage > 0.8) return "warn";
  if (metrics.debugActivity?.totalLogs > 5000) return "warn";

  // Check for success conditions
  if (metrics.debugActivity?.systemStatus === "healthy") return "success";

  return "info";
};

/**
 * OPTIMIZED: Health expansion content with memoized metrics processing
 * This component provides the expansion content for health logs
 */
export const HealthExpansionContent: React.FC<{ log: DebugLogEntry }> =
  React.memo(({ log }) => {
    // Memoize health metrics to prevent recomputation
    const healthMeta = useMemo(() => {
      const fullMetrics = log.data?.fullMetrics;
      const summary = log.data?.summary;
      const severity = getHealthSeverity(log.data);

      return {
        fullMetrics,
        summary,
        severity,
        timestamp: fullMetrics?.timestamp || log.timestamp,
        hasMetrics: !!fullMetrics,
      };
    }, [log.data, log.timestamp]);

    // FIXED: Show basic health info even without detailed metrics
    if (!healthMeta.hasMetrics && !log.data) {
      return (
        <div style={{ color: "#9ca3af", fontSize: "9px", fontStyle: "italic" }}>
          No health data available
        </div>
      );
    }

    // FIXED: Show data summary if no detailed metrics
    if (!healthMeta.hasMetrics) {
      return (
        <div style={{ fontFamily: "monospace" }}>
          {/* Basic Health Info */}
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
              🏥 Health Snapshot (Basic)
            </div>
            <div
              style={{ color: "#10b981", fontSize: "8px", marginTop: "2px" }}
            >
              Captured at {formatTime(log.timestamp)}
            </div>
          </div>

          {/* Show available data */}
          {log.data && (
            <div style={{ fontSize: "8px", color: "#e5e7eb" }}>
              <pre style={{ margin: 0, whiteSpace: "pre-wrap" }}>
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      );
    }

    const metrics = healthMeta.fullMetrics;

    return (
      <div style={{ fontFamily: "monospace" }}>
        {/* Summary */}
        {healthMeta.summary && (
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
              📊 {healthMeta.summary}
            </div>
            <div
              style={{ color: "#10b981", fontSize: "8px", marginTop: "2px" }}
            >
              Captured at {formatTime(healthMeta.timestamp)}
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
              open: metrics.circuitBreakers.filter((cb: any) => cb.isOpen)
                .length,
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
  });

HealthExpansionContent.displayName = "HealthExpansionContent";

/**
 * OPTIMIZED: Get health log metadata for external use
 * Used by DefaultLogFormatter to determine severity and expand behavior
 */
export const getHealthLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "health") {
    return null;
  }

  const severity = getHealthSeverity(log.data);
  const hasDetailedMetrics = !!log.data?.fullMetrics;

  // FIXED: Always allow expansion for health logs if they have any data
  const shouldExpand = hasDetailedMetrics || !!log.data;

  return {
    severity,
    shouldExpand,
    expansionContent: HealthExpansionContent,
  };
};

/**
 * LEGACY: Full custom health formatter (for backward compatibility)
 * This provides the old interface for full custom formatting
 */
export const HealthLogFormatter: React.FC<{ log: DebugLogEntry }> = ({
  log,
}) => {
  // For legacy support, we can still provide a full formatter
  // but internally it uses the optimized expansion system
  const meta = getHealthLogMeta(log);

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
      showExpandButton={meta.shouldExpand}
      expandedContent={<HealthExpansionContent log={log} />}
    />
  );
};

/**
 * Export both expansion content and full formatter for flexibility
 */
export { HealthLogFormatter as LegacyHealthLogFormatter };
export default HealthExpansionContent;
