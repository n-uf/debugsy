/**
 * JSON Expansion Performance Testing Utilities
 *
 * This module provides tools to measure and analyze the performance of JSON expansion
 * transitions in debug logs, helping validate optimizations and identify bottlenecks.
 */

import { formatDataForDisplay } from "./json-display";
import {
  isLikelyLargeObject,
  memoizedJsonStringify,
  smartJsonStringify,
} from "./json-performance";

/**
 * Performance phases during JSON expansion
 */
export interface ExpansionPerformanceMetrics {
  // Pre-expansion phase
  detectionTime: number;
  jsonProcessingTime: number;
  memoizationTime: number;

  // React rendering phase (measured externally)
  componentMountTime?: number;
  jsonViewRenderTime?: number;

  // Total times
  preRenderTime: number;
  totalTime?: number;

  // Object characteristics
  objectSize: "small" | "medium" | "large" | "very-large";
  isReactComponent: boolean;
  keyCount: number;
  estimatedDOMNodes?: number;
}

/**
 * Measure JSON expansion performance for a given log data object
 */
export const measureExpansionPerformance = (
  logData: any
): ExpansionPerformanceMetrics => {
  const startTime = performance.now();

  // Phase 1: Object detection
  const detectionStart = performance.now();
  const isLarge = isLikelyLargeObject(logData);
  const detectionTime = performance.now() - detectionStart;

  // Phase 2: JSON string processing
  const processingStart = performance.now();
  const jsonString = isLarge
    ? smartJsonStringify(logData, 3, 20)
    : memoizedJsonStringify(logData, 2);
  const jsonProcessingTime = performance.now() - processingStart;

  // Phase 3: Memoization (display format)
  const memoStart = performance.now();
  const displayFormat = formatDataForDisplay(logData, 1000);
  const memoizationTime = performance.now() - memoStart;

  const preRenderTime = performance.now() - startTime;

  // Analyze object characteristics
  const keyCount =
    typeof logData === "object" && logData ? Object.keys(logData).length : 0;
  const objectSize = classifyObjectSize(keyCount, logData);
  const isReactComponent = checkReactComponent(logData);
  const estimatedDOMNodes = estimateDOMNodes(logData);

  return {
    detectionTime,
    jsonProcessingTime,
    memoizationTime,
    preRenderTime,
    objectSize,
    isReactComponent,
    keyCount,
    estimatedDOMNodes,
  };
};

/**
 * Classify object size for performance categorization
 */
const classifyObjectSize = (
  keyCount: number,
  data: any
): "small" | "medium" | "large" | "very-large" => {
  if (Array.isArray(data)) {
    if (data.length <= 10) return "small";
    if (data.length <= 100) return "medium";
    if (data.length <= 1000) return "large";
    return "very-large";
  }

  if (keyCount <= 10) return "small";
  if (keyCount <= 50) return "medium";
  if (keyCount <= 200) return "large";
  return "very-large";
};

/**
 * Check if object appears to be a React component
 */
const checkReactComponent = (data: any): boolean => {
  if (!data || typeof data !== "object") return false;

  return !!(
    data._owner !== undefined ||
    data.elementType !== undefined ||
    data.type !== undefined ||
    "key" in data ||
    "ref" in data ||
    data.props !== undefined
  );
};

/**
 * Estimate number of DOM nodes that JsonView will create
 */
const estimateDOMNodes = (data: any): number => {
  if (!data || typeof data !== "object") return 1;

  let nodeCount = 1; // Root node

  if (Array.isArray(data)) {
    nodeCount += Math.min(data.length * 2, 100); // Limit estimation
  } else {
    const keys = Object.keys(data);
    nodeCount += Math.min(keys.length * 3, 150); // Key + value + container
  }

  return nodeCount;
};

/**
 * Benchmark expansion performance across multiple test objects
 */
