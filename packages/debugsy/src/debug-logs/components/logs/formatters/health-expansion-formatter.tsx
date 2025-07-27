"use client";

import React, { useMemo } from "react";
import type { DebugLogEntry } from "../../../hooks/use-debugsy";
import { type LogSeverity } from "./default-log-formatter";
import {
  CompactHeader,
  DashboardGrid,
  MetricCard,
  SectionContainer,
  StatusIndicator,
} from "./shared-components";
import { SHARED_TOKENS } from "./shared-tokens";

// CSS animation styles
const pulseAnimation = `
  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
  }
`;

// Inject styles if not already present
if (
  typeof document !== "undefined" &&
  !document.getElementById("health-animation-styles")
) {
  const style = document.createElement("style");
  style.id = "health-animation-styles";
  style.textContent = pulseAnimation;
  document.head.appendChild(style);
}

/**
 * Formats a timestamp for display in log entries
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toISOString().replace("T", " ").slice(0, -1);
};

/**
 * Formats values for display in metric cards
 */
export const formatMetricValue = (
  value: any
): { display: string; type: string } => {
  if (value === null) return { display: "null", type: "null" };
  if (value === undefined) return { display: "N/A", type: "undefined" };
  if (typeof value === "boolean")
    return { display: value ? "Yes" : "No", type: "boolean" };
  if (typeof value === "number") {
    if (value > 1024 * 1024)
      return {
        display: `${(value / (1024 * 1024)).toFixed(1)}MB`,
        type: "bytes",
      };
    if (value > 1024)
      return { display: `${(value / 1024).toFixed(1)}KB`, type: "bytes" };
    return { display: value.toLocaleString(), type: "number" };
  }
  if (typeof value === "string") return { display: value, type: "string" };
  if (Array.isArray(value))
    return { display: `${value.length} items`, type: "array" };
  if (typeof value === "object")
    return { display: `${Object.keys(value).length} props`, type: "object" };
  return { display: String(value), type: "unknown" };
};

/**
 * Enhanced health dashboard component
 */
export const HealthDashboard: React.FC<{ metrics: any }> = React.memo(
  ({ metrics }) => {
    // Extract key performance metrics
    const performanceMetrics = metrics.performance || {};
    const debugMetrics = metrics.debugActivity || {};
    const systemMetrics = metrics.system || {};

    // Create dashboard cards for key metrics
    const dashboardCards = useMemo(() => {
      const cards = [];

      // Memory Usage Card
      if (performanceMetrics.memoryUsage) {
        const memory = performanceMetrics.memoryUsage;
        const used = memory.used || 0;
        const total = memory.total || 0;
        const percentage = memory.percentage || 0;

        cards.push(
          <MetricCard
            key="memory"
            label="Memory Usage"
            value={percentage}
            type="percentage"
            icon="💾"
            color={SHARED_TOKENS.colors.memory}
            isImportant={percentage > 80}
            subMetrics={[
              { label: "Used", value: formatMetricValue(used).display },
              { label: "Total", value: formatMetricValue(total).display },
            ]}
          />
        );
      }

      // Debug Activity Card
      if (debugMetrics.totalLogs !== undefined) {
        cards.push(
          <MetricCard
            key="debug"
            label="Debug Activity"
            value={debugMetrics.totalLogs}
            type="count"
            icon="🎯"
            color={SHARED_TOKENS.colors.debug}
            isImportant={debugMetrics.totalLogs > 1000}
            subMetrics={[
              {
                label: "Enabled Points",
                value: debugMetrics.enabledPoints || 0,
              },
              {
                label: "Memory Usage",
                value: debugMetrics.memoryUsage || "N/A",
              },
            ]}
          />
        );
      }

      // Connection Status Card
      if (performanceMetrics.connectionType) {
        const isOnline = performanceMetrics.connectionType !== "offline";
        cards.push(
          <MetricCard
            key="connection"
            label="Connection"
            value={performanceMetrics.connectionType}
            type="count"
            icon="🌐"
            color={
              isOnline
                ? SHARED_TOKENS.colors.success
                : SHARED_TOKENS.colors.error
            }
            isImportant={!isOnline}
            subMetrics={[
              {
                label: "Cores",
                value: performanceMetrics.hardwareConcurrency || "N/A",
              },
              {
                label: "Device RAM",
                value: performanceMetrics.deviceMemory || "N/A",
              },
            ]}
          />
        );
      }

      // System Health Card
      if (systemMetrics || debugMetrics.systemStatus) {
        const isHealthy = debugMetrics.systemStatus === "healthy";
        cards.push(
          <MetricCard
            key="system"
            label="System Health"
            value={debugMetrics.systemStatus || "Unknown"}
            type="count"
            icon="🏥"
            color={
              isHealthy
                ? SHARED_TOKENS.colors.success
                : SHARED_TOKENS.colors.warning
            }
            isImportant={!isHealthy}
          />
        );
      }

      // Circuit Breakers Card
      if (metrics.circuitBreakers && metrics.circuitBreakers.length > 0) {
        const openBreakers = metrics.circuitBreakers.filter(
          (cb: any) => cb.isOpen
        ).length;
        const total = metrics.circuitBreakers.length;

        cards.push(
          <MetricCard
            key="circuit"
            label="Circuit Breakers"
            value={`${total - openBreakers}/${total}`}
            type="count"
            icon="🚨"
            color={
              openBreakers > 0
                ? SHARED_TOKENS.colors.error
                : SHARED_TOKENS.colors.success
            }
            isImportant={openBreakers > 0}
            subMetrics={[
              { label: "Open", value: openBreakers },
              { label: "Closed", value: total - openBreakers },
            ]}
          />
        );
      }

      // Component Metrics Card
      if (metrics.componentMetrics) {
        const compMetrics = metrics.componentMetrics;
        cards.push(
          <MetricCard
            key="components"
            label="Components"
            value={compMetrics.surfaceComponents || 0}
            type="count"
            icon="⚛️"
            color={SHARED_TOKENS.colors.accent}
            subMetrics={[
              {
                label: "Frame Elements",
                value: compMetrics.frameElements || 0,
              },
              {
                label: "Selection",
                value: compMetrics.selectionActive ? "Active" : "Inactive",
              },
            ]}
          />
        );
      }

      return cards;
    }, [metrics, performanceMetrics, debugMetrics, systemMetrics]);

    return (
      <div>
        {/* Main Dashboard Grid */}
        <DashboardGrid columns={3}>{dashboardCards}</DashboardGrid>

        {/* Additional Sections for Detailed Data */}
        {metrics.dependencyTracking && (
          <SectionContainer
            title="Dependencies"
            icon="🔄"
            color={SHARED_TOKENS.colors.dependencies}
            collapsible={true}
            defaultExpanded={false}
          >
            <DashboardGrid columns={2}>
              {Object.entries(metrics.dependencyTracking).map(
                ([key, value]) => {
                  const formatted = formatMetricValue(value);
                  return (
                    <MetricCard
                      key={key}
                      label={key}
                      value={formatted.display}
                      type="count"
                      color={SHARED_TOKENS.colors.dependencies}
                    />
                  );
                }
              )}
            </DashboardGrid>
          </SectionContainer>
        )}
      </div>
    );
  }
);

