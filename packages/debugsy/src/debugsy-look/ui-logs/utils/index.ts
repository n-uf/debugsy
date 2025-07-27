/**
 * Log Utilities Module
 *
 * Provides utility functions for log processing, formatting, copying,
 * and performance optimization.
 */

// JSON Utilities - Core Facade
export { default as JsonUtils } from "./json/json-utilities";

// Core JSON utilities (updated exports)
export {
  benchmarkSerialization,
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
  performanceJsonStringify,
  safeJsonStringify,
} from "./json/json-utilities";

// Copy utilities
export { copyLogsToClipboard, formatLogForCopy } from "./copy-utilities";

/**
 * Utilities Documentation
 *
 * This module provides utilities for working with debug logs.
 *
 * ## JSON Utilities
 *
 * ### JsonUtils Class
 * Main facade for JSON operations using superjson:
 * ```typescript
 * import { JsonUtils } from './utils';
 *
 * // Smart stringification using superjson
 * const json = JsonUtils.stringify(complexObject);
 *
 * // Format for display
 * const display = JsonUtils.formatForDisplay(data, 100);
 *
 * // Check if object is complex
 * const isComplex = JsonUtils.isComplex(data);
 * ```
 *
 * ## Copy Utilities
 *
 * Handle clipboard operations for log data:
 * ```typescript
 * import { copyLogsToClipboard } from './utils';
 *
 * await copyLogsToClipboard(logs);
 * ```
 */
