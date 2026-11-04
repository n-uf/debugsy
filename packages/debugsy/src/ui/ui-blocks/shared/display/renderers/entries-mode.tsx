"use client";

/**
 * Entries Mode Renderer
 *
 * Renders a short list of recent log entries.
 */

import React from "react";
import { formatTime } from "../display-helpers";

export interface DisplayEntry {
  id: number;
  timestamp: string;
  emoji: string;
  message: string;
}

export interface EntriesModeProps {
  /** Entries to display */
  entries: DisplayEntry[];
}

/**
 * EntriesMode - Entries list renderer
 *
 * Rows of dim timestamp, emoji and message; long messages end in an ellipsis.
 */
export const EntriesMode: React.FC<EntriesModeProps> = ({ entries }) => {
  return (
    <div className="dbg-readout-rows">
      {entries.map((entry) => (
        <div key={entry.id} className="dbg-readout-row">
          {entry.timestamp !== "" && (
            <span className="dbg-readout-time">{formatTime(entry.timestamp)}</span>
          )}
          {entry.emoji !== "" && (
            <span className="dbg-readout-emoji">{entry.emoji}</span>
          )}
          <span className="dbg-readout-msg">{entry.message}</span>
        </div>
      ))}
    </div>
  );
};

EntriesMode.displayName = "EntriesMode";
