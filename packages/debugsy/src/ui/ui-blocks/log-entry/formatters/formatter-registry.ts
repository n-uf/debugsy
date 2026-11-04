/**
 * Formatter Registry for harbuz
 * Central registry for all log formatters - simple and performant
 * Inspired by debugsy's formatter-routing system
 */

import type { LogEntryData } from "../log-entry";
import {
  ChangeExpansionContent,
  getChangeLogMeta,
  hasChangePattern,
} from "./change-formatter";
import {
  DefaultExpansionContent,
  getDefaultLogMeta,
} from "./default-formatter";
import type {
  ExpansionContentProps,
  FormatterConfig,
  FormatterMeta,
  LogSeverity,
} from "./formatter-types";

/**
 * FORMATTER REGISTRY
 * Add new formatters here - just reference the imported components directly
 */
export const FORMATTER_REGISTRY: Record<string, FormatterConfig> = {
  // Add formatters by point name here
  // Example:
  // config: {
  //   expansionComponent: ChangeExpansionContent,
  //   metaFunction: getChangeLogMeta,
  //   displayName: "Config Change Formatter",
  //   alwaysExpand: true,
  //   defaultSeverity: "info",
  // },
};

/**
 * Get expansion content for a log entry
 * Routes to the appropriate formatter based on log data
 */
export const getExpansionContent = (
  log: LogEntryData
): React.ComponentType<ExpansionContentProps> => {
  // Check registered formatters by point name
  const config = FORMATTER_REGISTRY[log.point];
  if (config) {
    return config.expansionComponent;
  }

  // Auto-detect change pattern (from/to structure)
  if (hasChangePattern(log.data)) {
    return ChangeExpansionContent;
  }

  // Fallback to default formatter
  return DefaultExpansionContent;
};

/**
 * Get formatter metadata for a log entry
 * Returns severity, expand behavior, and other metadata
 */
export const getLogFormatterMeta = (
  log: LogEntryData
): FormatterMeta | null => {
  // Check registered formatters by point name
  const config = FORMATTER_REGISTRY[log.point];
  if (config) {
    try {
      const meta = config.metaFunction(log);
      return {
        severity: meta?.severity || config.defaultSeverity,
        shouldExpand: meta?.shouldExpand ?? config.alwaysExpand,
        ...meta,
      };
    } catch (error) {
      console.warn(`Failed to get metadata for ${log.point}:`, error);
      return {
        severity: config.defaultSeverity,
        shouldExpand: config.alwaysExpand,
      };
    }
  }

  // Auto-detect change pattern
  if (hasChangePattern(log.data)) {
    const changeMeta = getChangeLogMeta(log);
    if (changeMeta) return changeMeta;
  }

  // Fallback to default formatter meta
  return getDefaultLogMeta(log);
};

/**
 * Utility: Register a new formatter at runtime
 */
export const registerFormatter = (
  logPoint: string,
  config: FormatterConfig
): void => {
  FORMATTER_REGISTRY[logPoint] = config;
};

/**
 * Utility: Get all registered formatter types
 */
export const getRegisteredFormatterTypes = (): string[] => {
  return Object.keys(FORMATTER_REGISTRY);
};

/**
 * Utility: Check if a log should expand (based on formatter meta)
 */
export const shouldLogExpand = (log: LogEntryData): boolean => {
  const meta = getLogFormatterMeta(log);
  return meta?.shouldExpand ?? (log.data !== undefined);
};

/**
 * Utility: Get severity for a log (based on formatter meta or log level)
 */
export const getLogSeverity = (log: LogEntryData): LogSeverity => {
  const meta = getLogFormatterMeta(log);
  return (meta?.severity as LogSeverity) ?? log.level ?? "info";
};

