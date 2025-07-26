"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import {
  createObjectDiff,
  getDiffSummary,
  type DiffEntry,
} from "../../../../shared/object-depth-utils";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { safeJsonStringify } from "../utils/json/json-utilities";
import { type LogSeverity } from "./default-log-formatter";
import { formatTime } from "./health-expansion-formatter";

// Engineering-focused design constants
const ENGINEERING_TOKENS = {
  spacing: {
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "8px",
  },

  colors: {
    // Terminal-like colors
    bg: "#0d1117",
    bgSecondary: "#161b22",
    border: "#30363d",

    // Status colors
    added: "#28a745",
    removed: "#d73a49",
    changed: "#fb8500",

    // Text colors
    text: "#f0f6fc",
    textSecondary: "#8b949e",
    textMuted: "#6e7681",
    accent: "#58a6ff",
  },

  fonts: {
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
  },
} as const;

// Compact JsonView styling
const COMPACT_JSON_STYLE = {
  fontFamily: ENGINEERING_TOKENS.fonts.mono,
  fontSize: "11px",
  backgroundColor: "transparent",
} as const;

/**
 * Enhanced trackable object display with modern formatting
 */
const getEnhancedObjectDisplay = (
  value: any
): { display: string; type: string; badge?: string } => {
  if (value === null) return { display: "null", type: "null" };
  if (value === undefined) return { display: "undefined", type: "undefined" };

  if (typeof value === "object") {
    try {
      // Arrays with enhanced display
      if (Array.isArray(value)) {
        const badge = value.length > 10 ? "🔢" : value.length > 0 ? "📋" : "📄";
        return {
          display: `Array(${value.length})`,
          type: "array",
          badge,
        };
      }

      // Constructor-based objects with type badges
      const constructorName = value.constructor?.name;
      if (constructorName && constructorName !== "Object") {
        const badge =
          constructorName === "HTMLElement"
            ? "🌐"
            : constructorName.includes("Fiber")
              ? "⚛️"
              : constructorName === "Date"
                ? "📅"
                : constructorName === "Map"
                  ? "🗺️"
                  : constructorName === "Set"
                    ? "📦"
                    : "🏗️";
        return {
          display: `${constructorName}{}`,
          type: "constructor",
          badge,
        };
      }

      // Enhanced plain objects
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return { display: "{}", type: "object", badge: "📄" };
      } else if (keys.length <= 3) {
        return {
          display: `{${keys.join(", ")}}`,
          type: "object",
          badge: "📋",
        };
      } else {
        return {
          display: `{${keys.slice(0, 3).join(", ")}, +${keys.length - 3}}`,
          type: "object",
          badge: "📊",
        };
      }
    } catch (error) {
      return { display: "[Object]", type: "unknown", badge: "❓" };
    }
  }

  // Primitive values with type detection
  const type = typeof value;
  const badge =
    type === "string"
      ? "📝"
      : type === "number"
        ? "🔢"
        : type === "boolean"
          ? "✓"
          : "❓";

  return {
    display: String(value),
    type,
    badge,
  };
};

/**
 * Modern dependency log type parsing with enhanced categorization
 */
type EnhancedDependencyLogType =
  | "dependency-change"
  | "function-recreation"
  | "object-recreation"
  | "primitive-change"
  | "render-warning"
  | "circuit-breaker"
  | "emergency-stop"
  | "hook-execution"
  | "unknown";

const parseEnhancedLogType = (
  message: string
): {
  type: EnhancedDependencyLogType;
  icon: string;
  severity: "low" | "medium" | "high" | "critical";
} => {
  if (message.includes("Dependencies changed:"))
    return { type: "dependency-change", icon: "🔄", severity: "medium" };
  if (message.includes("function changed"))
    return { type: "function-recreation", icon: "📝", severity: "low" };
  if (message.includes("object changed"))
    return { type: "object-recreation", icon: "📦", severity: "low" };
  if (message.includes("High render count detected"))
    return { type: "render-warning", icon: "⚠️", severity: "high" };
  if (message.includes("CIRCUIT BREAKER"))
    return { type: "circuit-breaker", icon: "🚨", severity: "critical" };
  if (message.includes("EMERGENCY STOP"))
    return { type: "emergency-stop", icon: "🛑", severity: "critical" };
  if (message.includes("Hook execution"))
    return { type: "hook-execution", icon: "🪝", severity: "medium" };
  if (message.includes("→"))
    return { type: "primitive-change", icon: "🔧", severity: "low" };

  return { type: "unknown", icon: "❓", severity: "low" };
};

