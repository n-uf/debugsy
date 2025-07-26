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

// Modern design system constants
const DESIGN_TOKENS = {
  colors: {
    primary: "#3b82f6",
    secondary: "#8b5cf6",
    success: "#10b981",
    warning: "#f59e0b",
    error: "#ef4444",
    info: "#06b6d4",

    // Semantic colors
    added: "#22c55e",
    removed: "#ef4444",
    changed: "#f59e0b",

    // Surface colors
    surface: {
      primary: "#0f172a",
      secondary: "#1e293b",
      tertiary: "#334155",
      elevated: "#475569",
    },

    // Text colors
    text: {
      primary: "#f8fafc",
      secondary: "#cbd5e1",
      tertiary: "#94a3b8",
      accent: "#60a5fa",
    },

    // Border colors
    border: {
      subtle: "#334155",
      default: "#475569",
      emphasis: "#64748b",
    },
  },

  spacing: {
    xs: "2px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    "2xl": "20px",
    "3xl": "24px",
  },

  borderRadius: {
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  },
} as const;

// High-end JsonView styling
const MODERN_JSON_VIEW_STYLE = {
  fontFamily:
    "'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace",
  fontSize: "12px",
  backgroundColor: "transparent",
  borderRadius: DESIGN_TOKENS.borderRadius.md,
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
 * Enhanced diff component with modern design
 */
const ModernDiffDisplay: React.FC<{
  diffs: DiffEntry[];
  summary: string;
}> = React.memo(({ diffs, summary }) => {
  if (diffs.length === 0) return null;

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.surface.secondary}22 0%, ${DESIGN_TOKENS.colors.surface.tertiary}11 100%)`,
        border: `1px solid ${DESIGN_TOKENS.colors.border.default}`,
        borderRadius: DESIGN_TOKENS.borderRadius.lg,
        padding: DESIGN_TOKENS.spacing.lg,
        marginTop: DESIGN_TOKENS.spacing.md,
        boxShadow: DESIGN_TOKENS.shadows.md,
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Header with summary */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: DESIGN_TOKENS.spacing.md,
          marginBottom: DESIGN_TOKENS.spacing.lg,
          paddingBottom: DESIGN_TOKENS.spacing.md,
          borderBottom: `1px solid ${DESIGN_TOKENS.colors.border.subtle}`,
        }}
      >
        <div
          style={{
            background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.info} 0%, ${DESIGN_TOKENS.colors.secondary} 100%)`,
            borderRadius: DESIGN_TOKENS.borderRadius.md,
            padding: `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.sm}`,
            fontSize: "10px",
            fontWeight: "600",
            color: DESIGN_TOKENS.colors.text.primary,
            boxShadow: DESIGN_TOKENS.shadows.sm,
          }}
        >
          📊 DIFF
        </div>
        <span
          style={{
            color: DESIGN_TOKENS.colors.text.secondary,
            fontSize: "11px",
            fontWeight: "500",
          }}
        >
          {summary}
        </span>
      </div>

      {/* Diff entries */}
      <div
        style={{
          display: "grid",
          gap: DESIGN_TOKENS.spacing.md,
          maxHeight: "200px",
          overflowY: "auto",
          overflowX: "hidden",
        }}
      >
        {diffs.slice(0, 12).map((diff, idx) => (
          <ModernDiffEntry key={idx} diff={diff} />
        ))}

        {diffs.length > 12 && (
          <div
            style={{
              textAlign: "center",
              padding: DESIGN_TOKENS.spacing.md,
              background: DESIGN_TOKENS.colors.surface.secondary,
              borderRadius: DESIGN_TOKENS.borderRadius.md,
              border: `1px dashed ${DESIGN_TOKENS.colors.border.subtle}`,
              color: DESIGN_TOKENS.colors.text.tertiary,
              fontSize: "10px",
              fontStyle: "italic",
            }}
          >
            +{diffs.length - 12} more changes (expand full view for complete
            diff)
          </div>
        )}
      </div>
    </div>
  );
});

ModernDiffDisplay.displayName = "ModernDiffDisplay";

/**
 * Individual diff entry with enhanced styling
 */
