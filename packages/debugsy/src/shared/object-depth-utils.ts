/**
 * High-performance object depth processing utilities
 * Optimized for low-latency operations on huge objects
 */

// Import safe serialization function
import { safeSuperjsonStringify } from "../debug-logs/components/logs/utils/json/json-core";

export type DepthSetting = "all" | "10" | "5" | "3" | "1" | "str";

// Performance constants
const MAX_STRING_LENGTH = 1000;
const MAX_PROCESSING_TIME_MS = 16; // ~1 frame at 60fps
const TRUNCATION_MARKER = "[...truncated]";
const DEPTH_LIMIT_MARKER = "[depth limit]";

/**
 * Performance-optimized object depth cutting using iterative approach
 * Avoids recursion stack overflow and provides early exit for huge objects
 */
export function cutObjectDepth(
  obj: any,
  maxDepth: number,
  options: {
    maxProcessingTime?: number;
    preserveArrayLength?: boolean;
  } = {}
): any {
  const {
    maxProcessingTime = MAX_PROCESSING_TIME_MS,
    preserveArrayLength = true,
  } = options;

  if (maxDepth <= 0) return DEPTH_LIMIT_MARKER;
  if (!obj || typeof obj !== "object") return obj;

  const startTime = performance.now();

  // Iterative processing using a work queue to avoid stack overflow
  const workQueue: Array<{
    source: any;
    target: any;
    key: string | number;
    depth: number;
  }> = [];

  let result: any;

  // Initialize based on object type
  if (Array.isArray(obj)) {
    result = preserveArrayLength ? new Array(obj.length) : [];
    // Process first few items immediately, queue the rest
    const immediateCount = Math.min(obj.length, 10);
    for (let i = 0; i < immediateCount; i++) {
      workQueue.push({ source: obj, target: result, key: i, depth: 1 });
    }
    // For large arrays, add remaining items to queue
    for (let i = immediateCount; i < obj.length; i++) {
      workQueue.push({ source: obj, target: result, key: i, depth: 1 });
    }
  } else {
    result = {};
    const keys = Object.keys(obj);
    // Process first few keys immediately, queue the rest
    const immediateCount = Math.min(keys.length, 10);
    for (let i = 0; i < immediateCount; i++) {
      const key = keys[i];
      if (key !== undefined) {
        workQueue.push({ source: obj, target: result, key, depth: 1 });
      }
    }
    // Queue remaining keys
    for (let i = immediateCount; i < keys.length; i++) {
      const key = keys[i];
      if (key !== undefined) {
        workQueue.push({ source: obj, target: result, key, depth: 1 });
      }
    }
  }

  // Process work queue with time limit
  let processedCount = 0;
  while (workQueue.length > 0) {
    // Check time limit every 100 operations
    if (
      processedCount % 100 === 0 &&
      performance.now() - startTime > maxProcessingTime
    ) {
      // Time limit exceeded - mark remaining as truncated
      if (Array.isArray(result)) {
        result.push(TRUNCATION_MARKER);
      } else {
        result["..."] = `${workQueue.length} more properties truncated`;
      }
      break;
    }

    const work = workQueue.shift()!;
    const { source, target, key, depth } = work;
    const value = source[key];

    processedCount++;

    if (depth >= maxDepth) {
      target[key] = DEPTH_LIMIT_MARKER;
      continue;
    }

    if (!value || typeof value !== "object") {
      target[key] = value;
      continue;
    }

    // Handle nested objects/arrays
    if (Array.isArray(value)) {
      const newArray = preserveArrayLength ? new Array(value.length) : [];
      target[key] = newArray;

      // Add array items to work queue
      const itemCount = Math.min(value.length, 50); // Limit for performance
      for (let i = 0; i < itemCount; i++) {
        workQueue.push({
          source: value,
          target: newArray,
          key: i,
          depth: depth + 1,
        });
      }

      // Mark if truncated
      if (value.length > itemCount) {
        newArray[itemCount] = `${value.length - itemCount} more items...`;
      }
    } else {
      const newObj: Record<string, any> = {};
      target[key] = newObj;

      // Add object properties to work queue
      const keys = Object.keys(value);
      const keyCount = Math.min(keys.length, 50); // Limit for performance
      for (let i = 0; i < keyCount; i++) {
        const propKey = keys[i];
        if (propKey !== undefined) {
          workQueue.push({
            source: value,
            target: newObj,
            key: propKey,
            depth: depth + 1,
          });
        }
      }

      // Mark if truncated
      if (keys.length > keyCount) {
        (newObj as Record<string, any>)["..."] =
          `${keys.length - keyCount} more properties`;
      }
    }
  }

  return result;
}

/**
 * Ultra-fast object to string conversion with length limit
 * Uses streaming approach for huge objects
 */
