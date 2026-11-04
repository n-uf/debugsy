"use client";

import React, { useState } from "react";
import { useLongPress } from "../../hooks/use-long-press";
import { safeStringify } from "../../utils/safe-stringify";
import { getExpansionContent } from "./formatters/formatter-registry";

export interface LogEntryData {
  id: number;
  timestamp: string;
  point: string; // Debug point name (Point A, Point B, etc.)
  pointEmoji?: string; // Emoji for the debug point
  message: string;
  level?: "info" | "warn" | "error"; // Severity level
  data?: unknown;
  frequencyBadge?: string; // e.g., "FREQUENT", "CRITICAL"
  tags?: string[];
}

export interface LogEntryProps {
  entry: LogEntryData;
  index?: number; // For alternating backgrounds
  isExpanded?: boolean;
  onToggleExpand?: (id: number) => void;
  /**
   * Callback when log entry is long-pressed (500ms)
   * Receives the entry data for copying
   */
  onLongPress?: (entry: LogEntryData) => void;
  /** Callback when a tag pill is clicked (e.g. to select it in a filter panel) */
  onTagClick?: (tag: string) => void;
  /** Tags currently selected in the filter panel — highlighted in the log row */
  activeTags?: Set<string>;
  alternatingBackground?: boolean; // Enable/disable alternating row backgrounds (default: true)
  colors?: {
    textMuted?: string;
    success?: string;
    textSecondary?: string;
  };
}

/**
 * LogEntry - Display a single log entry with optional expandable data
 *
 * Usage:
 * ```tsx
 * <LogEntry
 *   entry={{ id: 1, timestamp: "12:34", icon: "🔥", message: "Log message", data: {...} }}
 *   index={0}
 *   isExpanded={expandedIds.has(1)}
 *   onToggleExpand={handleToggle}
 *   alternatingBackground={true}  // Active by default - set to false for debugsy-style
 * />
 * ```
 */
