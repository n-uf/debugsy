import React from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import type { LogSeverity } from "./default-log-formatter";

// Direct imports for all formatters - simple and performant
import { DefaultExpandedContent } from "./default-expansion-content";
import {
  DependencyExpansionContent,
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";
import {
  HealthExpansionContent,
  getHealthLogMeta,
} from "./health-expansion-formatter";
import {
  SanitizedDataExpansionContent,
  getSanitizedDataLogMeta,
} from "./sanitized-data-expansion-formatter";

/**
 * Configuration for a log formatter
 */
export interface FormatterConfig {
  /** React component for expansion content */
  expansionComponent: React.ComponentType<{ log: DebugLogEntry }>;

  /** Function to get metadata (severity, expand behavior, etc.) */
  metaFunction: (log: DebugLogEntry) => FormatterMeta | null;

  /** Display name for debugging */
  displayName: string;

  /** Whether this formatter should always expand */
  alwaysExpand?: boolean;

  /** Default severity for this log type */
  defaultSeverity?: LogSeverity;
}

/**
 * Metadata returned by formatter meta functions
 */
export interface FormatterMeta {
  severity?: LogSeverity;
  shouldExpand?: boolean;
  [key: string]: any;
}

/**
 * SIMPLE FORMATTER REGISTRY
 * Add new formatters here - just reference the imported components directly
 */
export const FORMATTER_REGISTRY: Record<string, FormatterConfig> = {
  dependencies: {
    expansionComponent: DependencyExpansionContent,
    metaFunction: getDependencyLogMeta,
    displayName: "Dependency Formatter",
    alwaysExpand: true,
    defaultSeverity: "info",
  },

  health: {
    expansionComponent: HealthExpansionContent,
    metaFunction: getHealthLogMeta,
    displayName: "Health Formatter",
    alwaysExpand: false,
    defaultSeverity: "info",
  },

  // ADD NEW FORMATTERS HERE:
  // Simply import the component and meta function above, then add:
  // newLogType: {
  //   expansionComponent: NewTypeExpansionContent,
  //   metaFunction: getNewTypeLogMeta,
  //   displayName: "New Type Formatter",
  //   alwaysExpand: false,
  //   defaultSeverity: "info"
  // }
};

/**
 * Get expansion content for a log entry - simple and fast
 */
export const getExpansionContent = (log: DebugLogEntry): React.ReactNode => {
  // Check if data is sanitized first
  if (
    log.data &&
    typeof log.data === "object" &&
    log.data.__sanitized === true
  ) {
    return React.createElement(SanitizedDataExpansionContent, { log });
  }

  // Check registered formatters
  const config = FORMATTER_REGISTRY[log.point];
  if (config) {
    return React.createElement(config.expansionComponent, { log });
  }

  // Default fallback
  return React.createElement(DefaultExpandedContent, { log });
};

/**
 * Get formatter metadata for a log entry - simple and fast
 */
export const getLogTypeMeta = (log: DebugLogEntry): FormatterMeta | null => {
  // Check if data is sanitized first
  if (
    log.data &&
    typeof log.data === "object" &&
    log.data.__sanitized === true
  ) {
    const sanitizedMeta = getSanitizedDataLogMeta(log);
    if (sanitizedMeta) {
      return {
        ...sanitizedMeta,
        severity: sanitizedMeta.severity as LogSeverity,
      };
    }
  }

  // Check registered formatters
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

  return null;
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
 * Default export for convenience
 */
export default {
  getExpansionContent,
  getLogTypeMeta,
  registerFormatter,
  getRegisteredFormatterTypes,
  FORMATTER_REGISTRY,
};
