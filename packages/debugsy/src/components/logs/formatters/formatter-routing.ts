import React from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import type { LogSeverity } from "./default-log-formatter";

/**
 * Configuration interface for a log formatter
 */
export interface FormatterConfig {
  /** The expansion content component for this log type */
  expansionComponent: string; // Module path for dynamic import

  /** Function to get formatter metadata (severity, expand behavior, etc.) */
  metaFunction: string; // Function name in the module

  /** Display name for the formatter (for debugging/logging) */
  displayName: string;

  /** Whether this formatter should always expand (optional) */
  alwaysExpand?: boolean;

  /** Default severity for this log type (optional) */
  defaultSeverity?: LogSeverity;
}

/**
 * Metadata returned by formatter meta functions
 */
export interface FormatterMeta {
  /** Severity level for this log entry */
  severity?: LogSeverity;

  /** Whether this log should show expand button */
  shouldExpand?: boolean;

  /** Additional metadata specific to the formatter */
  [key: string]: any;
}

/**
 * CENTRALIZED FORMATTER REGISTRY
 * Add new formatters here to enable automatic routing
 */
const FORMATTER_REGISTRY: Record<string, FormatterConfig> = {
  dependencies: {
    expansionComponent: "./dependency-expansion-formatter",
    metaFunction: "getDependencyLogMeta",
    displayName: "Dependency Formatter",
    alwaysExpand: true,
    defaultSeverity: "info",
  },

  health: {
    expansionComponent: "./health-expansion-formatter",
    metaFunction: "getHealthLogMeta",
    displayName: "Health Formatter",
    alwaysExpand: false,
    defaultSeverity: "info",
  },

  // ADD NEW FORMATTERS HERE:
  // newLogType: {
  //   expansionComponent: "./new-type-expansion-formatter",
  //   metaFunction: "getNewTypeLogMeta",
  //   displayName: "New Type Formatter",
  //   alwaysExpand: false,
  //   defaultSeverity: "info"
  // }
};

/**
 * Cache for dynamically imported formatter modules
 * Prevents repeated imports and improves performance
 */
const formatterModuleCache = new Map<string, any>();

/**
 * OPTIMIZED: Get expansion content component for a log entry
 * Routes logs to appropriate expansion formatters based on registry configuration
 */
export const getExpansionContent = (log: DebugLogEntry): React.ReactNode => {
  // PRIORITY 1: Check if data is sanitized and needs special handling
  try {
    if (
      log.data &&
      typeof log.data === "object" &&
      log.data.__sanitized === true
    ) {
      const {
        SanitizedDataExpansionContent,
      } = require("./sanitized-data-expansion-formatter");
      return React.createElement(SanitizedDataExpansionContent, { log });
    }
  } catch (error) {
    console.warn("⚠️ Failed to load sanitized data formatter:", error);
  }

  // PRIORITY 2: Check registered formatters for log point
  const config = FORMATTER_REGISTRY[log.point];

  if (!config) {
    // Default JSON expansion for unregistered log types
    const { DefaultExpandedContent } = require("./default-expansion-content");
    return React.createElement(DefaultExpandedContent, { log });
  }

  try {
    // Check cache first
    let formatterModule = formatterModuleCache.get(config.expansionComponent);

    if (!formatterModule) {
      // Dynamic import with caching
      formatterModule = require(config.expansionComponent);
      formatterModuleCache.set(config.expansionComponent, formatterModule);
    }

    // Get the expansion component (assume it's the default export or named export)
    const ExpansionComponent =
      formatterModule.default ||
      formatterModule[getExpansionComponentName(log.point)];

    if (!ExpansionComponent) {
      console.warn(
        `⚠️ Expansion component not found for log type: ${log.point}`
      );
      const { DefaultExpandedContent } = require("./default-log-formatter");
      return React.createElement(DefaultExpandedContent, { log });
    }

    return React.createElement(ExpansionComponent, { log });
  } catch (error) {
    console.error(
      `❌ Failed to load formatter for log type: ${log.point}`,
      error
    );
    // Fallback to default expansion
    const { DefaultExpandedContent } = require("./default-expansion-content");
    return React.createElement(DefaultExpandedContent, { log });
  }
};

/**
 * OPTIMIZED: Get formatter metadata for a log entry
 * Used to enhance default formatter behavior with log-type-specific logic
 */
