"use client";

import React from "react";
import { type DepthSetting } from "../../../../shared/object-depth-utils";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { DefaultLogFormatter } from "../formatters";

/**
 * Memoized log entry component to prevent unnecessary re-renders
 * Each log entry is memoized based on its content, not array position
 */
export const MemoizedLogEntry: React.FC<{
  log: DebugLogEntry;
  index: number;
  uniqueKey: string;
  depthSetting: DepthSetting;
}> = React.memo(
  ({ log, index, uniqueKey, depthSetting }) => {
    // OPTIMIZED: All logs flow through DefaultLogFormatter with automatic expansion routing
    // DefaultLogFormatter now automatically detects log type and routes to appropriate expansion content
    // This provides consistent behavior while allowing specialized expansion content
    return (
      <DefaultLogFormatter
        log={log}
        index={index}
        depthSetting={depthSetting}
      />
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if the actual log content changed
    return (
      prevProps.uniqueKey === nextProps.uniqueKey &&
      prevProps.log === nextProps.log &&
      prevProps.index === nextProps.index &&
      prevProps.depthSetting === nextProps.depthSetting
    );
  }
);

MemoizedLogEntry.displayName = "MemoizedLogEntry";
