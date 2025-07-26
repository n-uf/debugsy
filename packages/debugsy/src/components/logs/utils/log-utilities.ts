/**
 * Rendering configuration constants for debug logs
 */
export const LOG_RENDERING_CONFIG = {
  MAX_RENDERED_LOGS: 400, // Maximum logs to render for performance
  COPY_PARTIAL_COUNT: 200, // Number of logs to copy on first click
} as const;

/**
 * Memoization cache for JSON stringification results
 * Prevents repeated expensive JSON.stringify operations for the same data
 */
const jsonStringifyCache = new WeakMap<
  object,
  Map<number | undefined, string>
>();

/**
 * Memoized JSON stringify that caches results for the same object and space parameter
 * Significantly improves performance when the same JSON data is stringified multiple times
 */
export const memoizedJsonStringify = (obj: any, space?: number): string => {
  // For primitive values, just stringify directly (no memoization needed)
  if (obj === null || typeof obj !== "object") {
    return safeJsonStringify(obj, space);
  }

  // Check if we have a cache for this object
  let spaceCache = jsonStringifyCache.get(obj);
  if (!spaceCache) {
    spaceCache = new Map();
    jsonStringifyCache.set(obj, spaceCache);
  }

  // Check if we have a cached result for this space parameter
  const cached = spaceCache.get(space);
  if (cached !== undefined) {
    return cached;
  }

  // Compute and cache the result
  const result = safeJsonStringify(obj, space);
  spaceCache.set(space, result);

  return result;
};

/**
 * Clear the JSON stringify cache (useful for memory management)
 * Call this when you want to free up memory from cached JSON strings
 */
export const clearJsonStringifyCache = (): void => {
  // WeakMap doesn't have a clear method, but we can't really clear it
  // The cache will be garbage collected when the objects are no longer referenced
  console.log("🧹 JSON stringify cache will be cleared via garbage collection");
};

/**
 * Debug points mapping for emojis (Event Dispatcher Architecture)
 */
export const DEBUG_POINT_EMOJIS: Record<string, string> = {
  dispatcher: "🎯",
  "hit-testing": "🔍",
  routing: "🔗",
  "surface-interaction": "🌍",
  "frame-interaction": "📦",
  "selection-interaction": "📋",
  "handler-registry": "📝",
  performance: "⚡",
  "visual-debug": "👁️",
  "surface-interactions": "🏠",
  "surface-dock": "🚢",
  "frame-metrics": "📏",
  dependencies: "🧠",
  health: "🏥",
  "canvas-events": "🎨",
  "viewport-changes": "🔍",
  "auto-layout": "📐",
  "event-propagation": "📡",
  "mouse-dispatcher": "🖱️", // Alias for dispatcher
};

/**
 * Get emoji for a debug point
 */
export const getPointEmoji = (point: string): string => {
  return DEBUG_POINT_EMOJIS[point] ?? "📝";
};

/**
 * Formats a debug point name for display (removes prefixes for brevity)
 */
export const formatPointName = (point: string): string => {
  return point.replace("frame-", "").replace("surface-", "");
};

/**
 * Truncate text to maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Check if an object is a Next.js special object (params, searchParams, etc.)
 *
 * Next.js has special objects like `params` and `searchParams` that trigger warnings
 * when their properties are enumerated directly. These warnings appear as:
 * - "params are being enumerated. params should be unwrapped with React.use()"
 * - "The keys of searchParams were accessed directly. searchParams should be unwrapped with React.use()"
 *
 * This function identifies such objects early to prevent enumeration in JSON.stringify()
 */
const isNextJsSpecialObject = (value: any, key: string): boolean => {
  if (!value || typeof value !== "object") return false;

  // Quick check for Next.js specific keys
  if (key === "params" || key === "searchParams") {
    return true;
  }

  // Check for Next.js params/searchParams by looking for specific characteristics
  // These objects have special behavior and should not be enumerated
  try {
    // Avoid accessing constructor or prototype directly as it might trigger warnings
    const valueString = Object.prototype.toString.call(value);

    // Check if this looks like a Next.js object without triggering enumeration
    if (valueString === "[object Object]") {
      // Check if object has the typical Next.js warning characteristics
      // by checking for specific property patterns without enumerating
      const hasParams = key.toLowerCase().includes("param");
      const hasSearch = key.toLowerCase().includes("search");

      if (hasParams || hasSearch) {
        return true;
      }
    }

    return false;
  } catch {
    // If we can't safely check, assume it might be special for these specific keys
    return key === "params" || key === "searchParams" || key.includes("Params");
  }
};

/**
 * Safe JSON stringify that handles circular references and Next.js objects
 */