/**
 * Compact engineering-focused diff display
 */
const CompactDiffDisplay: React.FC<{
  diffs: DiffEntry[];
  summary: string;
}> = React.memo(({ diffs, summary }) => {
  if (diffs.length === 0) return null;

  return (
    <div
      style={{
        background: ENGINEERING_TOKENS.colors.bgSecondary,
        border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
        borderRadius: "3px",
        padding: ENGINEERING_TOKENS.spacing.md,
        marginTop: ENGINEERING_TOKENS.spacing.sm,
        fontSize: "10px",
        fontFamily: ENGINEERING_TOKENS.fonts.mono,
      }}
    >
      {/* Compact header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ENGINEERING_TOKENS.spacing.sm,
          marginBottom: ENGINEERING_TOKENS.spacing.sm,
          paddingBottom: ENGINEERING_TOKENS.spacing.xs,
          borderBottom: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
        }}
      >
        <span
          style={{
            background: ENGINEERING_TOKENS.colors.accent,
            color: ENGINEERING_TOKENS.colors.text,
            fontSize: "8px",
            fontWeight: "600",
            padding: `1px ${ENGINEERING_TOKENS.spacing.xs}`,
            borderRadius: "2px",
          }}
        >
          DIFF
        </span>
        <span style={{ color: ENGINEERING_TOKENS.colors.textSecondary }}>
          {summary}
        </span>
      </div>

      {/* Compact diff entries */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: ENGINEERING_TOKENS.spacing.xs,
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
              color: ENGINEERING_TOKENS.colors.textMuted,
              fontStyle: "italic",
              textAlign: "center",
              padding: ENGINEERING_TOKENS.spacing.xs,
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
const CompactDiffEntry: React.FC<{ diff: DiffEntry }> = React.memo(
  ({ diff }) => {
    const typeConfig = {
      added: { color: ENGINEERING_TOKENS.colors.added, symbol: "+" },
      removed: { color: ENGINEERING_TOKENS.colors.removed, symbol: "-" },
      changed: { color: ENGINEERING_TOKENS.colors.changed, symbol: "~" },
    };

    const config = typeConfig[diff.type];
    const enhanced = getEnhancedObjectDisplay(diff.from);
    const enhancedTo =
      diff.type !== "removed" ? getEnhancedObjectDisplay(diff.to) : null;

    return (
      <div
        style={{
          fontSize: "9px",
          fontFamily: ENGINEERING_TOKENS.fonts.mono,
          padding: ENGINEERING_TOKENS.spacing.xs,
          background: `${config.color}0a`,
          border: `1px solid ${config.color}30`,
          borderRadius: "2px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: ENGINEERING_TOKENS.spacing.sm,
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
              color: ENGINEERING_TOKENS.colors.accent,
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
              fontSize: "8px",
              color: ENGINEERING_TOKENS.colors.removed,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>old:</span>
            <span>
              {enhanced.badge} {enhanced.display}
            </span>
          </div>
        )}

        {enhancedTo && (
          <div
            style={{
              marginLeft: "12px",
              fontSize: "8px",
              color: ENGINEERING_TOKENS.colors.added,
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>new:</span>
            <span>
              {enhancedTo.badge} {enhancedTo.display}
            </span>
          </div>
        )}
      </div>
    );
  }
);

CompactDiffEntry.displayName = "CompactDiffEntry";

/**
 * Compact value renderer for dependency changes
 */
const CompactValueRenderer: React.FC<{
  value: any;
  label: string;
  type: "old" | "new";
}> = React.memo(({ value, label, type }) => {
  const enhanced = getEnhancedObjectDisplay(value);
  const isOld = type === "old";
  const color = isOld
    ? ENGINEERING_TOKENS.colors.removed
    : ENGINEERING_TOKENS.colors.added;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: ENGINEERING_TOKENS.spacing.sm,
        fontSize: "10px",
        marginLeft: ENGINEERING_TOKENS.spacing.sm,
      }}
    >
      <span
        style={{
          color: color,
          fontWeight: "600",
          fontSize: "8px",
          textTransform: "uppercase",
          minWidth: "28px",
        }}
      >
        {label}:
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: ENGINEERING_TOKENS.spacing.xs,
          flex: 1,
        }}
      >
        {enhanced.badge && (
          <span style={{ fontSize: "10px" }}>{enhanced.badge}</span>
        )}
        <span
          style={{
            color: ENGINEERING_TOKENS.colors.textSecondary,
            fontFamily: ENGINEERING_TOKENS.fonts.mono,
            wordBreak: "break-all",
            fontSize: "9px",
          }}
        >
          {enhanced.display}
        </span>
        <span
          style={{
            background: ENGINEERING_TOKENS.colors.bgSecondary,
            color: ENGINEERING_TOKENS.colors.textMuted,
            fontSize: "7px",
            padding: `1px ${ENGINEERING_TOKENS.spacing.xs}`,
            borderRadius: "2px",
            textTransform: "uppercase",
            border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
          }}
        >
          {enhanced.type}
        </span>
      </div>
    </div>
  );
});

CompactValueRenderer.displayName = "CompactValueRenderer";

/**
 * Modern value display component
 */
const ModernValueDisplay: React.FC<{
  value: any;
  label: string;
  type: "old" | "new";
}> = React.memo(({ value, label, type }) => {
  const enhanced = getEnhancedObjectDisplay(value);
  const isOld = type === "old";
  const color = isOld
    ? ENGINEERING_TOKENS.colors.removed
    : ENGINEERING_TOKENS.colors.added;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: ENGINEERING_TOKENS.spacing.md,
        marginBottom: type === "old" ? ENGINEERING_TOKENS.spacing.sm : 0,
        padding: ENGINEERING_TOKENS.spacing.sm,
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
          gap: ENGINEERING_TOKENS.spacing.xs,
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
          gap: ENGINEERING_TOKENS.spacing.sm,
          flex: 1,
          minWidth: 0,
        }}
      >
        {enhanced.badge && (
          <span style={{ fontSize: "12px" }}>{enhanced.badge}</span>
        )}
        <span
          style={{
            color: ENGINEERING_TOKENS.colors.textSecondary,
            fontSize: "11px",
            fontFamily: ENGINEERING_TOKENS.fonts.mono,
            wordBreak: "break-all",
            lineHeight: "1.4",
          }}
        >
          {enhanced.display}
        </span>
        <div
          style={{
            background: ENGINEERING_TOKENS.colors.bgSecondary,
            color: ENGINEERING_TOKENS.colors.textMuted,
            fontSize: "8px",
            padding: `1px ${ENGINEERING_TOKENS.spacing.xs}`,
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
 * Component name extraction utility
 */
const COMPONENT_NAME_REGEX = /\[([^\]]+)\]/;
const extractComponentName = (message: string): string => {
  const match = message.match(COMPONENT_NAME_REGEX);
  return match?.[1] ?? "Unknown";
};

/**
 * Get dependency log severity
 */
const getDependencySeverity = (log: DebugLogEntry): LogSeverity => {
  return log.level as LogSeverity;
};

/**
 * Format dependency change data
 */
const formatDependencyData = (data: any, logType: string) => {
  if (!data || logType !== "dependency-change" || typeof data !== "object") {
    return data;
  }

  return Object.entries(data)
    .map(([key, change]: [string, any]) => {
      if (
        change &&
        typeof change === "object" &&
        "from" in change &&
        "to" in change
      ) {
        return {
          property: key,
          from: change.from,
          to: change.to,
          type:
            typeof change.from === "function"
              ? "function"
              : typeof change.from === "object"
                ? "object"
                : "primitive",
        };
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Enhanced dependency value renderer (simplified - no diff logic)
 */
const EnhancedDependencyValueRenderer: React.FC<{
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
        marginLeft: ENGINEERING_TOKENS.spacing.lg,
        marginTop: ENGINEERING_TOKENS.spacing.sm,
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
      <div style={{ marginTop: ENGINEERING_TOKENS.spacing.sm }}>
        {isComplex ? (
          <div
            style={{
              marginTop: ENGINEERING_TOKENS.spacing.sm,
              background: ENGINEERING_TOKENS.colors.bgSecondary,
              borderRadius: "4px",
              padding: ENGINEERING_TOKENS.spacing.md,
              border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
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
    const logTypeData = parseEnhancedLogType(log.message);
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
    <div
      style={{ fontFamily: ENGINEERING_TOKENS.fonts.mono, fontSize: "10px" }}
    >
      {/* Compact Component Info */}
      <div
        style={{
          marginBottom: ENGINEERING_TOKENS.spacing.md,
          padding: ENGINEERING_TOKENS.spacing.sm,
          backgroundColor: ENGINEERING_TOKENS.colors.bgSecondary,
          border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
          borderRadius: "3px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "9px",
          }}
        >
          <span
            style={{
              color: ENGINEERING_TOKENS.colors.accent,
              fontWeight: "600",
            }}
          >
            {dependencyMeta.componentName}
          </span>
          <span
            style={{
              color: ENGINEERING_TOKENS.colors.textMuted,
            }}
          >
            {formatTime(log.timestamp)}
          </span>
        </div>
      </div>

      {/* Dependency Changes Detail with JsonView support */}
      {dependencyMeta.logType === "dependency-change" &&
        dependencyMeta.dependencyData &&
        Array.isArray(dependencyMeta.dependencyData) && (
          <div style={{ marginBottom: ENGINEERING_TOKENS.spacing.md }}>
            <div
              style={{
                color: ENGINEERING_TOKENS.colors.accent,
                fontWeight: "600",
                marginBottom: ENGINEERING_TOKENS.spacing.sm,
                fontSize: "10px",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              Changes ({dependencyMeta.dependencyData.length})
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: ENGINEERING_TOKENS.spacing.sm,
              }}
            >
              {dependencyMeta.dependencyData.map((item: any, index: number) => {
                // Calculate diff for this property change (moved outside useMemo)
                const calculateDiff = () => {
                  if (
                    typeof item.from === "object" &&
                    item.from !== null &&
                    typeof item.to === "object" &&
                    item.to !== null
                  ) {
                    const diffs = createObjectDiff(item.from, item.to, 15);
                    if (diffs.length > 0) {
                      return {
                        diffs,
                        summary: getDiffSummary(diffs),
                      };
                    }
                  }
                  return null;
                };

                const diffData = calculateDiff();

                return (
                  <div
                    key={index}
                    style={{
                      background: ENGINEERING_TOKENS.colors.bgSecondary,
                      border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
                      borderRadius: "3px",
                      padding: ENGINEERING_TOKENS.spacing.md,
                      marginBottom: ENGINEERING_TOKENS.spacing.sm,
                      fontSize: "10px",
                      fontFamily: ENGINEERING_TOKENS.fonts.mono,
                    }}
                  >
                    {/* Compact Property Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: ENGINEERING_TOKENS.spacing.sm,
                        marginBottom: ENGINEERING_TOKENS.spacing.sm,
                        paddingBottom: ENGINEERING_TOKENS.spacing.xs,
                        borderBottom: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
                      }}
                    >
                      <span
                        style={{
                          fontSize: "12px",
                          color: (() => {
                            switch (item.type) {
                              case "function":
                                return ENGINEERING_TOKENS.colors.changed;
                              case "object":
                                return ENGINEERING_TOKENS.colors.accent;
                              default:
                                return ENGINEERING_TOKENS.colors.textSecondary;
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
                          color: ENGINEERING_TOKENS.colors.text,
                        }}
                      >
                        {item.property}
                      </span>
                      <span
                        style={{
                          fontSize: "8px",
                          color: ENGINEERING_TOKENS.colors.textMuted,
                          textTransform: "uppercase",
                        }}
                      >
                        {item.type}
                      </span>
                    </div>

                    {/* Diff Display */}
                    {diffData && (
                      <CompactDiffDisplay
                        diffs={diffData.diffs}
                        summary={diffData.summary}
                      />
                    )}

                    {/* Compact From/To Values */}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: ENGINEERING_TOKENS.spacing.xs,
                        marginTop: diffData ? ENGINEERING_TOKENS.spacing.sm : 0,
                      }}
                    >
                      <CompactValueRenderer
                        value={item.from}
                        label="from"
                        type="old"
                      />
                      <CompactValueRenderer
                        value={item.to}
                        label="to"
                        type="new"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      {/* Raw Data for non-dependency-change types with JsonView */}
      {log.data && dependencyMeta.logType !== "dependency-change" && (
        <div style={{ marginBottom: ENGINEERING_TOKENS.spacing.md }}>
          <div
            style={{
              color: ENGINEERING_TOKENS.colors.accent,
              fontWeight: "600",
              marginBottom: ENGINEERING_TOKENS.spacing.sm,
              fontSize: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Data
          </div>
          <div
            style={{
              backgroundColor: ENGINEERING_TOKENS.colors.bgSecondary,
              padding: ENGINEERING_TOKENS.spacing.sm,
              borderRadius: "3px",
              border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
              fontFamily: ENGINEERING_TOKENS.fonts.mono,
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
                  color: ENGINEERING_TOKENS.colors.text,
                  fontSize: "9px",
                }}
              >
                {safeJsonStringify(log.data, undefined, 2)}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* MIGRATED: Updated condition to use JsonUtils.isComplex */}
      {displayStrategy.isComplex && (
        <div
          style={{
            fontSize: "8px",
            color: ENGINEERING_TOKENS.colors.textMuted,
            fontStyle: "italic",
            marginTop: ENGINEERING_TOKENS.spacing.sm,
            padding: ENGINEERING_TOKENS.spacing.xs,
            border: `1px solid ${ENGINEERING_TOKENS.colors.border}`,
            borderRadius: "2px",
            background: ENGINEERING_TOKENS.colors.bgSecondary,
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
 * Compact engineering-focused help message component
 */
const CompactHelpMessage: React.FC<{ logType: EnhancedDependencyLogType }> =
  React.memo(({ logType }) => {
    // Memoize help content based on log type
    const helpContent = useMemo(() => {
      switch (logType) {
        case "function-recreation":
        case "object-recreation":
          return {
            color: ENGINEERING_TOKENS.colors.added,
            icon: "ℹ",
            text: "🚀📋 = Normal init. ⚠️ FREQUENT = Consider useCallback/useMemo.",
          };

        case "render-warning":
          return {
            color: ENGINEERING_TOKENS.colors.changed,
            icon: "⚠",
            text: "High render frequency detected. Check dependencies.",
          };

        case "circuit-breaker":
          return {
            color: ENGINEERING_TOKENS.colors.removed,
            icon: "🚨",
            text: "Circuit breaker active. Auto-restore pending.",
          };

        case "emergency-stop":
          return {
            color: ENGINEERING_TOKENS.colors.removed,
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
          marginTop: ENGINEERING_TOKENS.spacing.sm,
          padding: ENGINEERING_TOKENS.spacing.sm,
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
            marginRight: ENGINEERING_TOKENS.spacing.xs,
          }}
        >
          {helpContent.icon}
        </span>
        <span style={{ color: ENGINEERING_TOKENS.colors.textSecondary }}>
          {helpContent.text}
        </span>
      </div>
    );
  });

CompactHelpMessage.displayName = "CompactHelpMessage";

/**
 * OPTIMIZED: Get dependency log metadata for external use
 * Used by DefaultLogFormatter to determine severity and expand behavior
 */
export const getDependencyLogMeta = (log: DebugLogEntry) => {
  if (log.point !== "dependencies") {
    return null;
  }

  const logTypeData = parseEnhancedLogType(log.message);
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
    require("./default-log-formatter").DefaultLogFormatter;

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
