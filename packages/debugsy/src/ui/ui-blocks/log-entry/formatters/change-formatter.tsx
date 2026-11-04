/**
 * Change formatter - displays object diffs for from/to patterns
 * Detects change tracking logs and shows detailed diffs. Styled by the
 * panel's own stylesheet (`dbg-diff-*`, `.dbg-root .json-view`).
 */

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import superjson from "superjson";
import { calculateDelta, formatDelta } from "../../../utils/delta-utils";
import { createObjectDiff, getDiffSummary } from "../../../utils/diff-utils";
import { getEnhancedObjectDisplay } from "../../../utils/object-display-utils";
import { CompactDiffDisplay } from "../../diff-display/diff-display";
import type { ExpansionContentProps, FormatterMeta } from "./formatter-types";

/**
 * One side of a from/to pair: label, type badge, type name and value
 */
const ChangeValueLine: React.FC<{
  kind: "old" | "new";
  label: string;
  value: unknown;
}> = ({ kind, label, value }) => {
  const display = getEnhancedObjectDisplay(value);
  return (
    <div className="dbg-diff-line" data-kind={kind}>
      <span className="dbg-diff-label">{label}</span>
      {display.badge && <span>{display.badge}</span>}
      <span className="dbg-diff-type">{display.type}</span>
      <span className="dbg-diff-value">{display.display}</span>
    </div>
  );
};

/**
 * Change expansion content - shows diffs + full JSON
 */
export const ChangeExpansionContent: React.FC<ExpansionContentProps> = ({
  log,
}) => {
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
    <div className="dbg-log-expand">
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
            <div key={idx} className="dbg-diff-prop">
              {propertyDiff.propertyKey !== "[root]" && (
                <div className="dbg-diff-prophead">
                  <span className="dbg-diff-propname">
                    {propertyDiff.propertyKey}
                  </span>

                  {/* Frequency tracking badge */}
                  {tracking && (
                    <span
                      className="dbg-diff-meta"
                      data-hot={tracking.isFrequent ? "true" : undefined}
                    >
                      (#{tracking.count}){tracking.isFrequent && " FREQUENT"}
                    </span>
                  )}

                  {/* Delta display */}
                  {delta && (
                    <span className="dbg-diff-impact" data-impact={delta.impact}>
                      {formatDelta(delta)}
                    </span>
                  )}

                  {/* Performance impact badge */}
                  {delta?.metrics?.performanceImpact &&
                    delta.metrics.performanceImpact !== "minimal" && (
                      <span
                        className="dbg-diff-perf"
                        data-level={delta.metrics.performanceImpact}
                      >
                        {delta.metrics.performanceImpact === "significant"
                          ? "HIGH"
                          : "MOD"}
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
                <div className="dbg-diff-detail">
                  {/* Delta type badge */}
                  <div className="dbg-diff-detailhead">
                    <span className="dbg-diff-impact" data-impact={delta.impact}>
                      {formatDelta(delta)}
                    </span>
                    <span className="dbg-diff-kind">{delta.type}</span>
                    <span className="dbg-diff-desc">{delta.description}</span>
                  </div>

                  {/* FROM/TO values with type badges */}
                  {change.from !== change.to && (
                    <div className="dbg-diff-lines">
                      <ChangeValueLine
                        kind="old"
                        label="from"
                        value={change.from}
                      />
                      <ChangeValueLine kind="new" label="to" value={change.to} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

      {/* JSON View - Shows full data structure */}
      <div className="dbg-json">
        <JsonView
          src={jsonViewData.safeData}
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
