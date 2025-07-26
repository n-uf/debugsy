/**
 * JSON Utilities - Comprehensive JSON handling for debug logs
 *
 * This module provides a unified interface to all JSON-related functionality,
 * organized into logical groups for different use cases.
 */

import { safeJsonStringify, safeSuperjsonStringify } from "./json-core";

// Internal imports for class usage
import {
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
} from "./json-display";
import {
  benchmarkSerialization,
  performanceJsonStringify,
} from "./json-performance";

// Re-export core functions that still exist
export { safeJsonStringify } from "./json-core";
export {
  formatDataForDisplay,
  formatJsonTooltip,
  getDisplayStrategy,
} from "./json-display";
export {
  benchmarkSerialization,
  performanceJsonStringify,
} from "./json-performance";

/**
 * JSON Utilities Facade - Main interface for all JSON operations
 * UNIFIED: Now uses safeSuperjsonStringify for consistent safe serialization
 *
 * This provides a simplified interface for common JSON operations,
 * automatically choosing the best strategy based on the data.
 */
export class JsonUtils {
  /**
   * Smart JSON stringification that chooses optimal strategy
   * UNIFIED: Uses safeSuperjsonStringify for comprehensive protection
   */
  static stringify(data: any, space?: number): string {
    try {
      return safeSuperjsonStringify(data, space);
    } catch (error) {
      // Fallback to safe stringify
      return safeJsonStringify(data, undefined, space);
    }
  }

  /**
   * Format data for display in UI components
   */
  static formatForDisplay(data: any, maxLength?: number): string {
    return formatDataForDisplay(data, maxLength);
  }

  /**
   * Create safe tooltip content for JSON data
   */
  static createTooltip(data: any): string {
    return formatJsonTooltip(data);
  }

  /**
   * Get the optimal display strategy for data
   */
  static getDisplayStrategy(data: any) {
    return getDisplayStrategy(data);
  }

  /**
   * Performance benchmark for different serialization methods
   */
  static benchmark(testObject: any) {
    return benchmarkSerialization(testObject);
  }

  /**
   * Check if data is complex and might need special handling
   * SIMPLIFIED: Basic check since safeSuperjsonStringify handles complexity
   */
  static isComplex(data: any): boolean {
    if (!data || typeof data !== "object") return false;

    // Basic complexity indicators
    if (Array.isArray(data)) {
      return data.length > 50;
    }

    try {
      return Object.keys(data).length > 20;
    } catch {
      return true; // If we can't check keys, assume it's complex
    }
  }

  /**
   * High-performance JSON stringification
   * UNIFIED: Uses safeSuperjsonStringify wrapper
   */
  static performantStringify(data: any, space?: number): string {
    return performanceJsonStringify(data, space);
  }
}

/**
 * Default export for convenient usage
 */
export default JsonUtils;