export const benchmarkExpansionPerformance = (
  testObjects: Array<{ name: string; data: any }>,
  iterations: number = 10
) => {
  console.group("🚀 JSON Expansion Performance Benchmark");

  const results: Array<{
    name: string;
    metrics: ExpansionPerformanceMetrics;
    avgTimes: any;
  }> = [];

  testObjects.forEach(({ name, data }) => {
    console.log(`\n📋 Testing: ${name}`);

    const measurements: ExpansionPerformanceMetrics[] = [];

    // Run multiple iterations
    for (let i = 0; i < iterations; i++) {
      measurements.push(measureExpansionPerformance(data));
    }

    if (measurements.length === 0) {
      console.log(`  ❌ No measurements recorded for ${name}`);
      return;
    }

    // Calculate averages
    const avgMetrics = {
      detectionTime:
        measurements.reduce((sum, m) => sum + m.detectionTime, 0) / iterations,
      jsonProcessingTime:
        measurements.reduce((sum, m) => sum + m.jsonProcessingTime, 0) /
        iterations,
      memoizationTime:
        measurements.reduce((sum, m) => sum + m.memoizationTime, 0) /
        iterations,
      preRenderTime:
        measurements.reduce((sum, m) => sum + m.preRenderTime, 0) / iterations,
    };

    const sampleMetrics = measurements[0]!; // Safe because we checked length above

    console.log(`  🔍 Detection: ${avgMetrics.detectionTime.toFixed(3)}ms avg`);
    console.log(
      `  📝 JSON Processing: ${avgMetrics.jsonProcessingTime.toFixed(3)}ms avg`
    );
    console.log(
      `  🧠 Memoization: ${avgMetrics.memoizationTime.toFixed(3)}ms avg`
    );
    console.log(
      `  ⏱️  Pre-render Total: ${avgMetrics.preRenderTime.toFixed(3)}ms avg`
    );
    console.log(`  📊 Object Size: ${sampleMetrics.objectSize}`);
    console.log(`  🔑 Key Count: ${sampleMetrics.keyCount}`);
    console.log(
      `  ⚛️  React Component: ${sampleMetrics.isReactComponent ? "Yes" : "No"}`
    );
    console.log(
      `  🏗️  Estimated DOM Nodes: ${sampleMetrics.estimatedDOMNodes}`
    );

    results.push({ name, metrics: sampleMetrics, avgTimes: avgMetrics });
  });

  // Summary analysis
  console.log("\n📈 Performance Summary:");
  results.forEach(({ name, avgTimes, metrics }) => {
    const totalEstimate =
      avgTimes.preRenderTime + (metrics.estimatedDOMNodes || 0) * 0.1; // Estimate JsonView time
    console.log(
      `  ${name}: ${totalEstimate.toFixed(1)}ms estimated total (${metrics.objectSize})`
    );
  });

  console.groupEnd();
  return results;
};

/**
 * Create test objects for performance benchmarking
 */
export const createTestObjects = () => {
  return [
    {
      name: "Small Object",
      data: {
        id: 1,
        name: "test",
        active: true,
        timestamp: Date.now(),
      },
    },
    {
      name: "Medium Object",
      data: Object.fromEntries(
        Array.from({ length: 50 }, (_, i) => [`prop${i}`, `value${i}`])
      ),
    },
    {
      name: "Large Object",
      data: Object.fromEntries(
        Array.from({ length: 200 }, (_, i) => [
          `prop${i}`,
          { nested: `value${i}`, count: i },
        ])
      ),
    },
    {
      name: "Very Large Object",
      data: Object.fromEntries(
        Array.from({ length: 1000 }, (_, i) => [
          `prop${i}`,
          {
            nested: `value${i}`,
            count: i,
            details: Array.from({ length: 5 }, (_, j) => `item${j}`),
          },
        ])
      ),
    },
    {
      name: "Large Array",
      data: Array.from({ length: 500 }, (_, i) => ({
        id: i,
        value: `item${i}`,
      })),
    },
    {
      name: "React Component (Mock)",
      data: {
        _owner: { tag: 0, key: null },
        elementType: "div",
        type: "(param)=>{ ".repeat(1000) + "return jsx; }",
        key: null,
        ref: null,
        props: { children: "test" },
      },
    },
    {
      name: "Compiled React Component (Mock)",
      data: {
        _owner: { tag: 0, key: null },
        elementType: { name: "MyComponent" },
        type: "__TURBOPACK__compiled__module__" + "x".repeat(5000),
        key: null,
        ref: null,
        props: { width: 1200, height: 800 },
      },
    },
  ];
};

