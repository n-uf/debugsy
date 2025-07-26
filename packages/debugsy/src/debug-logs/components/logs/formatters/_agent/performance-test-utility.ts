/**
 * Performance Test Utility for Default Log Formatter
 *
 * This utility helps measure and verify the performance improvements
 * for large JSON objects in collapsed mode.
 */

// Type definition for DebugLogEntry (inline to avoid import issues)
interface DebugLogEntry {
  id: string;
  timestamp: number;
  point: string;
  message: string;
  data?: any;
}

/**
 * Generate test data of various sizes for performance testing
 */
export const generateTestData = {
  /**
   * Small object (≤50 properties)
   */
  small: (): any => ({
    id: "test-small",
    name: "Small Object",
    data: Array.from({ length: 20 }, (_, i) => ({ [`prop${i}`]: `value${i}` })),
    timestamp: Date.now(),
    status: "active",
  }),

  /**
   * Medium object (51-200 properties)
   */
  medium: (): any => {
    const obj: any = { id: "test-medium", type: "medium" };
    for (let i = 0; i < 150; i++) {
      obj[`property_${i}`] = {
        value: `data_${i}`,
        nested: { count: i, active: i % 2 === 0 },
      };
    }
    return obj;
  },

  /**
   * Large object (201-1000 properties)
   */
  large: (): any => {
    const obj: any = { id: "test-large", type: "large" };
    for (let i = 0; i < 800; i++) {
      obj[`prop_${i}`] = {
        data: `value_${i}`,
        meta: { index: i, processed: false },
        children: Array.from({ length: 5 }, (_, j) => ({
          id: j,
          value: `child_${j}`,
        })),
      };
    }
    return obj;
  },

  /**
   * Very large object (1000+ properties)
   */
  veryLarge: (): any => {
    const obj: any = { id: "test-very-large", type: "very-large" };
    for (let i = 0; i < 2000; i++) {
      obj[`item_${i}`] = {
        id: `item_${i}`,
        data: Array.from({ length: 10 }, (_, j) => `data_${i}_${j}`),
        metadata: {
          created: Date.now(),
          modified: Date.now(),
          tags: Array.from({ length: 5 }, (_, k) => `tag_${k}`),
        },
      };
    }
    return obj;
  },

  /**
   * Large array
   */
  largeArray: (): any =>
    Array.from({ length: 5000 }, (_, i) => ({
      id: i,
      name: `Item ${i}`,
      data: { value: Math.random(), active: i % 2 === 0 },
    })),

  /**
   * React component with compiled code (simulated)
   */
  reactComponent: (): any => ({
    type: "div" + "__TURBOPACK__compiled__code__".repeat(1000), // Simulate compiled code
    props: Object.fromEntries(
      Array.from({ length: 500 }, (_, i) => [`prop_${i}`, `value_${i}`])
    ),
    children: Array.from({ length: 200 }, (_, i) => ({
      type: "span",
      props: { id: `child_${i}` },
      children: [`Child ${i}`],
    })),
    _owner: { type: "component", name: "TestComponent" },
    elementType: "div",
  }),
};

/**
 * Performance measurement utility
 */
