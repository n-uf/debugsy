"use client";

import React from "react";
import type { DisplayContent } from "../../../patterns/display-system/display-state";
import type { DisplayQueueItem } from "../../../patterns/display-system/display-queue-state";
import { Word } from "../../../primitives/word";
import { EmptyState } from "./renderers/empty-state";
import { EntriesMode, type DisplayEntry } from "./renderers/entries-mode";
import { QueueMode } from "./renderers/queue-mode";
import { SingleMode } from "./renderers/single-mode";

// Re-export types from renderers
export type { DisplayEntry };

export interface DisplayAction {
  /** The word on the button, e.g. "EXPAND", "CLEAR", "CLOSE" */
  label: string;
  /** Action handler */
  onClick: () => void;
  /** Tooltip text (also the accessible name unless `ariaLabel` is set) */
  title?: string;
  /** Accessible name; defaults to `title` */
  ariaLabel?: string;
  /** Accent the word */
  tone?: "led" | "caution" | "warn";
  /** Current state: the word is brighter */
  active?: boolean;
}

export interface DisplayProps {
  /** Queue items for multi-row display (highest priority) */
  queueItems?: DisplayQueueItem[];
  /** Memorized items (not visible but kept in memory) */
  memorizedItems?: DisplayQueueItem[];
  /** Maximum rows to display from queue (default: 3) */
  maxRows?: number;
  /** Show processing time for queue items? (default: false) */
  showProcessingTime?: boolean;

  /** List of entries to display */
  entries?: DisplayEntry[];
  /** Single content to display (overrides entries) */
  content?: DisplayContent | null;
  /** Tooltip content (overrides entries, lower priority than content) */
  tooltipContent?: string | null;
  /** Timestamp for tooltip */
  tooltipTimestamp?: number;
  /** Actions: words at the right end of the readout */
  actions?: DisplayAction[];
  /** Maximum entries to show */
  maxEntries?: number;
  /** Custom empty state message (when no entries and no content) */
  emptyMessage?: string;
}

/**
 * Display - the tray's readout: a recessed canvas window for notifications,
 * messages and recent entries, with action words at its right end.
 *
 * Rendering priority: queueItems > content > tooltipContent > entries > empty
 *
 * - Queue items: up to `maxRows` rows sharing the window's height, each with
 *   a lamp for its type and, where it has progress, an inline meter
 * - Single content: one message row, its meter below when it has progress
 * - Entries: recent logs (dim timestamp, emoji, message)
 * - Empty: a dim message
 *
 * ```tsx
 * <Display queueItems={displayQueue} actions={[{ label: "CLEAR", onClick }]} />
 * <Display content={{ message: "Saved", type: "success", timestamp: Date.now() }} />
 * <Display entries={entries} />
 * ```
 */
export const Display: React.FC<DisplayProps> = ({
  queueItems = [],
  memorizedItems = [],
  maxRows = 3,
  showProcessingTime = false,
  entries = [],
  content,
  tooltipContent,
  tooltipTimestamp,
  actions = [],
  maxEntries = 3,
  emptyMessage = "No entries yet.",
}) => {
  // Rendering mode (priority: queueItems > content > tooltipContent > entries)
  const hasQueueItems = queueItems.length > 0;

  // Top maxRows items (already sorted by priority)
  const visibleQueueItems = queueItems.slice(0, maxRows);

  const contentToShow = hasQueueItems
    ? null
    : (content ??
      (tooltipContent
        ? {
            message: tooltipContent,
            type: "info" as const,
            timestamp: tooltipTimestamp ?? Date.now(),
          }
        : null));

  // Show only the most recent entries
  const recentEntries = entries.slice(-maxEntries).reverse();

  const mode = hasQueueItems
    ? "queue"
    : contentToShow
      ? "single"
      : recentEntries.length === 0
        ? "empty"
        : "entries";

  return (
    <div className="dbg-readout">
      <div
        className="dbg-readout-screen"
        data-mode={mode}
        role={mode === "queue" || mode === "single" ? "status" : undefined}
      >
        {hasQueueItems ? (
          <QueueMode
            queueItems={queueItems}
            visibleQueueItems={visibleQueueItems}
            showProcessingTime={showProcessingTime}
            maxRows={maxRows}
          />
        ) : contentToShow ? (
          <SingleMode content={contentToShow} />
        ) : recentEntries.length === 0 ? (
          <EmptyState message={emptyMessage} />
        ) : (
          <EntriesMode entries={recentEntries} />
        )}

        {/* Memorized items indicator */}
        {memorizedItems.length > 0 && (
          <span
            className="dbg-readout-memo"
            title={`${memorizedItems.length} item${memorizedItems.length === 1 ? "" : "s"} memorized (interrupted by higher priority)`}
          >
            {memorizedItems.length} memorized
          </span>
        )}
      </div>

      {actions.length > 0 && (
        <div className="dbg-readout-actions">
          {actions.map((action, index) => (
            <Word
              key={`${index}:${action.label}`}
              size="sm"
              tone={action.tone}
              active={action.active}
              title={action.title}
              ariaLabel={action.ariaLabel ?? action.title}
              onClick={action.onClick}
            >
              {action.label}
            </Word>
          ))}
        </div>
      )}
    </div>
  );
};

Display.displayName = "Display";