export const safeJsonStringify = (obj: any, space?: number): string => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);

          // Handle Next.js special objects before enumeration to prevent warnings
          if (isNextJsSpecialObject(value, key)) {
            if (key === "params" || key.includes("Params")) {
              return "[Next.js Params Object]";
            }
            if (key === "searchParams" || key.includes("SearchParams")) {
              return "[Next.js SearchParams Object]";
            }
            return "[Next.js Special Object]";
          }

          // Filter out React internal properties and DOM elements
          // Use try-catch to prevent any property access warnings
          try {
            if (
              value.constructor?.name === "HTMLElement" ||
              value.constructor?.name?.includes("Element") ||
              key.startsWith("__react") ||
              key.startsWith("_react") ||
              key === "stateNode" ||
              key === "fiber"
            ) {
              return "[DOM Element]";
            }
          } catch {
            // If we can't safely check the constructor, treat as potentially problematic
            if (
              key.startsWith("__react") ||
              key.startsWith("_react") ||
              key === "stateNode" ||
              key === "fiber"
            ) {
              return "[React Internal]";
            }
          }
        }
        return value;
      },
      space
    );
  } catch (error) {
    return `[Error stringifying: ${error instanceof Error ? error.message : "unknown"}]`;
  }
};

/**
 * Format JSON data for display with size limits
 */
export const formatDataForDisplay = (
  data: any,
  maxLength: number = 100
): string => {
  if (!data) return "";
  const jsonString = safeJsonStringify(data);
  return truncateText(jsonString, maxLength);
};

/**
 * Check if logs array is truncated based on configuration
 */
export const getLogsTruncationInfo = (totalLogs: number) => {
  const isLogsTruncated = totalLogs > LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS;
  const hiddenLogsCount = isLogsTruncated
    ? totalLogs - LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS
    : 0;

  return {
    isLogsTruncated,
    hiddenLogsCount,
    maxRendered: LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS,
  };
};

/**
 * Prepare logs for rendering (limit and reverse)
 */
export const prepareLogsForRendering = <T>(logs: T[]): T[] => {
  return [...logs].slice(-LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS).reverse();
};

/**
 * CSS-in-JS style configurations for log components
 */
export const LOG_STYLES = {
  logEntry: {
    display: "flex",
    alignItems: "flex-start",
    gap: "6px",
    marginBottom: "1px",
    padding: "2px 8px", // Increased right padding to match visual balance
    borderRadius: "2px",
    fontSize: "10px",
    fontFamily: "monospace",
    lineHeight: "1.2",
    justifyContent: "flex-start",
  },

  timestamp: {
    color: "#6b7280",
    flexShrink: 0,
    minWidth: "60px",
    fontSize: "9px",
  },

  debugPoint: {
    color: "#60a5fa",
    flexShrink: 0,
    minWidth: "50px",
    display: "flex",
    alignItems: "center",
    gap: "2px",
    fontSize: "9px",
  },

  message: {
    color: "#10b981",
    flexShrink: 1,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap" as const,
    fontSize: "10px",
    minWidth: "100px",
  },

  data: {
    color: "#fbbf24",
    flexShrink: 0,
    overflow: "visible", // Allow full width display
    textOverflow: "clip", // Remove ellipsis truncation
    whiteSpace: "text-wrap" as const,
    backgroundColor: "#78350f22",
    padding: "1px 3px",
    borderRadius: "2px",
    fontSize: "9px",
  },

  truncationWarning: {
    color: "#fbbf24",
    fontSize: "10px",
    textAlign: "center" as const,
    fontFamily: "monospace",
    padding: "4px 8px",
    backgroundColor: "#78350f22",
    borderRadius: "3px",
    marginBottom: "4px",
    border: "1px solid #78350f44",
  },

  emptyState: {
    color: "#6b7280",
    fontSize: "12px",
    textAlign: "center" as const,
    fontFamily: "monospace",
    padding: "40px",
  },
} as const;

/**
 * Generate alternating background color for log entries
 */
export const getLogEntryBackgroundColor = (index: number): string => {
  return index % 2 === 0 ? "#00000040" : "transparent";
};

/**
 * Test function to verify Next.js object handling in safeJsonStringify
 * This can be called from the browser console to test the fix
 */
export const testNextJsObjectHandling = () => {
  console.group("🧪 Next.js Object Handling Test");

  // Test objects that would normally trigger Next.js warnings
  const testObjects = {
    normalObject: { name: "test", value: 123 },
    paramsLike: { params: "fake-params-object" },
    searchParamsLike: { searchParams: "fake-search-params" },
    nestedNextJs: {
      data: {
        params: { id: "123" },
        searchParams: { query: "test" },
      },
    },
  };

  Object.entries(testObjects).forEach(([name, obj]) => {
    try {
      const result = safeJsonStringify(obj, 2);
      console.log(`✅ ${name}:`, result);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  });

  console.log(
    "\n💡 If you see '[Next.js Params Object]' or '[Next.js SearchParams Object]' above,"
  );
  console.log(
    "   the fix is working and preventing Next.js enumeration warnings!"
  );

  console.groupEnd();
};
