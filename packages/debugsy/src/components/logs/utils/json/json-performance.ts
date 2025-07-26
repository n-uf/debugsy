/**
 * JSON Performance Optimization Utilities
 *
 * This module provides performance-focused JSON utilities that prevent browser freezing
 * when dealing with large or complex objects. It includes memoization, size detection,
 * and smart truncation strategies.
 */

import { safeJsonStringify } from "./json-core";

/**
 * Memoization cache for JSON stringification results
 * Prevents repeated expensive JSON.stringify operations for the same data
 */
const jsonStringifyCache = new WeakMap<
  object,
  Map<number | undefined, string>
>();

/**
 * Detect if an object is likely to be very large before expensive operations
 * OPTIMIZED: Fast-path detection with minimal overhead for small objects
 */
export const isLikelyLargeObject = (obj: any): boolean => {
  if (!obj || typeof obj !== "object") return false;

  try {
    // FAST PATH: Check array length first (fastest check)
    if (Array.isArray(obj)) {
      return obj.length > 500;
    }

    // FAST PATH: Quick React component detection without full Object.keys()
    if (hasReactComponentStructure(obj)) {
      // Check for huge type property directly (most common case)
      if (obj.type && typeof obj.type === "string" && obj.type.length > 3000) {
        return true;
      }
      // Check for compiled patterns in type (fast string includes)
      if (obj.type && typeof obj.type === "string" && obj.type.length > 500) {
        return hasCompiledCodePatterns(obj.type);
      }
    }

    // OPTIMIZED: Get keys only once and cache the length
    const keys = Object.keys(obj);
    const keyCount = keys.length;

    // FAST PATH: Many top-level keys = definitely large
    if (keyCount > 100) return true;

    // FAST PATH: For small objects (<=10 props), do minimal checking
    if (keyCount <= 10) {
      // Quick check for any obviously large strings
      for (let i = 0; i < keyCount; i++) {
        const key = keys[i];
        if (key === undefined) continue;
        const value = obj[key];
        if (typeof value === "string" && value.length > 10000) return true;
      }
      return false; // Small object with no huge strings = safe
    }

    // MEDIUM PATH: For medium objects (11-100 props), check up to 10 properties
    const maxPropertiesToCheck = Math.min(keyCount, 10); // Reduced from 20
    for (let i = 0; i < maxPropertiesToCheck; i++) {
      const key = keys[i];
      if (key === undefined) continue;
      const value = obj[key];

      // Check for huge strings (lowered threshold for better detection)
      if (typeof value === "string" && value.length > 5000) return true;

      // Limited nested checking (only for first few properties)
      if (i < 3 && typeof value === "object" && value !== null) {
        // Fast check: if nested object has many keys, it's likely large
        if (
          Array.isArray(value)
            ? value.length > 100
            : Object.keys(value).length > 50
        ) {
          return true;
        }
      }
    }

    return false;
  } catch {
    // If any error occurs during inspection, assume it might be large
    return true;
  }
};

/**
 * OPTIMIZED: Fast React component structure detection without full enumeration
 */
const hasReactComponentStructure = (obj: any): boolean => {
  // Fast property existence checks (faster than Object.keys)
  return !!(
    obj._owner !== undefined ||
    obj.elementType !== undefined ||
    obj.type !== undefined ||
    obj.key !== undefined ||
    obj.ref !== undefined ||
    obj.props !== undefined
  );
};

/**
 * OPTIMIZED: Fast compiled code pattern detection
 */
const hasCompiledCodePatterns = (typeString: string): boolean => {
  // Use indexOf instead of includes for better performance
  return (
    typeString.indexOf("__TURBOPACK__") !== -1 ||
    typeString.indexOf("__webpack_require__") !== -1 ||
    typeString.indexOf("node_modules") !== -1 ||
    typeString.indexOf("$28$ecmascript$29$") !== -1 ||
    typeString.indexOf("_imported_module_") !== -1
  );
};

/**
 * Smart JSON stringification with size limits to prevent browser freezing
 * Enhanced to handle React components with compiled code
 */
