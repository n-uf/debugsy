"use client";

/**
 * Entries Mode Renderer
 *
 * Renders list of log entries.
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
 * Features:
 * - Multiple entries in rows
 * - Timestamp + emoji + message format
 * - Ellipsis for long messages
 */
export const EntriesMode: React.FC<EntriesModeProps> = ({ entries }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1px",
        width: "100%",
        overflow: "hidden",
      }}
    >
      {entries.map((entry) => (
        <div
          key={entry.id}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "10px",
            fontFamily: "monospace",
            lineHeight: "1.2",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              color: "#6b7280",
              flexShrink: 0,
              fontSize: "9px",
            }}
          >
            {formatTime(entry.timestamp)}
          </span>
          <span style={{ flexShrink: 0, fontSize: "10px" }}>
            {entry.emoji}
          </span>
          <span
            style={{
              color: "#10b981",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {entry.message}
          </span>
        </div>
      ))}
    </div>
  );
};

EntriesMode.displayName = "EntriesMode";

