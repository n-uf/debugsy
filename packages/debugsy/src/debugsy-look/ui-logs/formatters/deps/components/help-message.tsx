"use client";

import React, { useMemo } from "react";
import type { DependencyLogType } from "../../../../../debugsy-shared/debug-point-config";
import { SHARED_TOKENS } from "../../shared-tokens";

/**
 * Compact engineering-focused help message component
 */
export const CompactHelpMessage: React.FC<{
  logType: DependencyLogType | "unknown";
}> = React.memo(({ logType }) => {
  // Memoize help content based on log type
  const helpContent = useMemo(() => {
    switch (logType) {
      case "function-recreation":
      case "object-recreation":
        return {
          color: SHARED_TOKENS.colors.added,
          icon: "ℹ",
          text: "🚀📋 = Normal init. ⚠️ FREQUENT = Consider useCallback/useMemo.",
        };

      case "render-warning":
        return {
          color: SHARED_TOKENS.colors.changed,
          icon: "⚠",
          text: "High render frequency detected. Check dependencies.",
        };

      case "circuit-breaker":
        return {
          color: SHARED_TOKENS.colors.removed,
          icon: "🚨",
          text: "Circuit breaker active. Auto-restore pending.",
        };

      case "emergency-stop":
        return {
          color: SHARED_TOKENS.colors.removed,
          icon: "🛑",
          text: "Emergency stop triggered. Check component logic.",
        };

      default:
        return null;
    }
  }, [logType]);

  if (!helpContent) return null;

  return (
    <div
      style={{
        marginTop: SHARED_TOKENS.spacing.sm,
        padding: SHARED_TOKENS.spacing.sm,
        backgroundColor: `${helpContent.color}10`,
        border: `1px solid ${helpContent.color}30`,
        borderRadius: "2px",
        fontSize: "8px",
      }}
    >
      <span
        style={{
          color: helpContent.color,
          fontWeight: "600",
          marginRight: SHARED_TOKENS.spacing.xs,
        }}
      >
        {helpContent.icon}
      </span>
      <span style={{ color: SHARED_TOKENS.colors.textSecondary }}>
        {helpContent.text}
      </span>
    </div>
  );
});

CompactHelpMessage.displayName = "CompactHelpMessage";
