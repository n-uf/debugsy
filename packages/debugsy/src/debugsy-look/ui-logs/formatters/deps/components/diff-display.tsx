"use client";

import React from "react";
import type { DiffEntry } from "../../../../../debugsy-shared/object-depth-utils";
import { SHARED_TOKENS } from "../../shared-tokens";
import { getEnhancedObjectDisplay } from "../utils";

/**
 * Compact engineering-focused diff display
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
        background: SHARED_TOKENS.colors.bgSecondary,
        border: `1px solid ${SHARED_TOKENS.colors.border}`,
        borderRadius: "3px",
        padding: SHARED_TOKENS.spacing.md,
        marginTop: SHARED_TOKENS.spacing.sm,
        fontSize: "10px",
        fontFamily: SHARED_TOKENS.fonts.mono,
      }}
    >
      {/* Compact header */}
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
            background: SHARED_TOKENS.colors.accent,
            color: SHARED_TOKENS.colors.text,
            fontSize: "8px",
            fontWeight: "600",
            padding: `1px ${SHARED_TOKENS.spacing.xs}`,
            borderRadius: "2px",
          }}
        >
          DIFF
        </span>
        <span style={{ color: SHARED_TOKENS.colors.textSecondary }}>
          {summary}
        </span>
      </div>

      {/* Compact diff entries */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: SHARED_TOKENS.spacing.xs,
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
              color: SHARED_TOKENS.colors.textMuted,
              fontStyle: "italic",
              textAlign: "center",
              padding: SHARED_TOKENS.spacing.xs,
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
      added: { color: SHARED_TOKENS.colors.added, symbol: "+" },
      removed: { color: SHARED_TOKENS.colors.removed, symbol: "-" },
      changed: { color: SHARED_TOKENS.colors.changed, symbol: "~" },
    };

    const config = typeConfig[diff.type];
    const enhanced = getEnhancedObjectDisplay(diff.from);
    const enhancedTo =
      diff.type !== "removed" ? getEnhancedObjectDisplay(diff.to) : null;

    return (
      <div
        style={{
          fontSize: "9px",
          fontFamily: SHARED_TOKENS.fonts.mono,
          padding: SHARED_TOKENS.spacing.xs,
          background: `${config.color}0a`,
          border: `1px solid ${config.color}30`,
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SHARED_TOKENS.spacing.sm,
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
              color: SHARED_TOKENS.colors.accent,
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
              color: SHARED_TOKENS.colors.removed,
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
              color: SHARED_TOKENS.colors.added,
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
