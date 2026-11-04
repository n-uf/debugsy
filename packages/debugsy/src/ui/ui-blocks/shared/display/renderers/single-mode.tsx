"use client";

/**
 * Single Content Mode Renderer
 *
 * Renders one message with an optional progress meter below it.
 */

import React from "react";
import type { DisplayContent } from "../../../../patterns/display-system/display-state";
import { Lamp, Meter } from "../../../../primitives/lamp";
import { formatTime, getContentLamp, getContentTone } from "../display-helpers";

export interface SingleModeProps {
  /** Content to display */
  content: DisplayContent;
}

/**
 * SingleMode - Single message renderer
 *
 * A message row (dim timestamp, lamp, message) and, when the content has
 * progress, a meter under it (a sweep while loading).
 */
export const SingleMode: React.FC<SingleModeProps> = ({ content }) => {
  const progress = content.progress;
  const tone = getContentTone(content.type);

  return (
    <div className="dbg-readout-single" data-tone={tone}>
      <div className="dbg-readout-line">
        <span className="dbg-readout-time">{formatTime(content.timestamp)}</span>
        <Lamp state={getContentLamp(content.type)} />
        <span className="dbg-readout-msg">{content.message}</span>
      </div>
      {progress && (
        <Meter tone={tone} value={progress.loading === true ? undefined : progress.value} />
      )}
    </div>
  );
};

SingleMode.displayName = "SingleMode";