export const getLogTypeMeta = (log: DebugLogEntry): FormatterMeta | null => {
  // PRIORITY 1: Check if data is sanitized and needs special metadata
  try {
    if (
      log.data &&
      typeof log.data === "object" &&
      log.data.__sanitized === true
    ) {
      const {
        getSanitizedDataLogMeta,
      } = require("./sanitized-data-expansion-formatter");
      const sanitizedMeta = getSanitizedDataLogMeta(log);
      if (sanitizedMeta) {
        return sanitizedMeta;
      }
    }
  } catch (error) {
    console.warn("⚠️ Failed to get sanitized data metadata:", error);
  }

  // PRIORITY 2: Check registered formatters for log point
  const config = FORMATTER_REGISTRY[log.point];

  if (!config) {
    return null;
  }

  try {
    // Check cache first
    let formatterModule = formatterModuleCache.get(config.expansionComponent);

    if (!formatterModule) {
      // Dynamic import with caching
      formatterModule = require(config.expansionComponent);
      formatterModuleCache.set(config.expansionComponent, formatterModule);
    }

    // Get the meta function
    const metaFunction = formatterModule[config.metaFunction];

    if (!metaFunction || typeof metaFunction !== "function") {
      console.warn(
        `⚠️ Meta function '${config.metaFunction}' not found for log type: ${log.point}`
      );
      return {
        severity: config.defaultSeverity,
        shouldExpand: config.alwaysExpand,
      };
    }

    // Call the meta function and return result
    const meta = metaFunction(log);

    // Merge with config defaults
    return {
      severity: meta?.severity || config.defaultSeverity,
      shouldExpand: meta?.shouldExpand ?? config.alwaysExpand,
      ...meta,
    };
  } catch (error) {
    console.error(
      `❌ Failed to get metadata for log type: ${log.point}`,
      error
    );
    // Return config defaults as fallback
    return {
      severity: config.defaultSeverity,
      shouldExpand: config.alwaysExpand,
    };
  }
};

/**
 * UTILITY: Generate expansion component name from log point
 * Converts log point to expected component name (e.g., "dependencies" -> "DependencyExpansionContent")
 */
const getExpansionComponentName = (logPoint: string): string => {
  return (
    logPoint
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("") + "ExpansionContent"
  );
};

/**
 * UTILITY: Register a new formatter (for dynamic registration)
 * Allows runtime registration of new formatters
 */
export const registerFormatter = (
  logPoint: string,
  config: FormatterConfig
): void => {
  FORMATTER_REGISTRY[logPoint] = config;
  console.log(`✅ Registered formatter for log type: ${logPoint}`);
};

/**
 * UTILITY: Unregister a formatter
 * Allows removal of formatters (useful for testing or dynamic scenarios)
 */
export const unregisterFormatter = (logPoint: string): boolean => {
  if (FORMATTER_REGISTRY[logPoint]) {
    delete FORMATTER_REGISTRY[logPoint];
    formatterModuleCache.delete(
      FORMATTER_REGISTRY[logPoint]?.expansionComponent
    );
    console.log(`✅ Unregistered formatter for log type: ${logPoint}`);
    return true;
  }
  return false;
};

/**
 * UTILITY: Get all registered formatter types
 * Useful for debugging and validation
 */
export const getRegisteredFormatterTypes = (): string[] => {
  return Object.keys(FORMATTER_REGISTRY);
};

/**
 * UTILITY: Get formatter configuration for a log type
 * Useful for debugging and introspection
 */
export const getFormatterConfig = (
  logPoint: string
): FormatterConfig | null => {
  return FORMATTER_REGISTRY[logPoint] || null;
};

/**
 * UTILITY: Validate all registered formatters
 * Checks if all registered formatters can be loaded successfully
 */
export const validateFormatters = async (): Promise<{
  valid: string[];
  invalid: string[];
  errors: Record<string, string>;
}> => {
  const results = {
    valid: [] as string[],
    invalid: [] as string[],
    errors: {} as Record<string, string>,
  };

  for (const [logPoint, config] of Object.entries(FORMATTER_REGISTRY)) {
    try {
      const formatterModule = require(config.expansionComponent);
      const ExpansionComponent =
        formatterModule.default ||
        formatterModule[getExpansionComponentName(logPoint)];
      const metaFunction = formatterModule[config.metaFunction];

      if (!ExpansionComponent) {
        throw new Error(`Expansion component not found`);
      }

      if (!metaFunction || typeof metaFunction !== "function") {
        throw new Error(
          `Meta function '${config.metaFunction}' not found or not a function`
        );
      }

      results.valid.push(logPoint);
    } catch (error) {
      results.invalid.push(logPoint);
      results.errors[logPoint] =
        error instanceof Error ? error.message : String(error);
    }
  }

  return results;
};

/**
 * UTILITY: Clear formatter module cache
 * Useful for development and testing
 */
export const clearFormatterCache = (): void => {
  formatterModuleCache.clear();
  console.log("🧹 Cleared formatter module cache");
};

/**
 * DEVELOPMENT HELPERS: Export registry and cache for debugging
 */
export const _dev = {
  registry: FORMATTER_REGISTRY,
  cache: formatterModuleCache,
  validate: validateFormatters,
  clear: clearFormatterCache,
};

/**
 * DEFAULT EXPORT: Routing utilities object for convenience
 */
export default {
  getExpansionContent,
  getLogTypeMeta,
  registerFormatter,
  unregisterFormatter,
  getRegisteredFormatterTypes,
  getFormatterConfig,
  validateFormatters,
  clearFormatterCache,
};
