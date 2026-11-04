/**
 * Diff utilities for comparing objects and displaying changes
 * Adapted from debugsy's object-depth-utils
 */

export interface DiffEntry {
  key: string;
  from: any;
  to: any;
  type: "added" | "removed" | "changed";
}

/**
 * Fast shallow diff between two objects
 * Uses optimized comparison with early exits
 * Time limit: 8ms max to prevent blocking
 */
export function createObjectDiff(
  fromObj: any,
  toObj: any,
  maxEntries: number = 20
): DiffEntry[] {
  const startTime = performance.now();
  const MAX_DIFF_TIME = 8; // 8ms time limit
  const diffs: DiffEntry[] = [];

  // Fast path: same reference
  if (fromObj === toObj) return diffs;

  // Fast path: null/undefined cases
  if (fromObj == null || toObj == null) {
    if (fromObj !== toObj) {
      diffs.push({
        key: "[root]",
        from: fromObj,
        to: toObj,
        type: fromObj == null ? "added" : "removed",
      });
    }
    return diffs;
  }

  // Fast path: different types
  if (typeof fromObj !== typeof toObj) {
    diffs.push({
      key: "[root]",
      from: fromObj,
      to: toObj,
      type: "changed",
    });
    return diffs;
  }

  // Fast path: non-objects
  if (typeof fromObj !== "object") {
    if (fromObj !== toObj) {
      diffs.push({
        key: "[root]",
        from: fromObj,
        to: toObj,
        type: "changed",
      });
    }
    return diffs;
  }

  // Object comparison with time limits
  try {
    const fromKeys = Object.keys(fromObj || {});
    const toKeys = Object.keys(toObj || {});
    const allKeys = new Set([...fromKeys, ...toKeys]);

    let processedCount = 0;

    for (const key of allKeys) {
      // Time limit check every 5 keys
      if (
        processedCount % 5 === 0 &&
        performance.now() - startTime > MAX_DIFF_TIME
      ) {
        break;
      }

      // Entry limit check
      if (diffs.length >= maxEntries) {
        break;
      }

      const fromValue = fromObj[key];
      const toValue = toObj[key];

      if (!(key in fromObj)) {
        // Added
        diffs.push({
          key,
          from: undefined,
          to: toValue,
          type: "added",
        });
      } else if (!(key in toObj)) {
        // Removed
        diffs.push({
          key,
          from: fromValue,
          to: undefined,
          type: "removed",
        });
      } else if (fromValue !== toValue) {
        // Changed (shallow comparison for performance)
        diffs.push({
          key,
          from: fromValue,
          to: toValue,
          type: "changed",
        });
      }

      processedCount++;
    }

    // Add truncation marker if we hit limits
    if (allKeys.size > processedCount || diffs.length >= maxEntries) {
      diffs.push({
        key: "[...truncated]",
        from: `${allKeys.size - processedCount} more changes`,
        to: "See full objects below",
        type: "changed",
      });
    }
  } catch (error) {
    // Fallback for problematic objects
    diffs.push({
      key: "[diff error]",
      from: "Comparison failed",
      to: error instanceof Error ? error.message : "Unknown error",
      type: "changed",
    });
  }

  return diffs;
}

/**
 * Get diff summary string for quick overview
 * Returns compact description of changes
 */
export function getDiffSummary(diffs: DiffEntry[]): string {
  if (diffs.length === 0) return "No changes";

  const counts = {
    added: diffs.filter((d) => d.type === "added").length,
    removed: diffs.filter((d) => d.type === "removed").length,
    changed: diffs.filter((d) => d.type === "changed").length,
  };

  const parts = [];
  if (counts.added > 0) parts.push(`+${counts.added}`);
  if (counts.removed > 0) parts.push(`-${counts.removed}`);
  if (counts.changed > 0) parts.push(`~${counts.changed}`);

  return parts.join(" ");
}

/**
 * Enhanced object display for diff entries
 * Provides human-readable representation of values
 */
export function getEnhancedObjectDisplay(value: any): {
  display: string;
  type: string;
} {
  if (value === undefined) {
    return { display: "undefined", type: "undefined" };
  }

  if (value === null) {
    return { display: "null", type: "null" };
  }

  const type = typeof value;

  if (type === "string") {
    // Truncate long strings
    const truncated = value.length > 50 ? `${value.slice(0, 50)}...` : value;
    return { display: `"${truncated}"`, type: "string" };
  }

  if (type === "number" || type === "boolean") {
    return { display: String(value), type };
  }

  if (type === "function") {
    const funcStr = value.toString();
    const match = funcStr.match(/^(async\s+)?function\s*([^(]*)/);
    const name = match?.[2] || "anonymous";
    return { display: `ƒ ${name}()`, type: "function" };
  }

  if (Array.isArray(value)) {
    return { display: `Array(${value.length})`, type: "array" };
  }

  if (type === "object") {
    try {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return { display: "{}", type: "object" };
      }
      return { display: `{${keys.length} keys}`, type: "object" };
    } catch {
      return { display: "{...}", type: "object" };
    }
  }

  return { display: String(value), type };
}
