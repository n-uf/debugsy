"use client";

/**
 * Queue Mode Renderer
 *
 * Renders multi-row queue items with inline progress bars.
 */

import React from "react";
import type { DisplayQueueItem } from "../../../../patterns/display-system/display-queue-state";
import {
  formatTime,
  getContentColor,
  getContentEmoji,
  getElapsedTime,
} from "../display-helpers";
import { ProgressBar } from "./progress-bar";

export interface QueueModeProps {
  /** Queue items to display */
  queueItems: DisplayQueueItem[];
  /** Visible queue items (sliced to maxRows) */
  visibleQueueItems: DisplayQueueItem[];
  /** Row height in pixels */
  rowHeight: number;
  /** Right padding for actions */
  rightPadding: string;
  /** Show processing time? */
  showProcessingTime: boolean;
  /** Maximum rows */
  maxRows: number;
}

/**
 * QueueMode - Multi-row queue item renderer with inline progress bars
 *
 * Features:
 * - Fixed height with compact rendering
 * - Inline progress bars (saves vertical space)
 * - Processing time display
 * - Overflow indicator
 */
export const QueueMode: React.FC<QueueModeProps> = ({
  queueItems,
  visibleQueueItems,
  rowHeight,
  rightPadding,
  showProcessingTime,
  maxRows,
}) => {
  return (
    <>
      {/* Multi-row queue mode with inline progress bars */}
      {visibleQueueItems.map((item, index) => (
        <div
          key={item.id}
          style={{
            minHeight: `${rowHeight}px`,
            height: `${rowHeight}px`,
            display: "flex",
            alignItems: "center",
            padding: "2px 8px",
            paddingRight: rightPadding,
            position: "relative",
            borderBottom:
              index < visibleQueueItems.length - 1
                ? `1px solid #374151`
                : "none",
            flexShrink: 0,
            gap: "4px",
          }}
        >
          {/* Time */}
          <span
            style={{
              color: "#6b7280",
              flexShrink: 0,
              fontSize: "8px",
              fontFamily: "monospace",
            }}
          >
            {formatTime(item.timestamp)}
          </span>

          {/* Separator */}
          <span
            style={{
              color: "#4b5563",
              flexShrink: 0,
              fontSize: "8px",
              fontFamily: "monospace",
            }}
          >
            │
          </span>

          {/* Inline Progress Bar */}
          {item.progress && (
            <ProgressBar
              progress={item.progress}
              type={item.type}
              mode={item.mode}
              renderMode="inline"
              inlineWidth="80px"
              animateProgress={item.animateProgress ?? false}
            />
          )}

          {/* Emoji */}
          <span style={{ flexShrink: 0, fontSize: "9px" }}>
            {getContentEmoji(item.type)}
          </span>

          {/* Message */}
          <span
            style={{
              color: getContentColor(item.type),
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              fontSize: "8px",
              fontFamily: "monospace",
              lineHeight: "1.0",
            }}
          >
            {item.message}
            {getElapsedTime(
              showProcessingTime,
              item.showProcessingTime,
              item.processingStartTime
            )}
          </span>
        </div>
      ))}

      {/* Overflow indicator - shows when there are more items than visible */}
      {queueItems.length > maxRows && (
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            right: "0",
            height: "16px",
            background: "linear-gradient(to top, #000000ee, transparent)",
            pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            color: "#6b7280",
            fontFamily: "monospace",
          }}
        >
          +{queueItems.length - maxRows} more
        </div>
      )}
    </>
  );
};

QueueMode.displayName = "QueueMode";
