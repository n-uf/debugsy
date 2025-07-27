"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import { SHARED_TOKENS } from "../../shared-tokens";
import { COMPACT_JSON_STYLE } from "../constants";
import { getEnhancedObjectDisplay } from "../utils";

/**
 * Enhanced fallback value renderer for dependency changes
 * Shows value preview with type information
 */
export const CompactValueRenderer: React.FC<{
  value: any;
  label: string;
  type: "old" | "new";
}> = React.memo(({ value, label, type }) => {
  const isOld = type === "old";
  const color = isOld
    ? SHARED_TOKENS.colors.removed
    : SHARED_TOKENS.colors.added;

  const isComplex = typeof value === "object" && value !== null;

  // Get enhanced display info for preview
  const enhanced = useMemo(() => getEnhancedObjectDisplay(value), [value]);

  // Memoize JsonView props for complex objects
  const jsonViewProps = useMemo(() => {
    if (!isComplex) return null;

    return {
      src: value,
      style: COMPACT_JSON_STYLE,
      collapsed: 1,
      displaySize: false,
      enableClipboard: false,
      theme: "default" as const,
    };
  }, [value, isComplex]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: SHARED_TOKENS.spacing.xs,
        fontSize: "10px",
        marginLeft: SHARED_TOKENS.spacing.sm,
        marginBottom: SHARED_TOKENS.spacing.sm,
      }}
    >
      {/* Enhanced label with type preview */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SHARED_TOKENS.spacing.xs,
        }}
      >
        <span
          style={{
            color: color,
            fontWeight: "600",
            fontSize: "8px",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}:
        </span>

        {/* Type badge with preview */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {enhanced.badge && (
            <span style={{ fontSize: "9px" }}>{enhanced.badge}</span>
          )}
          <span
            style={{
              color: SHARED_TOKENS.colors.textMuted,
              fontSize: "7px",
              textTransform: "uppercase",
              fontWeight: "500",
            }}
          >
            {enhanced.type}
          </span>
        </div>

        {/* Quick preview for simple values */}
        {!isComplex && enhanced.display.length < 30 && (
          <span
            style={{
              color: SHARED_TOKENS.colors.textSecondary,
              fontSize: "8px",
              fontFamily: SHARED_TOKENS.fonts.mono,
              fontStyle: "italic",
              opacity: 0.8,
            }}
          >
            {enhanced.display}
          </span>
        )}
      </div>

      {/* Value display - only show detailed view for complex objects */}
      {isComplex && (
        <div
          style={{
            background: SHARED_TOKENS.colors.bgSecondary,
            border: `1px solid ${SHARED_TOKENS.colors.border}`,
            borderRadius: "3px",
            padding: SHARED_TOKENS.spacing.sm,
            marginLeft: SHARED_TOKENS.spacing.md,
          }}
        >
          <JsonView {...jsonViewProps!} />
        </div>
      )}
    </div>
  );
});

CompactValueRenderer.displayName = "CompactValueRenderer";