export function objectToString(
  obj: any,
  maxLength: number = MAX_STRING_LENGTH
): string {
  if (!obj || typeof obj !== "object") {
    return String(obj);
  }

  const startTime = performance.now();
  let result = "";
  let truncated = false;

  try {
    // For small objects, use fast path
    if (typeof obj === "object" && obj !== null) {
      const keyCount = Array.isArray(obj)
        ? obj.length
        : Object.keys(obj).length;
      if (keyCount <= 10) {
        result = safeSuperjsonStringify(obj);
        // Remove all newlines and extra whitespace for compact string mode
        result = result.replace(/\n/g, " ").replace(/\s+/g, " ");
        if (result.length > maxLength) {
          result = result.substring(0, maxLength - 3) + "...";
          truncated = true;
        }
        return result;
      }
    }

    // For large objects, use incremental building
    const isArray = Array.isArray(obj);
    result = isArray ? "[" : "{";
    let count = 0;
    const maxItems = 20; // Limit items for performance

    if (isArray) {
      for (let i = 0; i < Math.min(obj.length, maxItems); i++) {
        if (i > 0) result += ",";
        if (result.length > maxLength - 100) break;

        const item = obj[i];
        const itemStr =
          typeof item === "object" && item !== null
            ? "[Object]"
            : safeSuperjsonStringify(item)
                .replace(/\n/g, " ")
                .replace(/\s+/g, " ");
        result += itemStr;
        count++;
      }

      if (obj.length > count) {
        result += `, ...${obj.length - count} more`;
        truncated = true;
      }
      result += "]";
    } else {
      const keys = Object.keys(obj);
      for (let i = 0; i < Math.min(keys.length, maxItems); i++) {
        if (i > 0) result += ",";
        if (result.length > maxLength - 100) break;

        const key = keys[i];
        if (key === undefined) continue;

        const value = obj[key];
        const valueStr =
          typeof value === "object" && value !== null
            ? "[Object]"
            : safeSuperjsonStringify(value)
                .replace(/\n/g, " ")
                .replace(/\s+/g, " ");
        result += `"${key}":${valueStr}`;
        count++;
      }

      if (keys.length > count) {
        result += `, "...":"${keys.length - count} more properties"`;
        truncated = true;
      }
      result += "}";
    }

    // Final length check
    if (result.length > maxLength) {
      result = result.substring(0, maxLength - 3) + "...";
      truncated = true;
    }
  } catch (error) {
    // Fallback for problematic objects
    result = `[Object: ${typeof obj}] - ${error instanceof Error ? error.message : "Serialization failed"}`;
  }

  // Final cleanup: ensure no newlines in string mode output
  result = result.replace(/\n/g, " ").replace(/\s+/g, " ");

  return result;
}

/**
 * Main processing function - chooses optimal strategy based on setting
 * Designed for minimal latency even with huge objects
 */
export function processObjectForDisplay(obj: any, setting: DepthSetting): any {
  if (!obj) return obj;

  switch (setting) {
    case "str":
      return objectToString(obj, MAX_STRING_LENGTH);

    case "all":
      return obj; // No processing needed

    case "1":
      return cutObjectDepth(obj, 1, { maxProcessingTime: 8 }); // Extra fast for depth 1

    case "3":
      return cutObjectDepth(obj, 3, { maxProcessingTime: 10 });

    case "5":
      return cutObjectDepth(obj, 5, { maxProcessingTime: 12 });

    case "10":
      return cutObjectDepth(obj, 10, { maxProcessingTime: 16 });

    default:
      return obj;
  }
}

/**
 * Batch processing for multiple objects (e.g., in copy operations)
 * Uses time slicing to maintain responsiveness
 */
export function processObjectsBatch(
  objects: any[],
  setting: DepthSetting,
  callback: (processed: any[]) => void
): void {
  if (setting === "all") {
    callback(objects);
    return;
  }

  const processed: any[] = [];
  let index = 0;

  function processChunk() {
    const chunkStartTime = performance.now();
    const chunkSize = 10; // Process 10 objects per chunk

    while (index < objects.length && processed.length < objects.length) {
      processed.push(processObjectForDisplay(objects[index], setting));
      index++;

      // Time slice - yield control every 8ms
      if (performance.now() - chunkStartTime > 8) {
        setTimeout(processChunk, 0);
        return;
      }
    }

    callback(processed);
  }

  processChunk();
}

/**
 * Estimate processing cost for UI feedback
 */
export function estimateProcessingCost(obj: any): "low" | "medium" | "high" {
  if (!obj || typeof obj !== "object") return "low";

  try {
    const isArray = Array.isArray(obj);
    const size = isArray ? obj.length : Object.keys(obj).length;

    if (size <= 10) return "low";
    if (size <= 100) return "medium";
    return "high";
  } catch {
    return "high"; // If we can't analyze it, assume high cost
  }
}

/**
 * Get human-readable description of depth setting
 */
export function getDepthSettingDescription(setting: DepthSetting): string {
  switch (setting) {
    case "all":
      return "Full depth (no limits)";
    case "10":
      return "10 levels deep";
    case "5":
      return "5 levels deep";
    case "3":
      return "3 levels deep";
    case "1":
      return "1 level only";
    case "str":
      return "String format (1000 chars)";
    default:
      return "Unknown setting";
  }
}

/**
 * Test function to verify string mode handles circular references
 * Can be called from browser console: surfaceDebug.testStringMode()
 */
export function testStringMode(): void {
  console.group("🧪 Testing String Mode with Circular References");

  // Create a circular reference object (similar to React Fiber + DOM)
  const testObj: any = {
    name: "Test Object",
    nested: {
      level: 1,
      data: [1, 2, 3],
    },
  };

  // Add circular reference
  testObj.circular = testObj;
  testObj.nested.parent = testObj;

  try {
    const result = objectToString(testObj, 500);
    const hasNewlines = result.includes("\n");
    console.log("✅ String mode success:", result);
    console.log("✅ Length:", result.length, "chars");
    console.log(
      "📝 Contains newlines:",
      hasNewlines ? "❌ YES (should be fixed)" : "✅ NO (correct)"
    );
    if (hasNewlines) {
      console.log("🔍 First newline at position:", result.indexOf("\n"));
      console.log(
        "🔍 Preview around newline:",
        result.substring(result.indexOf("\n") - 20, result.indexOf("\n") + 20)
      );
    }
  } catch (error) {
    console.error("❌ String mode failed:", error);
  }

  console.groupEnd();
}