const ModernDiffEntry: React.FC<{ diff: DiffEntry }> = React.memo(
  ({ diff }) => {
    const changeTypeConfig = {
      added: { color: DESIGN_TOKENS.colors.added, icon: "➕", label: "ADD" },
      removed: {
        color: DESIGN_TOKENS.colors.removed,
        icon: "➖",
        label: "DEL",
      },
      changed: {
        color: DESIGN_TOKENS.colors.changed,
        icon: "🔄",
        label: "MOD",
      },
    };

    const config = changeTypeConfig[diff.type];

    return (
      <div
        style={{
          background: `${config.color}08`,
          border: `1px solid ${config.color}30`,
          borderRadius: DESIGN_TOKENS.borderRadius.md,
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: DESIGN_TOKENS.spacing.md,
            padding: `${DESIGN_TOKENS.spacing.sm} ${DESIGN_TOKENS.spacing.md}`,
            background: `${config.color}15`,
            borderBottom: `1px solid ${config.color}20`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: DESIGN_TOKENS.spacing.xs,
              background: config.color,
              borderRadius: DESIGN_TOKENS.borderRadius.sm,
              padding: `${DESIGN_TOKENS.spacing.xs} ${DESIGN_TOKENS.spacing.sm}`,
              fontSize: "8px",
              fontWeight: "700",
              color: "white",
              boxShadow: DESIGN_TOKENS.shadows.sm,
            }}
          >
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>
          <span
            style={{
              color: DESIGN_TOKENS.colors.text.accent,
              fontSize: "11px",
              fontWeight: "600",
              fontFamily: "'SF Mono', Monaco, monospace",
            }}
          >
            {diff.key}
          </span>
        </div>

        {/* Values */}
        <div style={{ padding: DESIGN_TOKENS.spacing.md }}>
          {diff.type !== "added" && (
            <ModernValueDisplay value={diff.from} label="Previous" type="old" />
          )}
          {diff.type !== "removed" && (
            <ModernValueDisplay value={diff.to} label="Current" type="new" />
          )}
        </div>
      </div>
    );
  }
);

ModernDiffEntry.displayName = "ModernDiffEntry";

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
    ? DESIGN_TOKENS.colors.removed
    : DESIGN_TOKENS.colors.added;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: DESIGN_TOKENS.spacing.md,
        marginBottom: type === "old" ? DESIGN_TOKENS.spacing.sm : 0,
        padding: DESIGN_TOKENS.spacing.sm,
        background: `${color}08`,
        borderRadius: DESIGN_TOKENS.borderRadius.sm,
        border: `1px solid ${color}20`,
      }}
    >
      {/* Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: DESIGN_TOKENS.spacing.xs,
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
          gap: DESIGN_TOKENS.spacing.sm,
          flex: 1,
          minWidth: 0,
        }}
      >
        {enhanced.badge && (
          <span style={{ fontSize: "12px" }}>{enhanced.badge}</span>
        )}
        <span
          style={{
            color: DESIGN_TOKENS.colors.text.secondary,
            fontSize: "11px",
            fontFamily: "'SF Mono', Monaco, monospace",
            wordBreak: "break-all",
            lineHeight: "1.4",
          }}
        >
          {enhanced.display}
        </span>
        <div
          style={{
            background: DESIGN_TOKENS.colors.surface.tertiary,
            color: DESIGN_TOKENS.colors.text.tertiary,
            fontSize: "8px",
            padding: `1px ${DESIGN_TOKENS.spacing.xs}`,
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
      style: MODERN_JSON_VIEW_STYLE,
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
        marginLeft: DESIGN_TOKENS.spacing.lg,
        marginTop: DESIGN_TOKENS.spacing.sm,
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
      <div style={{ marginTop: DESIGN_TOKENS.spacing.sm }}>
        {isComplex ? (
          <div
            style={{
              marginTop: DESIGN_TOKENS.spacing.sm,
              background: DESIGN_TOKENS.colors.surface.secondary,
              borderRadius: DESIGN_TOKENS.borderRadius.md,
              padding: DESIGN_TOKENS.spacing.md,
              border: `1px solid ${DESIGN_TOKENS.colors.border.subtle}`,
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
    <div style={{ fontFamily: "monospace" }}>
      {/* Component Info */}
      <div
        style={{
          marginBottom: "8px",
          padding: "4px 6px",
          backgroundColor: "#1e3a8a11",
          borderRadius: "3px",
          border: "1px solid #1e3a8a22",
        }}
      >
        <div style={{ color: "#60a5fa", fontSize: "9px", fontWeight: "bold" }}>
          🧩 Component: {dependencyMeta.componentName}
        </div>
        <div style={{ color: "#93c5fd", fontSize: "8px", marginTop: "2px" }}>
          Logged at {formatTime(log.timestamp)}
        </div>
      </div>

      {/* Dependency Changes Detail with JsonView support */}
      {dependencyMeta.logType === "dependency-change" &&
        dependencyMeta.dependencyData &&
        Array.isArray(dependencyMeta.dependencyData) && (
          <div style={{ marginBottom: "8px" }}>
            <div
              style={{
                color: "#60a5fa",
                fontWeight: "bold",
                marginBottom: "6px",
                fontSize: "9px",
              }}
            >
              🔍 Changed Properties:
            </div>
            <div style={{ display: "grid", gap: "4px" }}>
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
                      background: `linear-gradient(135deg, ${DESIGN_TOKENS.colors.surface.secondary}22 0%, ${DESIGN_TOKENS.colors.surface.tertiary}11 100%)`,
                      border: `1px solid ${DESIGN_TOKENS.colors.border.default}`,
                      borderRadius: DESIGN_TOKENS.borderRadius.lg,
                      padding: DESIGN_TOKENS.spacing.md,
                      boxShadow: DESIGN_TOKENS.shadows.sm,
                    }}
                  >
                    {/* Property Header */}
                    <div
                      style={{
                        color: DESIGN_TOKENS.colors.text.accent,
                        fontWeight: "bold",
                        marginBottom: DESIGN_TOKENS.spacing.sm,
                        display: "flex",
                        alignItems: "center",
                        gap: DESIGN_TOKENS.spacing.sm,
                      }}
                    >
                      <span style={{ fontSize: "14px" }}>
                        {item.type === "function"
                          ? "📝"
                          : item.type === "object"
                            ? "📦"
                            : "🔧"}
                      </span>
                      <span
                        style={{
                          fontSize: "10px",
                          fontFamily: "'SF Mono', Monaco, monospace",
                          color: DESIGN_TOKENS.colors.text.primary,
                        }}
                      >
                        {item.property}
                      </span>
                    </div>

                    {/* Diff Display - Moved out of "from" section */}
                    {diffData && (
                      <ModernDiffDisplay
                        diffs={diffData.diffs}
                        summary={diffData.summary}
                      />
                    )}

                    {/* From/To Values - Without diff embedded */}
                    <div
                      style={{
                        display: "grid",
                        gap: DESIGN_TOKENS.spacing.sm,
                        marginTop: diffData ? DESIGN_TOKENS.spacing.md : 0,
                      }}
                    >
                      <EnhancedDependencyValueRenderer
                        value={item.from}
                        label="from"
                        labelColor="#f87171"
                        showDiff={false}
                      />
                      <EnhancedDependencyValueRenderer
                        value={item.to}
                        label="to"
                        labelColor="#34d399"
                        showDiff={false}
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
        <div style={{ marginBottom: "8px" }}>
          <div
            style={{
              color: "#60a5fa",
              fontWeight: "bold",
              marginBottom: "4px",
              fontSize: "9px",
            }}
          >
            📊 Raw Data:
          </div>
          <div
            style={{
              backgroundColor: "#0f172a22",
              padding: "4px 6px",
              borderRadius: "2px",
              fontFamily: "monospace",
              overflow: "auto",
              maxHeight: "150px",
            }}
          >
            {displayStrategy.isComplex ? (
              <JsonView
                src={log.data}
                style={MODERN_JSON_VIEW_STYLE}
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
                  color: "#d1d5db",
                  fontSize: "8px",
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
        <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center">
          <span className="mr-1">⚠️</span>
          Large dependency object - performance optimized view
        </div>
      )}

      {/* Contextual Help Messages */}
      <DependencyHelpMessage logType={dependencyMeta.logType} />
    </div>
  );
});

