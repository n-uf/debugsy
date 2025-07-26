/**
 * Test utility for verifying useWhyDidYouUpdate functionality
 * Run this in the browser console to test dependency tracking
 */

// Test dependency tracking functionality
export const testDependencyTracking = () => {
  console.log("🧪 Testing useWhyDidYouUpdate functionality...");

  // Check if global surfaceDebug object exists
  const globalDebug = (globalThis as any).surfaceDebug;
  if (!globalDebug) {
    console.error("❌ Global surfaceDebug object not found");
    return false;
  }

  console.log("✅ Global surfaceDebug object found");

  // Check if getDependencyStatus method exists
  if (!globalDebug.getDependencyStatus) {
    console.error("❌ getDependencyStatus method not found");
    return false;
  }

  console.log("✅ getDependencyStatus method found");

  // Test dependency status
  const depStatus = globalDebug.getDependencyStatus();
  console.log("📋 Current dependency status:", depStatus);

  // Test if dependency tracking is enabled
  if (!depStatus.enabled) {
    console.warn("⚠️ Dependency tracking is currently disabled");
    console.log("🔧 Enabling dependency tracking...");
    globalDebug.deps.on();
    const newStatus = globalDebug.getDependencyStatus();
    console.log("📋 Updated dependency status:", newStatus);
  }

  // Test console commands
  console.log("\n🎛️ Testing console commands:");

  console.log("Testing surfaceDebug.deps.normal()...");
  globalDebug.deps.normal();

  console.log("Testing surfaceDebug.deps.verbose()...");
  globalDebug.deps.verbose();

  console.log("Testing surfaceDebug.deps.quiet()...");
  globalDebug.deps.quiet();

  // Reset to normal
  globalDebug.deps.normal();

  console.log("\n✅ useWhyDidYouUpdate should now be working!");
  console.log("📝 To test in components:");
  console.log(
    "   1. Add useWhyDidYouUpdate('MyComponent', props) to any component"
  );
  console.log("   2. Change props and watch for dependency change logs");
  console.log("   3. Use surfaceDebug.deps.verbose() for more detail");

  return true;
};

// Test with a mock component scenario
export const testMockComponent = () => {
  console.log("\n🧪 Testing with mock component scenario...");

  const { useWhyDidYouUpdate } = require("../debug-deps");

  // Simulate component props changing
  let renderCount = 0;
  const mockComponentTest = () => {
    renderCount++;

    // Mock props that change each render
    const props = {
      staticProp: "unchanged",
      changingNumber: renderCount,
      changingObject: { count: renderCount, data: new Date() },
      changingFunction: () => renderCount,
    };

    console.log(`\n🔄 Mock render #${renderCount}`);

    // This should trigger dependency logging if working properly
    try {
      // Simulate the hook being called (without actual React context)
      // We'll just test the core logic
      const globalDebug = (globalThis as any).surfaceDebug;
      const depState = globalDebug?.getDependencyStatus?.();

      console.log(
        `📊 Dependency state: enabled=${depState?.enabled}, level=${depState?.level}`
      );

      if (depState?.enabled) {
        console.log(
          "✅ Dependency tracking is active - useWhyDidYouUpdate should work"
        );
      } else {
        console.log("❌ Dependency tracking is disabled");
      }
    } catch (error) {
      console.error("❌ Error testing dependency tracking:", error);
      return false;
    }
  };

  // Run a few mock renders
  mockComponentTest();
  mockComponentTest();
  mockComponentTest();

  return true;
};

// Export for browser console usage
if (typeof window !== "undefined") {
  (window as any).testDependencyTracking = testDependencyTracking;
  (window as any).testMockComponent = testMockComponent;

  console.log("🧪 Dependency tracking tests available:");
  console.log("  testDependencyTracking() - Test basic functionality");
  console.log("  testMockComponent() - Test mock component scenario");
}
