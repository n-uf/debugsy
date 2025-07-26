"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import { JsonUtils } from "../utils/json/json-utilities";

// OPTIMIZATION: Stable style object to prevent JsonView prop changes
const JSON_VIEW_STYLE = {
  fontFamily: "ui-monospace, SFMono-Regular, Monaco, Consolas, monospace",
  fontSize: "12px",
  backgroundColor: "transparent",
} as const;

/**
 * OPTIMIZED: Default expansion content with smart size handling
 * MIGRATED: Uses JsonUtils.isComplex instead of isLikelyLargeObject
 */
export const DefaultExpandedContent: React.FC<{
  log: DebugLogEntry;
  maxHeight?: number;
}> = React.memo(({ log, maxHeight = 400 }) => {
  // OPTIMIZATION: Memoize complex object detection to prevent recalculation
  const displayStrategy = useMemo(() => {
    if (!log.data) {
      return { shouldCollapse: false, content: null };
    }

    const isComplex = JsonUtils.isComplex(log.data);

    return {
      shouldCollapse: isComplex,
      content: log.data,
      isComplex,
    };
  }, [log.data]);

  // OPTIMIZATION: Memoize JSON view props to prevent unnecessary re-renders
  const jsonViewProps = useMemo(() => {
    if (!displayStrategy.content) return null;

    return {
      src: displayStrategy.content,
      style: JSON_VIEW_STYLE,
      collapsed: displayStrategy.shouldCollapse ? 2 : false,
      displaySize: true,
      displayDataTypes: false,
      enableClipboard: true,
      theme: "default" as const,
    };
  }, [displayStrategy]);

  if (!log.data) {
    return (
      <div className="text-gray-500 text-sm italic p-2">No data to display</div>
    );
  }

  if (!jsonViewProps) {
    return (
      <div className="text-gray-500 text-sm p-2">Unable to render data</div>
    );
  }

  return (
    <div
      className="bg-gray-50 dark:bg-gray-800 p-3 rounded border"
      style={{ maxHeight, overflow: "auto" }}
    >
      {displayStrategy.isComplex && (
        <div className="text-xs text-yellow-600 dark:text-yellow-400 mb-2 flex items-center">
          ⚠️ Complex object detected - collapsed by default for performance
        </div>
      )}
      <JsonView {...jsonViewProps} />
    </div>
  );
});
