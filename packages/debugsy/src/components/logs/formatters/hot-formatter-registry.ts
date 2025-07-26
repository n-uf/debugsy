import React from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import type { FormatterConfig, FormatterMeta } from "./formatter-routing";

/**
 * Pre-resolved formatter entry for zero-overhead runtime lookups
 */
interface HotFormatterEntry {
  /** Pre-loaded expansion component (React component) */
  expansionComponent: React.ComponentType<{ log: DebugLogEntry }>;

  /** Pre-loaded meta function */
  metaFunction: (log: DebugLogEntry) => FormatterMeta | null;

  /** Configuration metadata */
  config: FormatterConfig;

  /** Whether this entry is valid and ready to use */
  isValid: boolean;

  /** Error message if loading failed */
  error?: string;
}

/**
 * Hot registry for zero-overhead formatter lookups
 */
interface HotFormatterRegistry {
  /** Direct O(1) lookup by log point */
  formatters: Record<string, HotFormatterEntry>;

  /** Pre-loaded sanitized data formatter */
  sanitizedDataFormatter: {
    expansionComponent: React.ComponentType<{ log: DebugLogEntry }>;
    metaFunction: (log: DebugLogEntry) => FormatterMeta | null;
    isValid: boolean;
  } | null;

  /** Pre-loaded default expansion component */
  defaultExpansionComponent: React.ComponentType<{ log: DebugLogEntry }> | null;

  /** Registry initialization status */
  isInitialized: boolean;

  /** Initialization timestamp */
  initializedAt: number;

  /** Performance stats */
  stats: {
    totalFormatters: number;
    validFormatters: number;
    invalidFormatters: number;
    initializationTime: number;
  };
}

/**
 * Global hot registry instance
 */
let hotRegistry: HotFormatterRegistry = {
  formatters: {},
  sanitizedDataFormatter: null,
  defaultExpansionComponent: null,
  isInitialized: false,
  initializedAt: 0,
  stats: {
    totalFormatters: 0,
    validFormatters: 0,
    invalidFormatters: 0,
    initializationTime: 0,
  },
};

/**
 * Initialize the hot registry by pre-loading all formatters
 * This should be called once at application startup
 */
export function initializeHotRegistry(): Promise<void> {
  return new Promise((resolve) => {
    const startTime = performance.now();

    try {
      // Import the registry configuration
      const formatterRouting = require("./formatter-routing");
      const FORMATTER_REGISTRY: Record<string, FormatterConfig> =
        formatterRouting._dev?.registry || {};

      console.log("🔥 [HotRegistry] Initializing hot formatter registry...");

      // Pre-load sanitized data formatter
      hotRegistry.sanitizedDataFormatter = loadSanitizedDataFormatter();

      // Pre-load default expansion component
      hotRegistry.defaultExpansionComponent = loadDefaultExpansionComponent();

      // Pre-load all registered formatters
      const formatterEntries: Record<string, HotFormatterEntry> = {};
      let validCount = 0;
      let invalidCount = 0;

      for (const [logPoint, config] of Object.entries(FORMATTER_REGISTRY)) {
        const entry = loadFormatterEntry(logPoint, config);
        formatterEntries[logPoint] = entry;

        if (entry.isValid) {
          validCount++;
        } else {
          invalidCount++;
          console.warn(
            `⚠️ [HotRegistry] Failed to load formatter for ${logPoint}:`,
            entry.error
          );
        }
      }

      // Update hot registry
      hotRegistry.formatters = formatterEntries;
      hotRegistry.isInitialized = true;
      hotRegistry.initializedAt = Date.now();

      const endTime = performance.now();
      const initTime = Math.round((endTime - startTime) * 100) / 100;

      hotRegistry.stats = {
        totalFormatters: Object.keys(FORMATTER_REGISTRY).length,
        validFormatters: validCount,
        invalidFormatters: invalidCount,
        initializationTime: initTime,
      };

      console.log(`✅ [HotRegistry] Initialized in ${initTime}ms`, {
        total: hotRegistry.stats.totalFormatters,
        valid: validCount,
        invalid: invalidCount,
        sanitizedData: hotRegistry.sanitizedDataFormatter?.isValid,
        defaultExpansion: !!hotRegistry.defaultExpansionComponent,
      });

      resolve();
    } catch (error) {
      console.error(
        "❌ [HotRegistry] Failed to initialize hot registry:",
        error
      );

      // Fallback: Initialize with empty registry
      hotRegistry.isInitialized = true;
      hotRegistry.initializedAt = Date.now();
      hotRegistry.stats.initializationTime = performance.now() - startTime;

      resolve();
    }
  });
}