export const smartJsonStringify = (
  obj: any,
  maxDepth: number = 3,
  maxKeys: number = 20
): string => {
  if (obj === null) return "null";
  if (obj === undefined) return '"undefined"';
  if (typeof obj !== "object") return JSON.stringify(obj);

  // Detect likely large objects early
  if (isLikelyLargeObject(obj)) {
    // Special handling for React components
    if (isReactComponentWithCompiledCode(obj)) {
      return formatReactComponentSummary(obj);
    }

    return `[Large Object: ${Array.isArray(obj) ? `Array(${obj.length})` : `Object(${Object.keys(obj).length} keys)`}]`;
  }

  try {
    const truncateObject = (value: any, depth: number): any => {
      if (depth <= 0) return "[Max Depth Reached]";
      if (value === null || value === undefined) return value;
      if (typeof value !== "object") {
        // Handle potentially large strings
        if (typeof value === "string" && value.length > 500) {
          return `[Large String: ${value.length} chars] "${value.substring(0, 100)}..."`;
        }
        return value;
      }

      if (Array.isArray(value)) {
        if (value.length > maxKeys) {
          return [
            ...value.slice(0, maxKeys),
            `... ${value.length - maxKeys} more items`,
          ];
        }
        return value.map((item) => truncateObject(item, depth - 1));
      }

      const keys = Object.keys(value);
      if (keys.length > maxKeys) {
        const result: any = {};
        keys.slice(0, maxKeys).forEach((key) => {
          result[key] = truncateObject(value[key], depth - 1);
        });
        result["..."] = `${keys.length - maxKeys} more properties`;
        return result;
      }

      const result: any = {};
      keys.forEach((key) => {
        const val = value[key];

        // Special handling for known problematic React properties
        if (key === "type" && typeof val === "string" && val.length > 1000) {
          result[key] =
            `[Compiled Component: ${val.length} chars] ${val.substring(0, 100)}...`;
        } else if (key === "type" && typeof val === "function") {
          try {
            const funcStr = val.toString();
            if (funcStr.length > 1000) {
              result[key] =
                `[Large Function: ${funcStr.length} chars] ${funcStr.substring(0, 100)}...`;
            } else {
              result[key] = `[Function: ${val.name || "anonymous"}]`;
            }
          } catch {
            result[key] = "[Function: unable to stringify]";
          }
        } else {
          result[key] = truncateObject(val, depth - 1);
        }
      });
      return result;
    };

    return JSON.stringify(truncateObject(obj, maxDepth), null, 2);
  } catch (error) {
    return `[Error: ${error instanceof Error ? error.message : "Unable to stringify"}]`;
  }
};

/**
 * Detect React components with compiled code (like Turbopack/Next.js compiled components)
 * These objects often have huge strings in the 'type' property containing the entire compiled component
 */
