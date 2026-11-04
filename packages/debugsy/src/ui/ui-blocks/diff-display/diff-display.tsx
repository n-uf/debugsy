import React from "react";
import type { DiffEntry } from "../../utils/diff-utils";
import { getEnhancedObjectDisplay } from "../../utils/object-display-utils";

/**
 * Colors for diff visualization (harmonized with terminal theme)
 */
const DIFF_COLORS = {
  added: "#10b981", // Emerald green
  removed: "#ef4444", // Red
  changed: "#f59e0b", // Amber
  text: "#d1d5db", // Light gray
  textSecondary: "#9ca3af", // Muted gray
  border: "#374151", // Dark gray
  bgSecondary: "rgba(31, 41, 55, 0.5)", // Very dark gray with transparency
};

/**
 * Compact engineering-focused diff display component
 */
export const CompactDiffDisplay: React.FC<{
  diffs: DiffEntry[];
  summary: string;
}> = React.memo(({ diffs, summary }) => {
  if (diffs.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        background: DIFF_COLORS.bgSecondary,
        border: `1px solid ${DIFF_COLORS.border}`,
        borderRadius: "3px",
        padding: "8px",
        marginTop: "6px",
        fontSize: "10px",
        fontFamily: "monospace",
      }}
    >
      {/* Compact header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "6px",
          paddingBottom: "4px",
          borderBottom: `1px solid ${DIFF_COLORS.border}`,
        }}
      >
        <span
          style={{
            background: DIFF_COLORS.changed,
            color: "#000",
            fontSize: "8px",
            fontWeight: "600",
            padding: "1px 4px",
            borderRadius: "2px",
          }}
        >
          DIFF
        </span>
        <span style={{ color: DIFF_COLORS.textSecondary }}>{summary}</span>
      </div>

      {/* Compact diff entries */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          maxHeight: "120px",
          overflowY: "auto",
        }}
      >
        {diffs.slice(0, 8).map((diff, idx) => (
          <CompactDiffEntry key={idx} diff={diff} />
        ))}

        {diffs.length > 8 && (
          <div
            style={{
              fontSize: "8px",
              color: DIFF_COLORS.textSecondary,
              fontStyle: "italic",
              textAlign: "center",
              padding: "4px",
            }}
          >
            +{diffs.length - 8} more changes
          </div>
        )}
      </div>
    </div>
  );
});

CompactDiffDisplay.displayName = "CompactDiffDisplay";

/**
 * Compact engineering-focused diff entry
 */
export const CompactDiffEntry: React.FC<{ diff: DiffEntry }> = React.memo(
  ({ diff }) => {
    const typeConfig = {
      added: { color: DIFF_COLORS.added, symbol: "+" },
      removed: { color: DIFF_COLORS.removed, symbol: "-" },
      changed: { color: DIFF_COLORS.changed, symbol: "~" },
    };

    const config = typeConfig[diff.type];
    const enhanced = getEnhancedObjectDisplay(diff.from);
    const enhancedTo =
      diff.type !== "removed" ? getEnhancedObjectDisplay(diff.to) : null;

    return (
      <div
        style={{
          fontSize: "9px",
          fontFamily: "monospace",
          padding: "4px",
          background: `${config.color}0a`,
          border: `1px solid ${config.color}30`,
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span
            style={{
              color: config.color,
              fontWeight: "bold",
              minWidth: "8px",
            }}
          >
            {config.symbol}
          </span>
          <span
            style={{
              color: DIFF_COLORS.changed,
              fontWeight: "500",
            }}
          >
            {diff.key}
          </span>
        </div>

        {/* Compact value display */}
        {diff.type !== "added" && (
          <div
            style={{
              marginLeft: "12px",
              fontSize: "9px",
              color: DIFF_COLORS.removed,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>old:</span>
            <span>{enhanced.display}</span>
          </div>
        )}

        {enhancedTo && (
          <div
            style={{
              marginLeft: "12px",
              fontSize: "9px",
              color: DIFF_COLORS.added,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>new:</span>
            <span>{enhancedTo.display}</span>
          </div>
        )}
      </div>
    );
  }
);

CompactDiffEntry.displayName = "CompactDiffEntry";
