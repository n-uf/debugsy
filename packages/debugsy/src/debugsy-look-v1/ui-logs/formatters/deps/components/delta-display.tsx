"use client";

import React from "react";
import { SHARED_TOKENS } from "../../shared-tokens";
import type { DeltaInfo } from "../utils";
import { formatDelta, getImpactColor } from "../utils";

/**
 * Compact delta display component
 */
export const DeltaDisplay: React.FC<{
  delta: DeltaInfo;
  showMetrics?: boolean;
}> = React.memo(({ delta, showMetrics = true }) => {
  const impactColor = getImpactColor(delta.impact);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SHARED_TOKENS.spacing.sm,
        padding: SHARED_TOKENS.spacing.xs,
        backgroundColor: `${impactColor}15`,
        border: `1px solid ${impactColor}40`,
        borderRadius: "3px",
        fontSize: "9px",
        fontFamily: SHARED_TOKENS.fonts.mono,
        marginTop: SHARED_TOKENS.spacing.xs,
      }}
    >
      {/* Delta indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "4px",
          minWidth: "60px",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            backgroundColor: impactColor,
            boxShadow: `0 0 0 2px ${impactColor}30`,
          }}
        />
        <span
          style={{
            color: impactColor,
            fontWeight: "600",
            fontSize: "8px",
          }}
        >
          {formatDelta(delta)}
        </span>
      </div>

      {/* Type badge */}
      <div
        style={{
          backgroundColor: SHARED_TOKENS.colors.bgSecondary,
          color: SHARED_TOKENS.colors.textMuted,
          fontSize: "7px",
          padding: `1px ${SHARED_TOKENS.spacing.xs}`,
          borderRadius: "2px",
          textTransform: "uppercase",
          fontWeight: "500",
        }}
      >
        {delta.type}
      </div>

      {/* Description */}
      <span
        style={{
          color: SHARED_TOKENS.colors.textSecondary,
          fontSize: "8px",
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {delta.description}
      </span>

      {/* Performance impact (if significant) */}
      {showMetrics &&
        delta.metrics?.performanceImpact &&
        delta.metrics.performanceImpact !== "minimal" && (
          <div
            style={{
              backgroundColor:
                delta.metrics.performanceImpact === "significant"
                  ? "#ef444415"
                  : "#f59e0b15",
              color:
                delta.metrics.performanceImpact === "significant"
                  ? "#ef4444"
                  : "#f59e0b",
              fontSize: "7px",
              padding: `1px ${SHARED_TOKENS.spacing.xs}`,
              borderRadius: "2px",
              fontWeight: "600",
            }}
          >
            {delta.metrics.performanceImpact === "significant"
              ? "⚡HIGH"
              : "⚠️MOD"}
          </div>
        )}
    </div>
  );
});

DeltaDisplay.displayName = "DeltaDisplay";

/**
 * Simplified delta summary for multiple changes
 */
export const DeltaSummary: React.FC<{
  deltas: DeltaInfo[];
}> = React.memo(({ deltas }) => {
  if (deltas.length === 0) return null;

  const impactCounts = {
    high: deltas.filter((d) => d.impact === "high").length,
    medium: deltas.filter((d) => d.impact === "medium").length,
    low: deltas.filter((d) => d.impact === "low").length,
  };

  const performanceImpact = deltas.some(
    (d) => d.metrics?.performanceImpact === "significant"
  )
    ? "significant"
    : deltas.some((d) => d.metrics?.performanceImpact === "moderate")
      ? "moderate"
      : "minimal";

  // Check for frequent changes specifically
  const frequentChanges = deltas.filter((d) => d.impact === "high").length;

  // Only show if there are meaningful impacts to highlight
  const hasSignificantImpacts =
    impactCounts.high > 0 ||
    impactCounts.medium > 0 ||
    performanceImpact !== "minimal";

  if (!hasSignificantImpacts) return null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: SHARED_TOKENS.spacing.sm,
        padding: SHARED_TOKENS.spacing.sm,
        backgroundColor:
          impactCounts.high > 0
            ? "#ef444410"
            : SHARED_TOKENS.colors.bgSecondary,
        border: `1px solid ${impactCounts.high > 0 ? "#ef444440" : SHARED_TOKENS.colors.border}`,
        borderRadius: "3px",
        fontSize: "8px",
        fontFamily: SHARED_TOKENS.fonts.mono,
        marginBottom: SHARED_TOKENS.spacing.sm,
      }}
    >
      {/* Impact summary - only show significant ones */}
      {impactCounts.high > 0 && (
        <div
          style={{
            color: "#ef4444",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          🔴 {impactCounts.high} frequent
        </div>
      )}

      {impactCounts.medium > 0 && (
        <div
          style={{
            color: "#f59e0b",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "3px",
          }}
        >
          🟡 {impactCounts.medium} unstable
        </div>
      )}

      {/* Performance warning - only for significant impacts */}
      {performanceImpact !== "minimal" && (
        <div
          style={{
            backgroundColor:
              performanceImpact === "significant" ? "#ef444415" : "#f59e0b15",
            color: performanceImpact === "significant" ? "#ef4444" : "#f59e0b",
            padding: `2px ${SHARED_TOKENS.spacing.xs}`,
            borderRadius: "2px",
            fontWeight: "600",
            fontSize: "7px",
            textTransform: "uppercase",
          }}
        >
          ⚡ {performanceImpact} perf impact
        </div>
      )}
    </div>
  );
});

DeltaSummary.displayName = "DeltaSummary";