const isReactComponentWithCompiledCode = (obj: any): boolean => {
  try {
    // Check for React component-like structure
    const hasReactStructure =
      obj._owner !== undefined ||
      obj.elementType !== undefined ||
      obj.type !== undefined ||
      obj.key !== undefined ||
      obj.ref !== undefined ||
      obj.props !== undefined;

    if (!hasReactStructure) return false;

    // Check specifically for huge 'type' property (common in compiled components)
    if (obj.type && typeof obj.type === "string" && obj.type.length > 3000) {
      return true;
    }

    // Check for function 'type' that might contain huge toString() content
    if (obj.type && typeof obj.type === "function") {
      try {
        const functionString = obj.type.toString();
        if (functionString.length > 5000) return true;
      } catch {
        // If toString() fails, assume it might be problematic
        return true;
      }
    }

    // Check for compiled code patterns in the type string
    if (obj.type && typeof obj.type === "string") {
      const hasCompiledPatterns =
        obj.type.includes("__TURBOPACK__") ||
        obj.type.includes("__webpack_require__") ||
        obj.type.includes("node_modules") ||
        obj.type.includes("$28$ecmascript$29$") ||
        obj.type.includes("_imported_module_");

      if (hasCompiledPatterns && obj.type.length > 1000) return true;
    }

    // Check elementType as well (another common location for compiled code)
    if (
      obj.elementType &&
      typeof obj.elementType === "string" &&
      obj.elementType.length > 3000
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Format a React component with compiled code into a readable summary
 */
const formatReactComponentSummary = (obj: any): string => {
  try {
    const parts = [];

    // Basic component info
    if (obj.tag !== undefined) parts.push(`Tag: ${obj.tag}`);
    if (obj.key !== null && obj.key !== undefined)
      parts.push(`Key: ${obj.key}`);

    // Type information (the problematic part)
    if (obj.type) {
      if (typeof obj.type === "string") {
        const typeLength = obj.type.length;
        if (typeLength > 1000) {
          // Extract component name if possible
          const nameMatch = obj.type.match(
            /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/
          );
          const componentName = nameMatch ? nameMatch[1] : "Unknown";
          parts.push(
            `Type: [Compiled Component: ${componentName}, ${typeLength} chars]`
          );
        } else {
          parts.push(
            `Type: "${obj.type.substring(0, 50)}${obj.type.length > 50 ? "..." : ""}"`
          );
        }
      } else if (typeof obj.type === "function") {
        parts.push(`Type: [Function: ${obj.type.name || "anonymous"}]`);
      } else {
        parts.push(`Type: ${JSON.stringify(obj.type)}`);
      }
    }

    // Element type
    if (obj.elementType && obj.elementType !== obj.type) {
      if (typeof obj.elementType === "string" && obj.elementType.length > 100) {
        parts.push(
          `ElementType: [Large String: ${obj.elementType.length} chars]`
        );
      } else {
        parts.push(`ElementType: ${JSON.stringify(obj.elementType)}`);
      }
    }

    // Other properties count
    const allKeys = Object.keys(obj);
    const handledKeys = ["tag", "key", "type", "elementType"];
    const otherKeys = allKeys.filter((k) => !handledKeys.includes(k));
    if (otherKeys.length > 0) {
      parts.push(
        `Other Properties: ${otherKeys.length} (${otherKeys.slice(0, 3).join(", ")}${otherKeys.length > 3 ? "..." : ""})`
      );
    }

    return `[React Component: ${parts.join(", ")}]`;
  } catch {
    return "[React Component: Unable to format]";
  }
};

/**
 * OPTIMIZED: Memoized JSON stringify with fast-path for small objects
 * Reduces caching overhead for simple objects that stringify quickly
 */
export const memoizedJsonStringify = (obj: any, space?: number): string => {
  // For primitive values, just stringify directly (no memoization needed)
  if (obj === null || typeof obj !== "object") {
    return safeJsonStringify(obj, space);
  }

  // FAST PATH: For small objects, skip memoization overhead
  // Small objects stringify quickly, so caching overhead isn't worth it
  if (isSmallObjectForDirectStringify(obj)) {
    return safeJsonStringify(obj, space);
  }

  // CACHED PATH: Use memoization for larger objects only
  let spaceCache = jsonStringifyCache.get(obj);
  if (!spaceCache) {
    spaceCache = new Map();
    jsonStringifyCache.set(obj, spaceCache);
  }

  const cached = spaceCache.get(space);
  if (cached !== undefined) {
    return cached;
  }

  const result = safeJsonStringify(obj, space);
  spaceCache.set(space, result);
  return result;
};

/**
 * OPTIMIZED: Fast check for small objects that don't need memoization
 */
const isSmallObjectForDirectStringify = (obj: any): boolean => {
  // Arrays with few elements
  if (Array.isArray(obj)) {
    return obj.length <= 5;
  }

  // Objects with few properties (check length only, no enumeration)
  try {
    const keyCount = Object.keys(obj).length;
    return keyCount <= 5;
  } catch {
    return false; // If Object.keys fails, treat as complex
  }
};

/**
 * Performance-aware JSON stringification that chooses the best strategy
 * based on object size and complexity
 */
export const performantJsonStringify = (obj: any, space?: number): string => {
  // For likely large objects, use smart stringification to prevent freezing
  if (isLikelyLargeObject(obj)) {
    return smartJsonStringify(obj, 3, 20);
  }

  // For smaller objects, use memoized stringification for better caching
  return memoizedJsonStringify(obj, space);
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
 * Get cache statistics for debugging and monitoring
 */
export const getJsonCacheStats = (): {
  description: string;
  recommendation: string;
} => {
  // Since WeakMap doesn't expose size, we can't get exact stats
  // But we can provide useful information about the caching strategy
  return {
    description:
      "Memoization cache uses WeakMap for automatic memory management",
    recommendation:
      "Cache will automatically clear when objects are garbage collected",
  };
};

/**
 * Performance testing utility to benchmark different stringification strategies
 * ENHANCED: Includes overhead analysis for log rendering scenarios
 */
export const benchmarkJsonMethods = (
  testObject: any,
  iterations: number = 100
) => {
  console.group("📊 JSON Performance Benchmark");

  const methods = [
    { name: "safeJsonStringify", fn: () => safeJsonStringify(testObject, 2) },
    {
      name: "memoizedJsonStringify",
      fn: () => memoizedJsonStringify(testObject, 2),
    },
    {
      name: "smartJsonStringify",
      fn: () => smartJsonStringify(testObject, 3, 20),
    },
    {
      name: "performantJsonStringify",
      fn: () => performantJsonStringify(testObject, 2),
    },
  ];

  // Warm up the cache for memoized operations
  memoizedJsonStringify(testObject, 2);

  methods.forEach(({ name, fn }) => {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      fn();
    }

    const end = performance.now();
    const avgTime = (end - start) / iterations;

    console.log(
      `${name}: ${avgTime.toFixed(3)}ms avg (${iterations} iterations)`
    );
  });

  console.log(`\n🔍 Object analysis:`);
  console.log(`- Is likely large: ${isLikelyLargeObject(testObject)}`);
  console.log(
    `- Keys count: ${typeof testObject === "object" && testObject ? Object.keys(testObject).length : "N/A"}`
  );
  console.log(
    `- Is React component: ${hasReactComponentStructure(testObject)}`
  );

  console.groupEnd();
};

/**
 * PERFORMANCE ANALYSIS: Measure overhead of detection functions
 * Use this to validate that our optimizations are actually faster
 */
export const analyzeDetectionOverhead = (
  testObjects: any[],
  iterations: number = 1000
) => {
  console.group("⚡ Detection Overhead Analysis");

  const detectionMethods = [
    { name: "isLikelyLargeObject", fn: (obj: any) => isLikelyLargeObject(obj) },
    {
      name: "hasReactComponentStructure",
      fn: (obj: any) => hasReactComponentStructure(obj),
    },
    {
      name: "isSmallObjectForDirectStringify",
      fn: (obj: any) => isSmallObjectForDirectStringify(obj),
    },
  ];

  testObjects.forEach((testObj, index) => {
    console.log(`\n📋 Test Object ${index + 1}:`);

    detectionMethods.forEach(({ name, fn }) => {
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        fn(testObj);
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;
      const result = fn(testObj);

      console.log(`  ${name}: ${avgTime.toFixed(4)}ms avg → ${result}`);
    });
  });

  console.groupEnd();
};

/**
 * LOG RENDERING SIMULATION: Test actual log rendering scenarios
 * Simulates the performance impact on real log rendering workflows
 */
export const simulateLogRenderingPerformance = (
  logEntries: any[],
  iterations: number = 50
) => {
  console.group("🖥️ Log Rendering Performance Simulation");

  const scenarios = [
    {
      name: "formatDataForDisplay (preview)",
      fn: (data: any) => formatDataForDisplay(data, 100),
    },
    {
      name: "isLikelyLargeObject (detection)",
      fn: (data: any) => isLikelyLargeObject(data),
    },
    {
      name: "memoizedJsonStringify (tooltip)",
      fn: (data: any) => (data ? memoizedJsonStringify(data) : ""),
    },
  ];

  // Import formatDataForDisplay
  const { formatDataForDisplay } = require("./json-display");

  scenarios.forEach(({ name, fn }) => {
    const start = performance.now();

    for (let i = 0; i < iterations; i++) {
      logEntries.forEach((logEntry) => {
        if (logEntry && logEntry.data) {
          fn(logEntry.data);
        }
      });
    }

    const end = performance.now();
    const totalOperations = iterations * logEntries.length;
    const avgTime = (end - start) / totalOperations;

    console.log(
      `${name}: ${avgTime.toFixed(4)}ms per log entry (${totalOperations} operations)`
    );
  });

  // Calculate total overhead per log render cycle
  const allDataObjects = logEntries.map((entry) => entry?.data).filter(Boolean);
  const renderCycleStart = performance.now();

  allDataObjects.forEach((data) => {
    // Simulate what happens during actual log rendering
    isLikelyLargeObject(data); // Detection
    formatDataForDisplay(data, 100); // Preview generation
    if (Math.random() > 0.7) {
      // ~30% chance tooltip is generated
      memoizedJsonStringify(data);
    }
  });

  const renderCycleEnd = performance.now();
  const cycleTime = renderCycleEnd - renderCycleStart;

  console.log(
    `\n📊 Full render cycle: ${cycleTime.toFixed(2)}ms for ${allDataObjects.length} log entries`
  );
  console.log(
    `📊 Average per log: ${(cycleTime / allDataObjects.length).toFixed(4)}ms`
  );

  console.groupEnd();
};