export const measurePerformance = {
  /**
   * Measure time for a synchronous operation
   */
  sync: (operation: () => any, label: string = "Operation"): number => {
    const start = performance.now();
    operation();
    const duration = performance.now() - start;
    console.log(`${label}: ${duration.toFixed(3)}ms`);
    return duration;
  },

  /**
   * Measure time for React component rendering (requires testing environment)
   */
  renderTime: (renderFn: () => any, iterations: number = 10): number => {
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      renderFn();
      const duration = performance.now() - start;
      times.push(duration);
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);

    console.log(`Render Performance (${iterations} iterations):`);
    console.log(`  Average: ${average.toFixed(3)}ms`);
    console.log(`  Min: ${min.toFixed(3)}ms`);
    console.log(`  Max: ${max.toFixed(3)}ms`);

    return average;
  },

  /**
   * Compare performance between two operations
   */
  compare: (
    operation1: () => any,
    operation2: () => any,
    label1: string = "Before",
    label2: string = "After",
    iterations: number = 50
  ): void => {
    console.log(`\n🔍 Performance Comparison (${iterations} iterations):`);

    // Warm up
    operation1();
    operation2();

    const times1: number[] = [];
    const times2: number[] = [];

    for (let i = 0; i < iterations; i++) {
      // Measure operation 1
      const start1 = performance.now();
      operation1();
      times1.push(performance.now() - start1);

      // Measure operation 2
      const start2 = performance.now();
      operation2();
      times2.push(performance.now() - start2);
    }

    const avg1 = times1.reduce((sum, time) => sum + time, 0) / times1.length;
    const avg2 = times2.reduce((sum, time) => sum + time, 0) / times2.length;

    const improvement = ((avg1 - avg2) / avg1) * 100;
    const speedup = avg1 / avg2;

    console.log(`  ${label1}: ${avg1.toFixed(3)}ms average`);
    console.log(`  ${label2}: ${avg2.toFixed(3)}ms average`);
    console.log(
      `  Improvement: ${improvement.toFixed(1)}% (${speedup.toFixed(1)}x faster)`
    );
  },
};

/**
 * Test suite for DefaultLogFormatter performance
 */
export const performanceTestSuite = {
  /**
   * Test collapsed mode performance with various object sizes
   */
  testCollapsedMode: () => {
    console.log("\n📊 Testing Collapsed Mode Performance:");

    const testCases = [
      { name: "Small Object", data: generateTestData.small() },
      { name: "Medium Object", data: generateTestData.medium() },
      { name: "Large Object", data: generateTestData.large() },
      { name: "Very Large Object", data: generateTestData.veryLarge() },
      { name: "Large Array", data: generateTestData.largeArray() },
      { name: "React Component", data: generateTestData.reactComponent() },
    ];

    testCases.forEach(({ name, data }) => {
      const log: DebugLogEntry = {
        id: `test-${Date.now()}`,
        timestamp: Date.now(),
        point: "performance-test",
        message: `Testing ${name}`,
        data,
      };

      measurePerformance.sync(() => {
        // Simulate the computedProps useMemo calculation
        // This would be replaced with actual component rendering in a test environment
        const isLarge =
          data &&
          typeof data === "object" &&
          (Array.isArray(data)
            ? data.length > 500
            : Object.keys(data).length > 100);

        if (isLarge) {
          // Simulate the optimized path
          const display = Array.isArray(data)
            ? `[Large Array: ${data.length} items]`
            : `[Large Object: ${Object.keys(data).length} keys]`;
        } else {
          // Simulate the full processing path (would be expensive for large objects)
          JSON.stringify(data);
        }
      }, `${name} (Collapsed)`);
    });
  },

  /**
   * Memory usage test for large objects
   */
  testMemoryUsage: () => {
    console.log("\n💾 Testing Memory Usage:");

    // Check for browser memory API (Chrome/Edge specific)
    const perfWithMemory = performance as any;
    if (perfWithMemory.memory && perfWithMemory.memory.usedJSHeapSize) {
      const before = perfWithMemory.memory.usedJSHeapSize;

      // Create and process large objects
      const largeData = generateTestData.veryLarge();
      const formatted = JSON.stringify(largeData).substring(0, 1000);

      const after = perfWithMemory.memory.usedJSHeapSize;
      const increase = after - before;

      console.log(`Memory increase: ${(increase / 1024 / 1024).toFixed(2)} MB`);
    } else {
      console.log("Memory API not available in this environment");
    }
  },
};

/**
 * Example usage for testing the performance fix
 */
export const runPerformanceTests = () => {
  console.log("🚀 DefaultLogFormatter Performance Tests");
  console.log("=========================================");

  performanceTestSuite.testCollapsedMode();
  performanceTestSuite.testMemoryUsage();

  console.log("\n✅ Performance tests completed!");
  console.log(
    "Expected: Large objects should render in ~3ms or less in collapsed mode"
  );
};

// Export for testing in browser console
if (typeof window !== "undefined") {
  (window as any).debugPerformanceTest = runPerformanceTests;
  console.log("💡 Run 'debugPerformanceTest()' in console to test performance");
}
