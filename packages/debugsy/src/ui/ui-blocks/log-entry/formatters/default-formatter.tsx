/**
 * Default formatter - displays JSON data for any log entry
 * Uses JsonView for interactive exploration. JsonView's class names are
 * styled by the panel's own stylesheet (`.dbg-root .json-view`), so no CSS
 * file is imported.
 */

import React, { useMemo } from "react";
import JsonView from "react18-json-view";
import superjson from "superjson";
import type { LogEntryData } from "../log-entry";
import type {
  ExpansionContentProps,
  FormatterMeta,
} from "./formatter-types";

/**
 * Default expansion content - uses JsonView for all data
 */
export const DefaultExpansionContent: React.FC<ExpansionContentProps> = ({
  log,
}) => {
  // Create safe data for JsonView using superjson
  const jsonViewData = useMemo(() => {
    if (log.data === undefined) return null;

    let safeData: any;
    try {
      const serialized = superjson.stringify(log.data);
      safeData = JSON.parse(serialized);
    } catch {
      safeData = {
        __renderError: true,
        __error: "Failed to render data safely",
        __hint: "Data contains structures that cannot be safely displayed",
      };
    }

    // Check if data is complex (object/array with multiple levels)
    const isComplex =
      typeof safeData === "object" &&
      safeData !== null &&
      !safeData.__renderError &&
      (Array.isArray(safeData) || Object.keys(safeData).length > 3);

    return {
      safeData,
      isComplex,
    };
  }, [log.data]);

  if (!jsonViewData) return null;

  return (
    <div className="dbg-log-expand">
      <div className="dbg-json">
        <JsonView
          src={jsonViewData.safeData}
          collapsed={jsonViewData.isComplex ? 2 : false}
          displaySize={true}
          enableClipboard={true}
          theme="default"
        />
      </div>
    </div>
  );
};

DefaultExpansionContent.displayName = "DefaultExpansionContent";

/**
 * Get metadata for default formatter
 */
export const getDefaultLogMeta = (log: LogEntryData): FormatterMeta | null => {
  // Default formatter doesn't change any metadata
  return {
    severity: log.level ?? "info",
    shouldExpand: log.data !== undefined,
  };
};
