/**
 * JSON Performance Optimization Utilities
 *
 * This module provides performance-focused JSON utilities that prevent browser freezing
 * when dealing with large or complex objects. It includes memoization, size detection,
 * and smart truncation strategies.
 */

import { safeJsonStringify, safeSuperjsonStringify } from "./json-core";

/**
 * SIMPLIFIED: Performance JSON utilities using safe superjson
 * UNIFIED: Uses safeSuperjsonStringify for consistent safe serialization
 */

/**
 * Enhanced JSON stringify for performance analysis using safe superjson
 */
export const performanceJsonStringify = (obj: any, space?: number): string => {
  try {
    return safeSuperjsonStringify(obj);
  } catch (error) {
    return `[Serialization Error: ${error instanceof Error ? error.message : "Unknown"}]`;
  }
};

/**
 * Benchmark different serialization methods
 * UPDATED: Now includes safeSuperjsonStringify in benchmarks
 */
export const benchmarkSerialization = (testObject: any) => {
  const iterations = 100;
  const methods = [
    {
      name: "safeSuperjsonStringify",
      fn: () => safeSuperjsonStringify(testObject),
    },
    { name: "safeJsonStringify", fn: () => safeJsonStringify(testObject) },
  ];

  const results = methods.map(({ name, fn }) => {
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
      try {
        fn();
      } catch (error) {
        // Count errors but continue
      }
    }
    const end = performance.now();
    return {
      method: name,
      totalTime: end - start,
      avgTime: (end - start) / iterations,
      iterations,
    };
  });

  return results;
};