/**
 * Performance target validation
 */
export const validatePerformanceTargets = (
  metrics: ExpansionPerformanceMetrics
): {
  meetsTargets: boolean;
  recommendations: string[];
} => {
  const recommendations: string[] = [];
  let meetsTargets = true;

  // Detection should be very fast
  if (metrics.detectionTime > 0.01) {
    meetsTargets = false;
    recommendations.push(
      "Detection time too slow - optimize isLikelyLargeObject"
    );
  }

  // JSON processing targets based on object size
  const processingTargets = {
    small: 1,
    medium: 5,
    large: 20,
    "very-large": 50,
  };

  const target = processingTargets[metrics.objectSize];
  if (metrics.jsonProcessingTime > target) {
    meetsTargets = false;
    recommendations.push(
      `JSON processing too slow for ${metrics.objectSize} object (${metrics.jsonProcessingTime.toFixed(2)}ms > ${target}ms)`
    );
  }

  // Pre-render total should be under budget
  const preRenderTargets = {
    small: 2,
    medium: 10,
    large: 30,
    "very-large": 70,
  };

  const preRenderTarget = preRenderTargets[metrics.objectSize];
  if (metrics.preRenderTime > preRenderTarget) {
    meetsTargets = false;
    recommendations.push(
      `Pre-render time exceeds budget for ${metrics.objectSize} object`
    );
  }

  // React components should have special handling
  if (metrics.isReactComponent && metrics.jsonProcessingTime > 10) {
    recommendations.push(
      "React component processing could be optimized further"
    );
  }

  return { meetsTargets, recommendations };
};

/**
 * React Profiler integration for measuring component render times
 */
export const createExpansionProfiler = (onProfile: (metrics: any) => void) => {
  return {
    onRender: (
      id: string,
      phase: "mount" | "update",
      actualDuration: number,
      baseDuration: number,
      startTime: number,
      commitTime: number
    ) => {
      if (id.includes("DefaultExpandedContent") || id.includes("JsonView")) {
        onProfile({
          component: id,
          phase,
          actualDuration,
          baseDuration,
          startTime,
          commitTime,
        });
      }
    },
  };
};

/**
 * Console utilities for easy performance testing
 */
export const ExpansionPerformanceUtils = {
  /**
   * Quick test with sample objects
   */
  quickTest: () => {
    const testObjects = createTestObjects().slice(0, 4); // Test first 4 objects
    return benchmarkExpansionPerformance(testObjects, 5);
  },

  /**
   * Test a specific object
   */
  testObject: (data: any, name: string = "Custom Object") => {
    const metrics = measureExpansionPerformance(data);
    const validation = validatePerformanceTargets(metrics);

    console.group(`🔍 Performance Test: ${name}`);
    console.log("Metrics:", metrics);
    console.log("Meets targets:", validation.meetsTargets);
    if (validation.recommendations.length > 0) {
      console.log("Recommendations:", validation.recommendations);
    }
    console.groupEnd();

    return { metrics, validation };
  },

  /**
   * Full benchmark suite
   */
  fullBenchmark: () => {
    const testObjects = createTestObjects();
    return benchmarkExpansionPerformance(testObjects, 10);
  },
};

/**
 * Export for console usage:
 *
 * import { ExpansionPerformanceUtils } from './expansion-performance-utils';
 *
 * // Quick test
 * ExpansionPerformanceUtils.quickTest();
 *
 * // Test specific object
 * ExpansionPerformanceUtils.testObject(myLogData);
 *
 * // Full benchmark
 * ExpansionPerformanceUtils.fullBenchmark();
 */
