"use client";

/**
 * Queue Mode Renderer
 *
 * Renders multi-row queue items with an inline progress meter.
 */

import React from "react";
import type { DisplayQueueItem } from "../../../../patterns/display-system/display-queue-state";
import { Lamp, Meter } from "../../../../primitives/lamp";
import {
  formatTime,
  getContentLamp,
  getContentTone,
  getElapsedTime,
} from "../display-helpers";

export interface QueueModeProps {
  /** Queue items to display */
  queueItems: DisplayQueueItem[];
  /** Visible queue items (sliced to maxRows) */
  visibleQueueItems: DisplayQueueItem[];
  /** Show processing time? */
  showProcessingTime: boolean;
  /** Maximum rows */
  maxRows: number;
}

/**
 * QueueMode - Multi-row queue item renderer
 *
 * Rows share the readout's height. An item with progress gets an inline
 * meter (a sweep while loading). When more items wait than fit, a "+N more"
 * tag shows in the corner.
 */
export const QueueMode: React.FC<QueueModeProps> = ({
  queueItems,
  visibleQueueItems,
  showProcessingTime,
  maxRows,
}) => {
  const hidden = queueItems.length - maxRows;
  return (
    <>
      <div className="dbg-readout-rows">
        {visibleQueueItems.map((item) => (
          <div
            key={item.id}
            className="dbg-readout-row"
            data-tone={getContentTone(item.type)}
          >
            <span className="dbg-readout-time">{formatTime(item.timestamp)}</span>
            <Lamp state={getContentLamp(item.type)} />
            {item.progress && (
              <Meter
                className="dbg-readout-meter"
                width={56}
                tone={getContentTone(item.type)}
                value={item.mode === "loading" ? undefined : item.progress.value}
              />
            )}
            <span className="dbg-readout-msg">
              {item.message}
              {getElapsedTime(
                showProcessingTime,
                item.showProcessingTime,
                item.processingStartTime
              )}
            </span>
          </div>
        ))}
      </div>
      {hidden > 0 && <span className="dbg-readout-more">+{hidden} more</span>}
    </>
  );
};

QueueMode.displayName = "QueueMode";
