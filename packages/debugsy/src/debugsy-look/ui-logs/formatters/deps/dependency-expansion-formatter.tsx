"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../../debugsy-shared/debug-constants";
import {
  createObjectDiff,
  getDiffSummary,
} from "../../../../debugsy-shared/object-depth-utils";
import { safeJsonStringify } from "../../utils/json/json-utilities";
import { formatTime } from "../health-expansion-formatter";
import { CompactHeader } from "../shared-components";
import { SHARED_TOKENS } from "../shared-tokens";

// Local imports
import { DeltaDisplay, DeltaSummary } from "./components/delta-display";
import { CompactDiffDisplay } from "./components/diff-display";
import { CompactHelpMessage } from "./components/help-message";
import { CompactValueRenderer } from "./components/value-renderers";
import { COMPACT_JSON_STYLE } from "./constants";
import {
  calculateDelta,
  extractComponentName,
  formatDependencyData,
  getDependencySeverity,
  getLogTypeMetadata,
  type DeltaInfo,
} from "./utils";

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
    const logTypeData = getLogTypeMetadata(log);
    const logType = logTypeData.type;
    const componentName = extractComponentName(log.message);
    const severity = getDependencySeverity(log);
    const dependencyData = formatDependencyData(log.data, logType);

    return {
      logType,
      logTypeData,
      componentName,
      severity,
      dependencyData,
    };
  }, [log.message, log.data, log.level]);

  // RELAXED: More permissive display strategy with superjson safety
  const displayStrategy = useMemo(() => {
    if (!log.data) return { isComplex: false, shouldShow: false };

    // With superjson, we can safely show most objects as JsonView
    const shouldUseJsonView = typeof log.data === "object" && log.data !== null;

    return {
      isComplex: shouldUseJsonView,
      shouldShow: true,
      content: log.data,
    };
  }, [log.data]);

  return (
    <div style={{ fontFamily: SHARED_TOKENS.fonts.mono, fontSize: "10px" }}>
      {/* Compact Header */}
      <CompactHeader
        title={dependencyMeta.componentName}
        subtitle="Dependency changes tracked"
        icon={(() => {
          switch (dependencyMeta.logType) {
            case "function-recreation":
              return "ƒ";
            case "object-recreation":
              return "{}";
            case "dependency-change":
              return "🔄";
            case "circuit-breaker":
              return "🚨";
            case "emergency-stop":
              return "🛑";
            default:
              return "📊";
          }
        })()}
        timestamp={formatTime(log.timestamp)}
        color={(() => {
          switch (dependencyMeta.logType) {
            case "function-recreation":
            case "object-recreation":
              return SHARED_TOKENS.colors.added;
            case "dependency-change":
              return SHARED_TOKENS.colors.changed;
            case "circuit-breaker":
            case "emergency-stop":
              return SHARED_TOKENS.colors.error;
            default:
              return SHARED_TOKENS.colors.accent;
          }
        })()}
      />

      {/* Dependency Changes Detail with JsonView support */}
      {dependencyMeta.logType === "dependency-change" &&
        dependencyMeta.dependencyData &&
        Array.isArray(dependencyMeta.dependencyData) &&
        (() => {
          // Calculate deltas for all changes
          const allDeltas: DeltaInfo[] = dependencyMeta.dependencyData
            .map((item: any) =>
              calculateDelta(item.from, item.to, item.property)
            )
            .filter(Boolean) as DeltaInfo[];

          return (
            <div style={{ marginBottom: SHARED_TOKENS.spacing.md }}>
              <div
                style={{
                  color: SHARED_TOKENS.colors.accent,
                  fontWeight: "600",
                  marginBottom: SHARED_TOKENS.spacing.sm,
                  fontSize: "10px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                Changes ({dependencyMeta.dependencyData.length})
              </div>

              {/* Delta Summary */}
              {allDeltas.length > 0 && <DeltaSummary deltas={allDeltas} />}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: SHARED_TOKENS.spacing.sm,
                }}
              >
                {dependencyMeta.dependencyData.map(
                  (item: any, index: number) => {
                    // Calculate delta with tracking information for frequency-based impact
                    const itemDelta = calculateDelta(
                      item.from,
                      item.to,
                      item.property,
                      item.tracking // Pass tracking info for frequency-based coloring
                    );

                    // Calculate diff for object changes (more inclusive)
                    const needsDetailedDiff =
                      typeof item.from === "object" &&
                      typeof item.to === "object" &&
                      item.from !== null &&
                      item.to !== null &&
                      item.from !== item.to; // Any object change

                    const diffData = needsDetailedDiff
                      ? (() => {
                          const diffs = createObjectDiff(
                            item.from,
                            item.to,
                            15
                          );
                          if (diffs.length > 0) {
                            return {
                              diffs,
                              summary: getDiffSummary(diffs),
                              type: "object-diff",
                            };
                          }
                          return null;
                        })()
                      : null;

                    return (
                      <div
                        key={index}
                        style={{
                          background: SHARED_TOKENS.colors.bgSecondary,
                          border: `1px solid ${SHARED_TOKENS.colors.border}`,
                          borderRadius: "3px",
                          padding: SHARED_TOKENS.spacing.md,
                          marginBottom: SHARED_TOKENS.spacing.sm,
                          fontSize: "10px",
                          fontFamily: SHARED_TOKENS.fonts.mono,
                        }}
                      >
                        {/* Compact Property Header with frequency indicator */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: SHARED_TOKENS.spacing.sm,
                            marginBottom: SHARED_TOKENS.spacing.sm,
                            paddingBottom: SHARED_TOKENS.spacing.xs,
                            borderBottom: `1px solid ${SHARED_TOKENS.colors.border}`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: (() => {
                                switch (item.type) {
                                  case "function":
                                    return SHARED_TOKENS.colors.changed;
                                  case "object":
                                    return SHARED_TOKENS.colors.accent;
                                  default:
                                    return SHARED_TOKENS.colors.textSecondary;
                                }
                              })(),
                            }}
                          >
                            {item.type === "function"
                              ? "ƒ"
                              : item.type === "object"
                                ? "{}"
                                : "◦"}
                          </span>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: SHARED_TOKENS.colors.text,
                            }}
                          >
                            {item.property}
                          </span>
                          <span
                            style={{
                              fontSize: "8px",
                              color: SHARED_TOKENS.colors.textMuted,
                              textTransform: "uppercase",
                            }}
                          >
                            {item.type}
                          </span>

                          {/* Frequency indicator */}
                          {item.tracking && (
                            <span
                              style={{
                                fontSize: "8px",
                                color: item.tracking.isFrequent
                                  ? "#ef4444"
                                  : "#6b7280",
                                fontWeight: "600",
                              }}
                            >
                              (#{item.tracking.count})
                              {item.tracking.isFrequent && " ⚠️ FREQUENT"}
                            </span>
                          )}
                        </div>

                        {/* Primary Delta Display - frequency-based coloring */}
                        {itemDelta && (
                          <DeltaDisplay delta={itemDelta} showMetrics={true} />
                        )}

                        {/* Detailed Object Diff - for complex object changes */}
                        {diffData && (
                          <CompactDiffDisplay
                            diffs={diffData.diffs}
                            summary={diffData.summary}
                          />
                        )}

                        {/* From/To Value Display - always show for context */}
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: SHARED_TOKENS.spacing.xs,
                            marginTop: SHARED_TOKENS.spacing.sm,
                          }}
                        >
                          {/* Only show 'from' if it's different from 'to' */}
                          {item.from !== item.to && (
                            <CompactValueRenderer
                              value={item.from}
                              label="from"
                              type="old"
                            />
                          )}

                          {/* Always show 'to' (target) value */}
                          <CompactValueRenderer
                            value={item.to}
                            label={item.from !== item.to ? "to" : "value"}
                            type="new"
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          );
        })()}

      {/* Raw Data for non-dependency-change types with JsonView */}
      {log.data && dependencyMeta.logType !== "dependency-change" && (
        <div style={{ marginBottom: SHARED_TOKENS.spacing.md }}>
          <div
            style={{
              color: SHARED_TOKENS.colors.accent,
              fontWeight: "600",
              marginBottom: SHARED_TOKENS.spacing.sm,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Data
          </div>
          <div
            style={{
              backgroundColor: SHARED_TOKENS.colors.bgSecondary,
              padding: SHARED_TOKENS.spacing.sm,
              borderRadius: "3px",
              border: `1px solid ${SHARED_TOKENS.colors.border}`,
              fontFamily: SHARED_TOKENS.fonts.mono,
              overflow: "auto",
              maxHeight: "120px",
            }}
          >
            {displayStrategy.isComplex ? (
              <JsonView
                src={log.data}
                style={COMPACT_JSON_STYLE}
                collapsed={2}
                displaySize={true}
                enableClipboard={true}
                theme="default"
              />
            ) : (
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  color: SHARED_TOKENS.colors.text,
                  fontSize: "9px",
                }}
              >
                {safeJsonStringify(log.data, undefined, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Complex object warning */}
      {displayStrategy.isComplex && (
        <div
          style={{
            fontSize: "8px",
            color: SHARED_TOKENS.colors.textMuted,
            fontStyle: "italic",
            marginTop: SHARED_TOKENS.spacing.sm,
            padding: SHARED_TOKENS.spacing.xs,
            border: `1px solid ${SHARED_TOKENS.colors.border}`,
            borderRadius: "2px",
            background: SHARED_TOKENS.colors.bgSecondary,
          }}
        >
          ⚠ Large object - optimized view
        </div>
      )}

      {/* Compact Help Messages */}
      <CompactHelpMessage logType={dependencyMeta.logType} />
    </div>
  );
});

DependencyExpansionContent.displayName = "DependencyExpansionContent";

/**
 * OPTIMIZED: Get dependency log metadata for external use
 * Used by DefaultLogFormatter to determine severity and expand behavior
 */
export const getDependencyLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "dependencies") {
    return null;
  }

  const logTypeData = getLogTypeMetadata(log);
  const logType = logTypeData.type;
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
    require("../default-log-formatter").DefaultLogFormatter;

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