DependencyExpansionContent.displayName = "DependencyExpansionContent";

/**
 * OPTIMIZED: Memoized help message component
 */
const DependencyHelpMessage: React.FC<{ logType: EnhancedDependencyLogType }> =
  React.memo(({ logType }) => {
    // Memoize help content based on log type
    const helpContent = useMemo(() => {
      switch (logType) {
        case "function-recreation":
        case "object-recreation":
          return {
            bgColor: "#065f4611",
            borderColor: "#065f4622",
            titleColor: "#10b981",
            textColor: "#6ee7b7",
            icon: "💡",
            title: "Smart Dependency Tracking:",
            text: "🚀📋 = Normal during app initialization. ⚠️ FREQUENT = Performance issue - consider useCallback/useMemo. Gray = Normal change.",
          };

        case "render-warning":
          return {
            bgColor: "#92400e11",
            borderColor: "#92400e22",
            titleColor: "#f59e0b",
            textColor: "#fbbf24",
            icon: "⚠️",
            title: "Performance Warning:",
            text: "This component is re-rendering frequently. Check for unstable dependencies.",
          };

        case "circuit-breaker":
          return {
            bgColor: "#7f1d1d11",
            borderColor: "#7f1d1d22",
            titleColor: "#ef4444",
            textColor: "#fca5a5",
            icon: "🚨",
            title: "Circuit Breaker Activated:",
            text: "Component disabled to prevent infinite loop. Will auto-restore shortly.",
          };

        case "emergency-stop":
          return {
            bgColor: "#7f1d1d11",
            borderColor: "#7f1d1d22",
            titleColor: "#ef4444",
            textColor: "#fca5a5",
            icon: "🛑",
            title: "Emergency Stop:",
            text: "System stopped dangerous operation. Check your component logic.",
          };

        default:
          return null;
      }
    }, [logType]);

    if (!helpContent) return null;

    return (
      <div
        style={{
          marginBottom: "8px",
          padding: "6px",
          backgroundColor: helpContent.bgColor,
          borderRadius: "3px",
          border: `1px solid ${helpContent.borderColor}`,
        }}
      >
        <div
          style={{
            color: helpContent.titleColor,
            fontWeight: "bold",
            fontSize: "9px",
            marginBottom: "3px",
          }}
        >
          {helpContent.icon} {helpContent.title}
        </div>
        <div
          style={{
            color: helpContent.textColor,
            fontSize: "8px",
            lineHeight: "1.3",
          }}
        >
          {helpContent.text}
        </div>
      </div>
    );
  });

DependencyHelpMessage.displayName = "DependencyHelpMessage";

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
