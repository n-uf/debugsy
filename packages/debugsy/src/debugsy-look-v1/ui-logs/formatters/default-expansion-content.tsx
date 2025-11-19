"use client";

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import "react18-json-view/src/style.css";
import type { DebugLogEntry } from "../../../debugsy-logs/use-debugsy";
import { safeSuperjsonStringify } from "../utils/json/json-core";
import { JsonUtils } from "../utils/json/json-utilities";

// OPTIMIZATION: Stable style object to prevent JsonView prop changes
const JSON_VIEW_STYLE = {
  fontFamily: "ui-monospace, SFMono-Regular, Monaco, Consolas, monospace",
  fontSize: "12px",
  backgroundColor: "transparent",
} as const;

/**
 * SAFE: Detect problematic data without causing circular reference errors
 */
const hasProblematicData = (data: any): boolean => {
  if (!data || typeof data !== "object") return false;

  try {
    // Safe property checks without JSON.stringify (which causes circular reference errors)
    if (
      data.hasOwnProperty("$$typeof") ||
      data.hasOwnProperty("_owner") ||
      data.hasOwnProperty("_store") ||
      data.hasOwnProperty("__reactFiber$") ||
      data.hasOwnProperty("stateNode") ||
      (data.constructor && data.constructor.name === "FiberNode")
    ) {
      return true;
    }

    // Check for React element structure
    if (data.type && data.props && typeof data.type === "function") {
      return true;
    }

    return false;
  } catch {
    return true; // If we can't safely check, assume it's problematic
  }
};

/**
 * SAFE: Create sanitized data for JsonView using superjson
 */
const createSafeData = (data: any): any => {
  try {
    // Use superjson to safely handle circular references and problematic objects
    const serialized = safeSuperjsonStringify(data);
    return JSON.parse(serialized);
  } catch (error) {
    // Return error info if even superjson fails
    return {
      __renderError: true,
      __originalType: typeof data,
      __error:
        error instanceof Error ? error.message : "Failed to render data safely",
      __hint: "Data contains structures that cannot be safely displayed",
    };
  }
};

/**
 * OPTIMIZED: Default expansion content with smart size handling
 * MIGRATED: Uses JsonUtils.isComplex instead of isLikelyLargeObject
 * SAFETY: Uses superjson for safe rendering without circular reference errors
 */
export const DefaultExpandedContent: React.FC<{
  log: DebugLogEntry;
  maxHeight?: number;
}> = React.memo(({ log, maxHeight = 400 }) => {
  // OPTIMIZATION: Memoize safe data conversion to prevent recalculation
  const safeData = useMemo(() => {
    if (!log.data) return null;

    // Always use safe data conversion (no early filtering)
    return createSafeData(log.data);
  }, [log.data]);

  // OPTIMIZATION: Memoize display strategy
  const displayStrategy = useMemo(() => {
    if (!safeData) {
      return { shouldCollapse: false, content: null };
    }

    // Check if the safe data indicates a rendering error
    if (safeData.__renderError) {
      return {
        shouldCollapse: false,
        content: null,
        isRenderError: true,
        error: safeData.__error,
        hint: safeData.__hint,
      };
    }

    const isComplex = JsonUtils.isComplex(safeData);

    return {
      shouldCollapse: isComplex,
      content: safeData,
      isComplex,
    };
  }, [safeData]);

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

  // SAFETY: Show error message for data that couldn't be safely rendered
  if (displayStrategy.isRenderError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
        <div className="text-yellow-700 text-sm font-medium mb-2">
          ⚠️ Complex Data Structure
        </div>
        <div className="text-yellow-600 text-xs mb-2">
          {displayStrategy.error}
        </div>
        <div className="text-gray-600 text-xs">{displayStrategy.hint}</div>
        <div className="text-gray-500 text-xs mt-2">
          Data type: {typeof log.data} | Contains:{" "}
          {hasProblematicData(log.data)
            ? "React elements"
            : "Unknown structures"}
        </div>
      </div>
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