HealthDashboard.displayName = "HealthDashboard";

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
 * Enhanced health expansion content with dashboard-style metrics
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

    // Show basic health info if no data
    if (!healthMeta.hasMetrics && !log.data) {
      return (
        <div
          style={{
            fontFamily: SHARED_TOKENS.fonts.mono,
            padding: SHARED_TOKENS.spacing.lg,
            background: SHARED_TOKENS.colors.bgSecondary,
            border: `1px solid ${SHARED_TOKENS.colors.border}`,
            borderRadius: SHARED_TOKENS.borderRadius.lg,
            textAlign: "center" as const,
          }}
        >
          <StatusIndicator status="warning" label="No health data available" />
        </div>
      );
    }

    // Show basic health mode if no detailed metrics
    if (!healthMeta.hasMetrics) {
      return (
        <div
          style={{
            fontFamily: SHARED_TOKENS.fonts.mono,
            background: SHARED_TOKENS.colors.bg,
            borderRadius: SHARED_TOKENS.borderRadius.lg,
            overflow: "hidden",
          }}
        >
          <CompactHeader
            title="Health Snapshot (Basic)"
            subtitle="Limited health data available"
            icon="🏥"
            timestamp={formatTime(log.timestamp)}
            color={SHARED_TOKENS.colors.info}
          />

          {log.data && (
            <SectionContainer
              title="Raw Data"
              icon="📊"
              color={SHARED_TOKENS.colors.info}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap" as const,
                  color: SHARED_TOKENS.colors.text,
                  fontSize: "9px",
                  fontFamily: SHARED_TOKENS.fonts.mono,
                  lineHeight: "1.4",
                  background: SHARED_TOKENS.colors.bgTertiary,
                  padding: SHARED_TOKENS.spacing.lg,
                  borderRadius: SHARED_TOKENS.borderRadius.md,
                  maxHeight: "200px",
                  overflow: "auto",
                }}
              >
                {JSON.stringify(log.data, null, 2)}
              </pre>
            </SectionContainer>
          )}
        </div>
      );
    }

    // Full dashboard mode with detailed metrics
    const metrics = healthMeta.fullMetrics;

    return (
      <div
        style={{
          fontFamily: SHARED_TOKENS.fonts.mono,
          fontSize: "10px",
          background: SHARED_TOKENS.colors.bg,
          borderRadius: SHARED_TOKENS.borderRadius.lg,
          overflow: "hidden",
        }}
      >
        <CompactHeader
          title={healthMeta.summary || "Health Snapshot"}
          subtitle="System health and performance metrics"
          icon="🏥"
          timestamp={formatTime(healthMeta.timestamp)}
          color={SHARED_TOKENS.colors.success}
        />

        <HealthDashboard metrics={metrics} />
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
