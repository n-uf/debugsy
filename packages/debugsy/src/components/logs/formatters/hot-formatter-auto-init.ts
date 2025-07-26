import {
  getHotRegistryStats,
  initializeHotRegistry,
  isHotRegistryReady,
} from "./hot-formatter-registry";

/**
 * Auto-initialization flag to prevent duplicate initialization
 */
let autoInitStarted = false;

/**
 * Auto-initialize the hot formatter registry
 * This runs as soon as this module is imported to ensure the registry is ready
 */
function autoInitializeHotRegistry(): void {
  if (autoInitStarted) {
    return;
  }

  autoInitStarted = true;

  // Initialize on next tick to avoid blocking module loading
  if (typeof setImmediate !== "undefined") {
    setImmediate(() => {
      initializeWithFallback();
    });
  } else {
    setTimeout(() => {
      initializeWithFallback();
    }, 0);
  }
}

/**
 * Initialize with error handling and fallback
 */
async function initializeWithFallback(): Promise<void> {
  try {
    await initializeHotRegistry();

    // Log successful initialization once
    if (process.env.NODE_ENV === "development") {
      const stats = getHotRegistryStats();
      console.log(
        "🚀 [Debugsy] Hot formatter registry ready for zero-overhead performance",
        {
          formatters: stats.validFormatters,
          initTime: stats.initializationTime + "ms",
        }
      );
    }
  } catch (error) {
    console.warn(
      "⚠️ [Debugsy] Hot registry initialization failed, falling back to dynamic routing:",
      error
    );
  }
}

/**
 * Check if hot registry is ready
 * Can be used by other modules to verify initialization status
 */
export function isPerformanceOptimized(): boolean {
  return isHotRegistryReady();
}

/**
 * Get performance statistics
 * Useful for debugging and monitoring
 */
export function getPerformanceStats() {
  if (!isHotRegistryReady()) {
    return {
      isOptimized: false,
      message:
        "Hot registry not initialized - using dynamic routing with overhead",
    };
  }

  const stats = getHotRegistryStats();
  return {
    isOptimized: true,
    ...stats,
    message: `Zero-overhead performance active (${stats.validFormatters} formatters loaded in ${stats.initializationTime}ms)`,
  };
}

/**
 * Manual initialization trigger (for testing or explicit control)
 */
export async function ensurePerformanceOptimization(): Promise<void> {
  if (isHotRegistryReady()) {
    return;
  }

  await initializeHotRegistry();
}

// Auto-initialize as soon as this module is imported
autoInitializeHotRegistry();

// Default export for convenience
export default {
  isOptimized: isPerformanceOptimized,
  getStats: getPerformanceStats,
  ensureOptimization: ensurePerformanceOptimization,
};
