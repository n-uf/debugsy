/**
 * Change formatter - displays object diffs for from/to patterns
 * Detects change tracking logs and shows detailed diffs
 */

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import superjson from "superjson";
import {
  calculateDelta,
  formatDelta,
  getImpactColor,
} from "../../../utils/delta-utils";
import { createObjectDiff, getDiffSummary } from "../../../utils/diff-utils";
import { getEnhancedObjectDisplay } from "../../../utils/object-display-utils";
import { CompactDiffDisplay } from "../../diff-display/diff-display";
import type { ExpansionContentProps, FormatterMeta } from "./formatter-types";

/**
 * Change expansion content - shows diffs + full JSON
 */
export const ChangeExpansionContent: React.FC<ExpansionContentProps> = ({
  log,
  colors = {},
}) => {
  const { textSecondary = "rgb(var(--color-text-secondary))" } = colors;

  // Detect and calculate diffs for change tracking logs (from/to patterns)
  const diffData = useMemo(() => {
    if (!log.data) return null;

    const changes = extractChanges(log.data);
    if (changes.length === 0) return null;

    // Calculate diffs for each change, preserving tracking info
    const allDiffs = changes.map((change) => ({
      propertyKey: change.key,
      diffs: createObjectDiff(change.from, change.to, 15),
      from: change.from,
      to: change.to,
      tracking: change.tracking,
    }));

    // Filter out empty diffs
    const nonEmptyDiffs = allDiffs.filter((d) => d.diffs.length > 0);
    if (nonEmptyDiffs.length === 0) return null;

    return nonEmptyDiffs;
  }, [log.data]);

  // Create safe data for JsonView using superjson
  const jsonViewData = useMemo(() => {
    if (log.data === undefined) return null;

    let safeData: any;
    try {
      const serialized = superjson.stringify(log.data);
      safeData = JSON.parse(serialized);
    } catch {
      safeData = {
        __renderError: true,
        __error: "Failed to render data safely",
        __hint: "Data contains structures that cannot be safely displayed",
      };
    }

    // Check if data is complex (object/array with multiple levels)
    const isComplex =
      typeof safeData === "object" &&
      safeData !== null &&
      !safeData.__renderError &&
      (Array.isArray(safeData) || Object.keys(safeData).length > 3);

    return {
      safeData,
      isComplex,
    };
  }, [log.data]);

  if (!jsonViewData) return null;

  return (
    <div
      style={{
        marginTop: "4px",
        marginLeft: "16px",
        borderLeft: "2px solid rgb(var(--color-text-muted))",
        paddingLeft: "8px",
        backgroundColor: "transparent",
        borderRadius: "0 4px 4px 0",
        padding: "8px",
        fontSize: "9px",
        fontFamily: "monospace",
        color: textSecondary,
      }}
    >
      {/* Diff Display - Shows object changes (from/to patterns) */}
      {diffData &&
        diffData.map((propertyDiff, idx) => {
          const change = diffData[idx];
          if (!change) return null;
          const tracking = change.tracking;
          const delta = tracking
            ? calculateDelta(
                change.from,
                change.to,
                propertyDiff.propertyKey,
                tracking,
              )
            : null;

          return (
            <div key={idx} style={{ marginBottom: "8px" }}>
              {propertyDiff.propertyKey !== "[root]" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "rgb(var(--color-warning))",
                      fontFamily: "monospace",
                    }}
                  >
                    Property: {propertyDiff.propertyKey}
                  </div>

                  {/* Frequency tracking badge */}
                  {tracking && (
                    <span
                      style={{
                        fontSize: "8px",
                        color: tracking.isFrequent
                          ? "rgb(var(--color-error))"
                          : "rgb(var(--color-text-muted))",
                        fontWeight: "600",
                        fontFamily: "monospace",
                      }}
                    >
                      (#{tracking.count}){tracking.isFrequent && " ⚠️ FREQUENT"}
                    </span>
                  )}

                  {/* Delta display */}
                  {delta && (
                    <span
                      style={{
                        fontSize: "9px",
                        color: getImpactColor(delta.impact),
                        fontWeight: "500",
                        fontFamily: "monospace",
                      }}
                    >
                      {formatDelta(delta)}
                    </span>
                  )}

                  {/* Performance impact badge */}
                  {delta?.metrics?.performanceImpact &&
                    delta.metrics.performanceImpact !== "minimal" && (
                      <span
                        style={{
                          fontSize: "7px",
                          fontWeight: "600",
                          padding: "1px 4px",
                          borderRadius: "2px",
                          backgroundColor:
                            delta.metrics.performanceImpact === "significant"
                              ? "rgb(var(--color-error) / 0.10)"
                              : "rgb(var(--color-warning) / 0.10)",
                          color:
                            delta.metrics.performanceImpact === "significant"
                              ? "rgb(var(--color-error))"
                              : "rgb(var(--color-warning))",
                          fontFamily: "monospace",
                        }}
                      >
                        {delta.metrics.performanceImpact === "significant"
                          ? "⚡HIGH"
                          : "⚠️MOD"}
                      </span>
                    )}
                </div>
              )}
              <CompactDiffDisplay
                diffs={propertyDiff.diffs}
                summary={getDiffSummary(propertyDiff.diffs)}
              />

              {/* Delta details with type information */}
              {delta && (
                <div
                  style={{
                    marginTop: "6px",
                    padding: "6px",
                    background: "rgb(var(--color-bg-secondary) / 0.6)",
                    border: "1px solid rgb(var(--color-border-primary))",
                    borderRadius: "3px",
                    fontSize: "9px",
                    fontFamily: "monospace",
                  }}
                >
                  {/* Delta type badge */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      style={{
                        color: getImpactColor(delta.impact),
                        fontWeight: "600",
                      }}
                    >
                      {formatDelta(delta)}
                    </span>
                    <span
                      style={{
                        fontSize: "7px",
                        color: "rgb(var(--color-text-secondary))",
                        textTransform: "uppercase",
                        fontWeight: "500",
                      }}
                    >
                      {delta.type}
                    </span>
                    <span
                      style={{
                        fontSize: "8px",
                        color: "rgb(var(--color-text-muted))",
                        flex: 1,
                      }}
                    >
                      {delta.description}
                    </span>
                  </div>

                  {/* FROM/TO values with type badges */}
                  {change && change.from !== change.to && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "3px",
                        marginTop: "4px",
                      }}
                    >
                      {/* FROM value */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "rgb(var(--color-error))",
                            fontSize: "7px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          FROM:
                        </span>
                        {(() => {
                          const fromDisplay = getEnhancedObjectDisplay(
                            change.from,
                          );
                          return (
                            <>
                              {fromDisplay.badge && (
                                <span style={{ fontSize: "9px" }}>
                                  {fromDisplay.badge}
                                </span>
                              )}
                              <span
                                style={{
                                  color: "rgb(var(--color-text-secondary))",
                                  fontSize: "7px",
                                  textTransform: "uppercase",
                                }}
                              >
                                {fromDisplay.type}
                              </span>
                              <span
                                style={{
                                  color: "rgb(var(--color-text-primary))",
                                  fontSize: "9px",
                                }}
                              >
                                {fromDisplay.display}
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {/* TO value */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <span
                          style={{
                            color: "rgb(var(--color-success))",
                            fontSize: "7px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          TO:
                        </span>
                        {(() => {
                          const toDisplay = getEnhancedObjectDisplay(change.to);
                          return (
                            <>
                              {toDisplay.badge && (
                                <span style={{ fontSize: "9px" }}>
                                  {toDisplay.badge}
                                </span>
                              )}
                              <span
                                style={{
                                  color: "rgb(var(--color-text-secondary))",
                                  fontSize: "7px",
                                  textTransform: "uppercase",
                                }}
                              >
                                {toDisplay.type}
                              </span>
                              <span
                                style={{
                                  color: "rgb(var(--color-text-primary))",
                                  fontSize: "9px",
                                }}
                              >
                                {toDisplay.display}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* JSON View - Shows full data structure. All colors below resolve
          to theme-aware CSS variables so the view stays legible on every
          theme (ocean, daylight, parchment, …). The previous palette was
          a hand-picked dark-theme set (#10b981 / #fbbf24 / …) that washed
          out on cream / white surfaces. */}
      <style>{`
        .change-formatter-json-view .json-view {
          --json-property: rgb(var(--color-success));
          --json-index: rgb(var(--color-text-secondary));
          --json-number: rgb(var(--color-info));
          --json-string: rgb(var(--color-warning));
          --json-boolean: rgb(var(--color-error));
          --json-null: rgb(var(--color-text-muted));
        }

        .change-formatter-json-view .json-view .json-view--size,
        .change-formatter-json-view .json-view .json-view--count {
          color: rgb(var(--color-text-primary)) !important;
          font-weight: 500 !important;
          font-size: 10px !important;
          font-style: normal !important;
          letter-spacing: 0.3px !important;
          font-family: ui-monospace, monospace !important;
          background: rgb(var(--color-bg-tertiary) / 0.6) !important;
          border: 1px solid rgb(var(--color-border-primary)) !important;
          padding: 2px 6px !important;
          border-radius: 3px !important;
          margin-left: 6px !important;
          display: inline-block !important;
          opacity: 0.9 !important;
        }

        .change-formatter-json-view .json-view .json-view--copy {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 18px !important;
          height: 18px !important;
          padding: 0 !important;
          margin-left: 6px !important;
          vertical-align: middle !important;
          color: rgb(var(--color-text-muted)) !important;
          background: transparent !important;
          border: 1px solid transparent !important;
          border-radius: 3px !important;
          font-size: 12px !important;
          line-height: 1 !important;
          cursor: pointer !important;
          opacity: 0 !important;
          transition: all 0.15s ease !important;
        }

        .change-formatter-json-view .json-view *:hover > .json-view--copy {
          opacity: 0.7 !important;
        }

        .change-formatter-json-view .json-view .json-view--copy:hover {
          opacity: 1 !important;
          color: rgb(var(--color-info)) !important;
          background: rgb(var(--color-info) / 0.10) !important;
          border-color: rgb(var(--color-info) / 0.30) !important;
          transform: scale(1.05) !important;
        }

        .change-formatter-json-view .json-view .json-view--copy:active {
          transform: scale(0.95) !important;
          color: rgb(var(--color-accent)) !important;
        }

        .change-formatter-json-view .json-view .json-view--arrow {
          color: rgb(var(--color-text-muted)) !important;
          opacity: 0.8 !important;
          font-weight: 600 !important;
          font-size: 11px !important;
          margin-right: 4px !important;
          transition: all 0.15s ease !important;
        }

        .change-formatter-json-view .json-view .json-view--arrow:hover {
          color: rgb(var(--color-text-primary)) !important;
          opacity: 1 !important;
        }

        .change-formatter-json-view .json-view .json-view--property {
          color: rgb(var(--color-success)) !important;
          font-weight: 500 !important;
        }

        .change-formatter-json-view .json-view .json-view--number {
          color: rgb(var(--color-info)) !important;
          font-weight: 500 !important;
        }

        .change-formatter-json-view .json-view .json-view--string {
          color: rgb(var(--color-warning)) !important;
          font-weight: 400 !important;
        }

        .change-formatter-json-view .json-view .json-view--boolean {
          color: rgb(var(--color-error)) !important;
          font-weight: 500 !important;
        }

        .change-formatter-json-view .json-view .json-view--null {
          color: rgb(var(--color-text-muted)) !important;
          font-weight: 400 !important;
        }

        .change-formatter-json-view .json-view button,
        .change-formatter-json-view .json-view [role="button"],
        .change-formatter-json-view .json-view [class*="copy"] {
          display: inline-flex !important;
          visibility: visible !important;
        }

        .change-formatter-json-view .json-view > * {
          line-height: 1.6 !important;
        }

        .change-formatter-json-view .json-view {
          font-family: ui-monospace, 'SF Mono', 'Cascadia Code', 'Source Code Pro', Menlo, Monaco, 'Courier New', monospace !important;
          color: rgb(var(--color-text-primary)) !important;
        }
      `}</style>

      <div className="change-formatter-json-view">
        <JsonView
          src={jsonViewData.safeData}
          style={{
            fontFamily:
              "ui-monospace, SFMono-Regular, Monaco, Consolas, monospace",
            fontSize: "12px",
            backgroundColor: "transparent",
          }}
          collapsed={jsonViewData.isComplex ? 2 : false}
          displaySize={true}
          enableClipboard={true}
          theme="default"
        />
      </div>
    </div>
  );
};

ChangeExpansionContent.displayName = "ChangeExpansionContent";

/**
 * Detect if log contains change data (from/to pattern)
 * Supports both direct from/to and nested property-based structures
 */
export const hasChangePattern = (data: unknown): boolean => {
  if (!data || typeof data !== "object") return false;

  const obj = data as any;

  // Direct from/to at root level
  if ("from" in obj && "to" in obj) return true;

  // Check nested properties (debugsy style: each property has from/to/tracking)
  for (const key of Object.keys(obj)) {
    const prop = obj[key];
    if (prop && typeof prop === "object" && "from" in prop && "to" in prop) {
      return true;
    }
  }

  return false;
};

/**
 * Extract all from/to pairs from data
 * Handles both simple and nested structures
 * Enhanced to include tracking information for frequency display
 */
const extractChanges = (
  data: any,
): Array<{
  key: string;
  from: any;
  to: any;
  tracking?: {
    count: number;
    isFrequent: boolean;
    isStable?: boolean;
    changeType?: string;
  };
}> => {
  if (!data || typeof data !== "object") return [];

  const changes: Array<{
    key: string;
    from: any;
    to: any;
    tracking?: {
      count: number;
      isFrequent: boolean;
      isStable?: boolean;
      changeType?: string;
    };
  }> = [];

  // Direct from/to at root level
  if ("from" in data && "to" in data) {
    changes.push({
      key: "[root]",
      from: data.from,
      to: data.to,
      tracking: "tracking" in data ? data.tracking : undefined,
    });
    return changes;
  }

  // Nested property-based structure (debugsy style with tracking)
  for (const key of Object.keys(data)) {
    const prop = data[key];
    if (prop && typeof prop === "object" && "from" in prop && "to" in prop) {
      changes.push({
        key,
        from: prop.from,
        to: prop.to,
        tracking: "tracking" in prop ? prop.tracking : undefined,
      });
    }
  }

  return changes;
};

/**
 * Get metadata for change formatter
 */
export const getChangeLogMeta = (log: any): FormatterMeta | null => {
  if (!hasChangePattern(log.data)) return null;

  return {
    severity: log.level ?? "info",
    shouldExpand: true, // Always expand change logs to show diff
  };
};