export const LogEntry: React.FC<LogEntryProps> = ({
  entry,
  index = 0,
  isExpanded = false,
  onToggleExpand,
  onLongPress,
  onTagClick,
  activeTags,
  alternatingBackground = true, // Active by default
  colors = {},
}) => {
  // Theme-aware defaults. Callers may still override via `colors`, but the
  // baseline now resolves to readable values on every theme:
  // - textMuted   → --color-text-muted     (timestamp / chrome glyphs)
  // - success     → --color-text-primary   (the message body — must be the
  //                 most legible token on the row, NOT the green accent)
  // - textSecondary → --color-text-secondary
  // The previous hard-coded `#10b981 / #6b7280 / #8b949e` were dark-theme
  // greens/grays that washed out on parchment and daylight cream/white.
  const {
    textMuted = "rgb(var(--color-text-muted))",
    success = "rgb(var(--color-text-primary))",
    textSecondary = "rgb(var(--color-text-secondary))",
  } = colors;

  // Copy feedback state
  const [copyFeedback, setCopyFeedback] = useState(false);

  const hasData = entry.data !== undefined;
  const shouldShowExpand = hasData;

  // Get severity-based styling
  const level = entry.level || "info";

  // Helper to get background based on alternating setting
  const getBackground = (lightBg: string, darkBg: string): string => {
    if (!alternatingBackground) return "transparent";
    return index % 2 === 0 ? lightBg : darkBg;
  };

  // Severity border + row tint, theme-aware. Borders use the semantic
  // tokens directly; alternating row backgrounds use the same token at
  // very low alpha so the tint stays subtle on every theme (avoids the
  // dark-only `#06543822 / #78350f22 / #7f1d1d22` swatches that read as
  // muddy dark patches on parchment / daylight).
  const severityStyles = {
    info: {
      borderLeft: "3px solid rgb(var(--color-text-muted))",
      backgroundColor: getBackground(
        "transparent",
        "rgb(var(--color-text-primary) / 0.03)",
      ),
    },
    success: {
      borderLeft: "3px solid rgb(var(--color-success))",
      backgroundColor: getBackground(
        "rgb(var(--color-success) / 0.05)",
        "rgb(var(--color-success) / 0.10)",
      ),
    },
    warn: {
      borderLeft: "3px solid rgb(var(--color-warning))",
      backgroundColor: getBackground(
        "rgb(var(--color-warning) / 0.05)",
        "rgb(var(--color-warning) / 0.10)",
      ),
    },
    error: {
      borderLeft: "3px solid rgb(var(--color-error))",
      backgroundColor: getBackground(
        "rgb(var(--color-error) / 0.05)",
        "rgb(var(--color-error) / 0.10)",
      ),
    },
    critical: {
      borderLeft: "3px solid rgb(var(--color-error))",
      backgroundColor: getBackground(
        "rgb(var(--color-error) / 0.10)",
        "rgb(var(--color-error) / 0.16)",
      ),
    },
  };
  const severityStyle =
    severityStyles[level as keyof typeof severityStyles] ?? severityStyles.info;

  // Get the appropriate formatter component for this log entry (component from registry, stable per entry type)
  const ExpansionComponent = getExpansionContent(entry);

  // Simple data badge text - use safe stringify to handle circular references
  // V1 algorithm uses 1000 characters limit (vs 100 in default safeStringify)
  const dataBadgeText: string = safeStringify(entry.data, 1000);

  // Long press handler
  const handleLongPressCopy = () => {
    if (onLongPress) {
      onLongPress(entry);
      // Show visual feedback
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 1500);
    }
  };

  // Set up long press for copy functionality
  const longPressAttrs = useLongPress({
    threshold: 500, // 500ms for long press
    onLongPress: handleLongPressCopy,
    onCancel: () => {
      // Normal click behavior - toggle expand/collapse
      if (shouldShowExpand && onToggleExpand) {
        onToggleExpand(entry.id);
      }
    },
  });

  return (
    <div>
      {/* Entry Row */}
      <div
        {...(onLongPress ? longPressAttrs : {})}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "6px",
          marginBottom: "1px",
          padding: "2px 8px",
          borderRadius: "2px",
          fontSize: "10px",
          fontFamily: "monospace",
          lineHeight: "1.2",
          backgroundColor: severityStyle.backgroundColor,
          cursor: shouldShowExpand ? "pointer" : "text",
          transition: "all 0.2s ease",
          position: "relative",
          borderLeft: severityStyle.borderLeft,
          // Add subtle visual feedback for copy state
          ...(copyFeedback && {
            backgroundColor: "rgb(var(--color-success) / 0.20)",
            boxShadow: "0 0 8px rgb(var(--color-success) / 0.27)",
          }),
        }}
        onClick={
          !onLongPress
            ? () => {
                if (shouldShowExpand && onToggleExpand) {
                  onToggleExpand(entry.id);
                }
              }
            : undefined
        }
        title={
          onLongPress
            ? "🔸 Click to expand | 📋 Long-press to copy log entry"
            : shouldShowExpand
              ? "Click to expand"
              : undefined
        }
      >
        {/* Copy Success Indicator */}
        {copyFeedback && (
          <div
            style={{
              position: "absolute",
              top: "2px",
              right: "4px",
              padding: "0 6px",
              borderRadius: "6px",
              fontSize: "9px",
              fontWeight: "600",
              letterSpacing: "0.05em",
              whiteSpace: "nowrap",
              color: "rgb(var(--color-success))",
              backgroundColor: "rgb(var(--color-success) / 0.15)",
              backdropFilter: "blur(4px)",
              border: "1px solid rgb(var(--color-success) / 0.45)",
              boxShadow: "0 2px 4px rgb(var(--color-bg-overlay))",
              zIndex: 1000,
              pointerEvents: "none",
            }}
          >
            📋 Copied
          </div>
        )}

        {/* Expand/Collapse Button */}
        <span
          style={{
            fontSize: "10px",
            color: shouldShowExpand
              ? "rgb(var(--color-text-muted))"
              : "transparent",
            marginRight: "4px",
            minWidth: "12px",
            textAlign: "center",
            visibility: shouldShowExpand ? "visible" : "hidden",
            flexShrink: 0,
          }}
        >
          {isExpanded ? "▼" : "▶"}
        </span>

        {/* Timestamp */}
        <span
          style={{
            color: textMuted,
            flexShrink: 0,
            minWidth: "60px",
            fontSize: "9px",
          }}
        >
          {entry.timestamp}
        </span>

        {/* Debug Point with Emoji — uses the `--color-info` token so it stays
            legible on both dark slate and light parchment (the previous
            hard-coded `#60a5fa` was a dark-theme blue that looked washed-out
            on cream). */}
        <span
          style={{
            color: "rgb(var(--color-info))",
            flexShrink: 0,
            minWidth: "50px",
            display: "flex",
            alignItems: "center",
            gap: "2px",
            fontSize: "9px",
          }}
        >
          {entry.pointEmoji && (
            <span style={{ fontSize: "9px" }}>{entry.pointEmoji}</span>
          )}
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: "100px",
            }}
          >
            {entry.point}
          </span>
        </span>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <span
            title={entry.tags.join(", ")}
            style={{
              display: "flex",
              gap: "3px",
              flexShrink: 0,
              minWidth: "80px",
              maxWidth: "120px",
              overflow: "hidden",
            }}
          >
            {entry.tags.map((tag) => {
              const isActive = activeTags?.has(tag) ?? false;
              // Theme-aware: log-entry tag pills sit inside the dark log
              // panel surface, so we use the panel's `--color-bg-*` /
              // `--color-text-*` tokens (NOT `--color-chrome-*`, which is
              // for the always-light chrome strip). On dark themes these
              // resolve to a subtle slate pill with light text; on light
              // themes (parchment / daylight) to a subtle warm/gray pill
              // with dark text. Active state overlays the `--color-info`
              // accent at translucent strength.
              const baseBg = isActive
                ? "rgb(var(--color-info) / 0.22)"
                : "rgb(var(--color-bg-secondary))";
              const baseColor = isActive
                ? "rgb(var(--color-info))"
                : "rgb(var(--color-text-secondary))";
              // Hover state must DIFFER from the resting state for both
              // the active and inactive cases:
              //   inactive → hover: brighten with the selection accent
              //                     (signals "click to add")
              //   active   → hover: desaturate to a neutral muted tint
              //                     and strike the label (signals
              //                     "click to remove" without using
              //                     attention colors like red/yellow).
              const hoverBg = isActive
                ? "rgb(var(--color-bg-tertiary))"
                : "rgb(var(--color-info) / 0.35)";
              const hoverColor = isActive
                ? "rgb(var(--color-text-muted))"
                : "rgb(var(--color-info))";
              const hoverDecoration = isActive ? "line-through" : "none";
              return (
                <span
                  key={tag}
                  role={onTagClick ? "button" : undefined}
                  tabIndex={onTagClick ? 0 : undefined}
                  onClick={
                    onTagClick
                      ? (e) => {
                          e.stopPropagation();
                          onTagClick(tag);
                        }
                      : undefined
                  }
                  // Stop pointer events from bubbling to the row. The row uses
                  // `useLongPress` which attaches mousedown/mouseup/touchstart/
                  // touchend; on cancel it calls `onToggleExpand`. Without
                  // these stoppers a tag click would also expand/collapse the
                  // row (in addition to running `onTagClick`).
                  onMouseDown={
                    onTagClick ? (e) => e.stopPropagation() : undefined
                  }
                  onMouseUp={
                    onTagClick ? (e) => e.stopPropagation() : undefined
                  }
                  onTouchStart={
                    onTagClick ? (e) => e.stopPropagation() : undefined
                  }
                  onTouchEnd={
                    onTagClick ? (e) => e.stopPropagation() : undefined
                  }
                  onKeyDown={
                    onTagClick
                      ? (e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.stopPropagation();
                            onTagClick(tag);
                          }
                        }
                      : undefined
                  }
                  style={{
                    fontSize: "9px",
                    padding: "0 3px",
                    borderRadius: "2px",
                    backgroundColor: baseBg,
                    color: baseColor,
                    whiteSpace: "nowrap",
                    lineHeight: "1.4",
                    textDecoration: "none",
                    ...(onTagClick && {
                      cursor: "pointer",
                      transition:
                        "background-color 0.15s, color 0.15s, text-decoration-color 0.15s",
                    }),
                  }}
                  onMouseEnter={
                    onTagClick
                      ? (e) => {
                          e.currentTarget.style.backgroundColor = hoverBg;
                          e.currentTarget.style.color = hoverColor;
                          e.currentTarget.style.textDecoration =
                            hoverDecoration;
                        }
                      : undefined
                  }
                  onMouseLeave={
                    onTagClick
                      ? (e) => {
                          e.currentTarget.style.backgroundColor = baseBg;
                          e.currentTarget.style.color = baseColor;
                          e.currentTarget.style.textDecoration = "none";
                        }
                      : undefined
                  }
                >
                  {tag}
                </span>
              );
            })}
          </span>
        )}

        {/* Message and Data Container */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flex: 1,
            minWidth: 0,
            overflow: "visible",
          }}
        >
          {/* Message */}
          <span
            style={{
              color: success,
              flexShrink: 0,
              flexGrow: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: isExpanded ? "normal" : "nowrap",
              fontSize: "10px",
              maxWidth: "1200px",
            }}
            title={entry.message}
          >
            {entry.message}
          </span>

          {/* Frequency Badge (e.g., FREQUENT warning) */}
          {entry.frequencyBadge && (
            <span
              style={{
                color: "rgb(var(--color-warning))",
                fontSize: "8px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: "2px",
                flexShrink: 0,
              }}
            >
              ⚠️ {entry.frequencyBadge}
            </span>
          )}

          {/* Data preview (if present) - hide when expanded, show when
              collapsed. Rendered as plain warning-tinted text — no chip
              background, no padding — so it doesn't read as a
              "highlighted / selected" run. Theme readability is owned
              by `--color-warning`, which is tuned PER THEME to keep at
              least WCAG AA contrast against that theme's panel surface
              (see themes.css). */}
          {hasData && !isExpanded && (
            <span
              style={{
                color: "rgb(var(--color-warning))",
                flexShrink: 0,
                overflow: "visible",
                textOverflow: "clip",
                whiteSpace: "normal",
                fontSize: "9px",
                maxWidth: "none",
              }}
            >
              {dataBadgeText}
            </span>
          )}
        </div>
      </div>

      {/* Expanded Content - Uses formatter system */}
      {shouldShowExpand && isExpanded && entry.data !== undefined && (
        // eslint-disable-next-line react-hooks/static-components -- module-level registry component, not created here
        <ExpansionComponent
          log={entry}
          colors={{ textMuted, success, textSecondary }}
        />
      )}
    </div>
  );
};

LogEntry.displayName = "LogEntry";
