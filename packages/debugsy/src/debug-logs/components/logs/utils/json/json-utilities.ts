/**
 * JSON Utilities - Comprehensive JSON handling for debug logs
 *
 * This module provides a unified interface to all JSON-related functionality,
 * organized into logical groups for different use cases.
 */

// Core JSON utilities
export {
  safeJsonStringify,
  testNextJsObjectHandling,
  truncateText,
} from "./json-core";

// Performance optimization utilities
export {
  analyzeDetectionOverhead,
  benchmarkJsonMethods,
  clearJsonStringifyCache,
  getJsonCacheStats,
  isLikelyLargeObject,
  memoizedJsonStringify,
  performantJsonStringify,
  simulateLogRenderingPerformance,
  smartJsonStringify,
} from "./json-performance";

// Expansion performance testing utilities
export {
  benchmarkExpansionPerformance,
  createExpansionProfiler,
  createTestObjects,
  ExpansionPerformanceUtils,
  measureExpansionPerformance,
  validatePerformanceTargets,
} from "./expansion-performance-utils";
export type { ExpansionPerformanceMetrics } from "./expansion-performance-utils";

// Display formatting utilities
export {
  formatDataForDisplay,
  formatJsonError,
  formatJsonForCopy,
  formatJsonForSearch,
  formatJsonPreview,
  formatJsonTooltip,
  formatJsonWithMetadata,
  getDisplayStrategy,
} from "./json-display";

// Internal imports for class usage
import {
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
} from "./json-display";
import {
  benchmarkJsonMethods,
  clearJsonStringifyCache,
  isLikelyLargeObject,
  performantJsonStringify,
} from "./json-performance";

/**
 * JSON Utilities Facade - Main interface for all JSON operations
 *
 * This provides a simplified interface for common JSON operations,
 * automatically choosing the best strategy based on the data.
 */
export class JsonUtils {
  /**
   * Stringify JSON with automatic performance optimization
   */
  static stringify(obj: any, space?: number): string {
    return performantJsonStringify(obj, space);
  }

  /**
   * Format JSON for display in UI components
   */
  static formatForDisplay(obj: any, maxLength: number = 100): string {
    return formatDataForDisplay(obj, maxLength);
  }

  /**
   * Create a tooltip-safe representation of JSON
   */
  static formatTooltip(obj: any, maxLength: number = 500): string {
    return formatJsonTooltip(obj, maxLength);
  }

  /**
   * Check if an object is likely to cause performance issues
   */
  static isLarge(obj: any): boolean {
    return isLikelyLargeObject(obj);
  }

  /**
   * Get recommendations for displaying an object
   */
  static getDisplayRecommendations(obj: any) {
    return getDisplayStrategy(obj);
  }

  /**
   * Benchmark different stringification methods
   */
  static benchmark(obj: any, iterations: number = 100) {
    return benchmarkJsonMethods(obj, iterations);
  }

  /**
   * Clear performance caches
   */
  static clearCaches() {
    clearJsonStringifyCache();
  }
}

/**
 * Default export for convenient usage
 */
export default JsonUtils;
