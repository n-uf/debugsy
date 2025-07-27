"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import { SHARED_TOKENS } from "../../shared-tokens";
import { COMPACT_JSON_STYLE } from "../constants";
import { getEnhancedObjectDisplay } from "../utils";

/**
 * Compact value renderer for dependency changes
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
      {/* Clean label without emojis */}
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

      {/* Value display using JsonView for complex objects */}
      <div
        style={{
          background: SHARED_TOKENS.colors.bgSecondary,
          border: `1px solid ${SHARED_TOKENS.colors.border}`,
          borderRadius: "3px",
          padding: SHARED_TOKENS.spacing.sm,
          marginLeft: SHARED_TOKENS.spacing.md,
        }}
      >
        {isComplex ? (
          <JsonView {...jsonViewProps!} />
        ) : (
          <span
            style={{
              color: SHARED_TOKENS.colors.textSecondary,
              fontFamily: SHARED_TOKENS.fonts.mono,
              fontSize: "9px",
            }}
          >
            {String(value)}
          </span>
        )}
      </div>
    </div>
  );
});

CompactValueRenderer.displayName = "CompactValueRenderer";

/**
 * Modern value display component
 */
export const ModernValueDisplay: React.FC<{
  value: any;
  label: string;
  type: "old" | "new";
}> = React.memo(({ value, label, type }) => {
  const enhanced = getEnhancedObjectDisplay(value);
  const isOld = type === "old";
  const color = isOld
    ? SHARED_TOKENS.colors.removed
    : SHARED_TOKENS.colors.added;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: SHARED_TOKENS.spacing.md,
        marginBottom: type === "old" ? SHARED_TOKENS.spacing.sm : 0,
        padding: SHARED_TOKENS.spacing.sm,
        background: `${color}08`,
        borderRadius: "4px",
        border: `1px solid ${color}20`,
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SHARED_TOKENS.spacing.xs,
          minWidth: "60px",
        }}
      >
        <div
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: color,
            boxShadow: `0 0 0 2px ${color}30`,
          }}
        />
        <span
          style={{
            color: color,
            fontSize: "9px",
            fontWeight: "600",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
          }}
        >
          {label}
        </span>
      </div>

      {/* Value with badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: SHARED_TOKENS.spacing.sm,
          flex: 1,
          minWidth: 0,
        }}
      >
        {enhanced.badge && (
          <span style={{ fontSize: "10px" }}>{enhanced.badge}</span>
        )}
        <span
          style={{
            color: SHARED_TOKENS.colors.textSecondary,
            fontSize: "11px",
            fontFamily: SHARED_TOKENS.fonts.mono,
            wordBreak: "break-all",
            lineHeight: "1.4",
          }}
        >
          {enhanced.display}
        </span>
        <div
          style={{
            background: SHARED_TOKENS.colors.bgSecondary,
            color: SHARED_TOKENS.colors.textMuted,
            fontSize: "8px",
            padding: `1px ${SHARED_TOKENS.spacing.xs}`,
            borderRadius: "2px",
            textTransform: "uppercase",
            fontWeight: "500",
          }}
        >
          {enhanced.type}
        </div>
      </div>
    </div>
  );
});

ModernValueDisplay.displayName = "ModernValueDisplay";

/**
 * Enhanced dependency value renderer (simplified - no diff logic)
 */
export const EnhancedDependencyValueRenderer: React.FC<{
  value: any;
  label: string;
  labelColor: string;
  showDiff?: boolean; // Kept for compatibility but not used
}> = React.memo(({ value, label, labelColor }) => {
  // Memoize JsonView props for complex objects
  const jsonViewProps = useMemo(() => {
    const shouldUseJsonView = typeof value === "object" && value !== null;
    if (!shouldUseJsonView) return null;

    return {
      src: value,
      style: COMPACT_JSON_STYLE,
      collapsed: 1,
      displaySize: false,
      enableClipboard: false,
      theme: "default" as const,
    };
  }, [value]);

  const isComplex = typeof value === "object" && value !== null;

  return (
    <div
      style={{
        marginLeft: SHARED_TOKENS.spacing.lg,
        marginTop: SHARED_TOKENS.spacing.sm,
      }}
    >
      <span
        style={{
          color: labelColor,
          fontWeight: "bold",
          fontSize: "10px",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        {label}:
      </span>

      {/* Value display only - no diff */}
      <div style={{ marginTop: SHARED_TOKENS.spacing.sm }}>
        {isComplex ? (
          <div
            style={{
              marginTop: SHARED_TOKENS.spacing.sm,
              background: SHARED_TOKENS.colors.bgSecondary,
              borderRadius: "4px",
              padding: SHARED_TOKENS.spacing.md,
              border: `1px solid ${SHARED_TOKENS.colors.border}`,
            }}
          >
            <JsonView {...jsonViewProps!} />
          </div>
        ) : (
          <ModernValueDisplay
            value={value}
            label="Value"
            type={label === "from" ? "old" : "new"}
          />
        )}
      </div>
    </div>
  );
});

EnhancedDependencyValueRenderer.displayName = "EnhancedDependencyValueRenderer";
