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
}

/**
 * LogEntry - one log row (24px collapsed) with optional expandable data.
 *
 * Anatomy, left to right: chevron (only with data), time, debug point, tag
 * chips, message, frequency badge, data preview. The level shows as a stripe
 * on the left edge (warn: amber, error: red). Styled by the panel's own
 * stylesheet (`dbg-log-*` classes); state lives in `data-*` attributes.
 *
 * ```tsx
 * <LogEntry
 *   entry={{ id: 1, timestamp: "12:34", point: "Cart", message: "Log message", data: {...} }}
 *   index={0}
 *   isExpanded={expandedIds.has(1)}
 *   onToggleExpand={handleToggle}
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
}) => {
  // Copy feedback state
  const [copyFeedback, setCopyFeedback] = useState(false);

  const hasData = entry.data !== undefined;
  const shouldShowExpand = hasData;

  const level = entry.level || "info";

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
    <div className="dbg-log-item">
      {/* Entry Row */}
      <div
        {...(onLongPress ? longPressAttrs : {})}
        className="dbg-log-row"
        data-level={level}
        data-alt={alternatingBackground && index % 2 === 1 ? "true" : undefined}
        data-expandable={shouldShowExpand ? "true" : undefined}
        data-expanded={isExpanded ? "true" : undefined}
        data-copied={copyFeedback ? "true" : undefined}
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
            ? "Click to expand | Long-press to copy log entry"
            : shouldShowExpand
              ? "Click to expand"
              : undefined
        }
      >
        {/* Copy Success Indicator */}
        {copyFeedback && <span className="dbg-log-copied">Copied</span>}

        {/* Expand/Collapse chevron (kept in place without data, for alignment) */}
        <span
          className="dbg-log-chev"
          data-open={isExpanded ? "true" : undefined}
          data-hidden={shouldShowExpand ? undefined : "true"}
          aria-hidden
        >
          <svg viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2.5 1 L5.5 4 L2.5 7" />
          </svg>
        </span>

        {/* Timestamp */}
        <span className="dbg-log-time">{entry.timestamp}</span>

        {/* Debug Point */}
        <span className="dbg-log-point">
          {entry.pointEmoji && <span>{entry.pointEmoji}</span>}
          <span>{entry.point}</span>
        </span>

        {/* Tags */}
        {entry.tags && entry.tags.length > 0 && (
          <span className="dbg-log-tags" title={entry.tags.join(", ")}>
            {entry.tags.map((tag) => {
              const isActive = activeTags?.has(tag) ?? false;
              return (
                <span
                  key={tag}
                  className="dbg-log-tag"
                  data-active={isActive ? "true" : undefined}
                  data-clickable={onTagClick ? "true" : undefined}
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
                >
                  {tag}
                </span>
              );
            })}
          </span>
        )}

        {/* Message and Data Container */}
        <div className="dbg-log-main">
          <span className="dbg-log-msg" title={entry.message}>
            {entry.message}
          </span>

          {/* Frequency Badge (e.g., FREQUENT warning) */}
          {entry.frequencyBadge && (
            <span className="dbg-log-freq">{entry.frequencyBadge}</span>
          )}

          {/* Data preview (if present) - hidden when expanded */}
          {hasData && !isExpanded && (
            <span className="dbg-log-data">{dataBadgeText}</span>
          )}
        </div>
      </div>

      {/* Expanded Content - Uses formatter system */}
      {shouldShowExpand && isExpanded && entry.data !== undefined && (
        // eslint-disable-next-line react-hooks/static-components -- module-level registry component, not created here
        <ExpansionComponent log={entry} />
      )}
    </div>
  );
};

LogEntry.displayName = "LogEntry";