/**
 * Load sanitized data formatter
 */
function loadSanitizedDataFormatter(): HotFormatterRegistry["sanitizedDataFormatter"] {
  try {
    const module = require("./sanitized-data-expansion-formatter");
    return {
      expansionComponent: module.SanitizedDataExpansionContent,
      metaFunction: module.getSanitizedDataLogMeta,
      isValid: !!(
        module.SanitizedDataExpansionContent && module.getSanitizedDataLogMeta
      ),
    };
  } catch (error) {
    console.warn(
      "⚠️ [HotRegistry] Failed to load sanitized data formatter:",
      error
    );
    return null;
  }
}

/**
 * Load default expansion component
 */
function loadDefaultExpansionComponent(): React.ComponentType<{
  log: DebugLogEntry;
}> | null {
  try {
    const module = require("./default-expansion-content");
    return module.DefaultExpandedContent || null;
  } catch (error) {
    console.warn(
      "⚠️ [HotRegistry] Failed to load default expansion component:",
      error
    );
    return null;
  }
}

/**
 * Load a single formatter entry
 */
function loadFormatterEntry(
  logPoint: string,
  config: FormatterConfig
): HotFormatterEntry {
  try {
    // Load the module
    const formatterModule = require(config.expansionComponent);

    // Resolve expansion component
    const expansionComponent =
      formatterModule.default ||
      formatterModule[getExpansionComponentName(logPoint)];

    // Resolve meta function
    const metaFunction = formatterModule[config.metaFunction];

    // Validate components
    if (!expansionComponent) {
      throw new Error(`Expansion component not found`);
    }

    if (!metaFunction || typeof metaFunction !== "function") {
      throw new Error(
        `Meta function '${config.metaFunction}' not found or not a function`
      );
    }

    return {
      expansionComponent,
      metaFunction,
      config,
      isValid: true,
    };
  } catch (error) {
    return {
      expansionComponent: null as any,
      metaFunction: () => null,
      config,
      isValid: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Generate expansion component name from log point
 */
function getExpansionComponentName(logPoint: string): string {
  return (
    logPoint
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "ExpansionContent"
  );
}

/**
 * ZERO-OVERHEAD: Get expansion content component for a log entry
 * Direct O(1) lookup with no dynamic imports or module resolution
 */
export function getHotExpansionContent(log: DebugLogEntry): React.ReactNode {
  // Ensure registry is initialized
  if (!hotRegistry.isInitialized) {
    console.warn(
      "⚠️ [HotRegistry] Registry not initialized, falling back to dynamic routing"
    );
    const { getExpansionContent } = require("./formatter-routing");
    return getExpansionContent(log);
  }

  // PRIORITY 1: Check if data is sanitized (direct O(1) lookup)
  if (
    log.data &&
    typeof log.data === "object" &&
    log.data.__sanitized === true
  ) {
    if (hotRegistry.sanitizedDataFormatter?.isValid) {
      return React.createElement(
        hotRegistry.sanitizedDataFormatter.expansionComponent,
        { log }
      );
    }
  }

  // PRIORITY 2: Check registered formatters (direct O(1) lookup)
  const entry = hotRegistry.formatters[log.point];

  if (entry && entry.isValid) {
    return React.createElement(entry.expansionComponent, { log });
  }

  // FALLBACK: Default expansion component (direct reference)
  if (hotRegistry.defaultExpansionComponent) {
    return React.createElement(hotRegistry.defaultExpansionComponent, { log });
  }

  // EMERGENCY FALLBACK: Dynamic import
  console.warn(
    "⚠️ [HotRegistry] No hot formatter found, falling back to dynamic routing"
  );
  const { getExpansionContent } = require("./formatter-routing");
  return getExpansionContent(log);
}

/**
 * ZERO-OVERHEAD: Get formatter metadata for a log entry
 * Direct O(1) lookup with no dynamic imports or module resolution
 */
export function getHotLogTypeMeta(log: DebugLogEntry): FormatterMeta | null {
  // Ensure registry is initialized
  if (!hotRegistry.isInitialized) {
    console.warn(
      "⚠️ [HotRegistry] Registry not initialized, falling back to dynamic routing"
    );
    const { getLogTypeMeta } = require("./formatter-routing");
    return getLogTypeMeta(log);
  }

  // PRIORITY 1: Check if data is sanitized (direct O(1) lookup)
  if (
    log.data &&
    typeof log.data === "object" &&
    log.data.__sanitized === true
  ) {
    if (hotRegistry.sanitizedDataFormatter?.isValid) {
      return hotRegistry.sanitizedDataFormatter.metaFunction(log);
    }
  }

  // PRIORITY 2: Check registered formatters (direct O(1) lookup)
  const entry = hotRegistry.formatters[log.point];

  if (entry && entry.isValid) {
    try {
      const meta = entry.metaFunction(log);

      // Merge with config defaults
      return {
        severity: meta?.severity || entry.config.defaultSeverity,
        shouldExpand: meta?.shouldExpand ?? entry.config.alwaysExpand,
        ...meta,
      };
    } catch (error) {
      console.error(
        `❌ [HotRegistry] Error in meta function for ${log.point}:`,
        error
      );
      // Return config defaults as fallback
      return {
        severity: entry.config.defaultSeverity,
        shouldExpand: entry.config.alwaysExpand,
      };
    }
  }

  return null;
}

/**
 * Check if hot registry is ready for use
 */
export function isHotRegistryReady(): boolean {
  return hotRegistry.isInitialized;
}

/**
 * Get hot registry statistics
 */
export function getHotRegistryStats() {
  return {
    ...hotRegistry.stats,
    isInitialized: hotRegistry.isInitialized,
    initializedAt: hotRegistry.initializedAt,
    formattersLoaded: Object.keys(hotRegistry.formatters).length,
    hasSanitizedDataFormatter:
      hotRegistry.sanitizedDataFormatter?.isValid || false,
    hasDefaultExpansionComponent: !!hotRegistry.defaultExpansionComponent,
  };
}

/**
 * Force re-initialization of hot registry (for development/testing)
 */
export function reinitializeHotRegistry(): Promise<void> {
  console.log("🔄 [HotRegistry] Re-initializing hot registry...");

  // Reset registry
  hotRegistry = {
    formatters: {},
    sanitizedDataFormatter: null,
    defaultExpansionComponent: null,
    isInitialized: false,
    initializedAt: 0,
    stats: {
      totalFormatters: 0,
      validFormatters: 0,
      invalidFormatters: 0,
      initializationTime: 0,
    },
  };

  return initializeHotRegistry();
}

/**
 * Development helpers
 */
export const _dev = {
  registry: hotRegistry,
  stats: getHotRegistryStats,
  reinitialize: reinitializeHotRegistry,
  isReady: isHotRegistryReady,
};

/**
 * Default export for convenience
 */
export default {
  initialize: initializeHotRegistry,
  getExpansionContent: getHotExpansionContent,
  getLogTypeMeta: getHotLogTypeMeta,
  isReady: isHotRegistryReady,
  getStats: getHotRegistryStats,
  reinitialize: reinitializeHotRegistry,
};
