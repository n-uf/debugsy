/**
 * JSON Display Formatting Utilities
 *
 * This module provides UI-specific JSON formatting functions for displaying
 * JSON data in logs, previews, tooltips, and other interface elements.
 */

import { safeJsonStringify, safeSuperjsonStringify } from "./json-core";
import { JsonUtils, performanceJsonStringify } from "./json-utilities";

/**
 * OPTIMIZED: Smart data formatter that uses optimal display method
 * UNIFIED: Now uses safeSuperjsonStringify for consistent safe serialization
 */
export const formatDataForDisplay = (
  data: any,
  maxLength: number = 1000
): string => {
  if (data === null) return "null";
  if (data === undefined) return "undefined";
  if (typeof data === "string") return data;
  if (typeof data === "number" || typeof data === "boolean") {
    return String(data);
  }

  // For complex objects, use unified safe superjson handling
  if (typeof data === "object") {
    const safe = safeSuperjsonStringify(data);
    return truncateText(safe, maxLength);
  }

  // For simple objects, try safeJsonStringify first
  const simple = safeJsonStringify(data);
  if (simple.length <= maxLength) {
    return simple;
  }

  // If too long, use truncated version
  return truncateText(simple, maxLength);
};

/**
 * OPTIMIZED: Create JSON tooltip with size checking
 * UNIFIED: Uses JsonUtils.isComplex and safeSuperjsonStringify for consistency
 */
export const formatJsonTooltip = (
  data: any,
  maxLength: number = 1000
): string => {
  if (!data) return "";

  // Use JsonUtils to check complexity
  if (JsonUtils.isComplex(data)) {
    return `[Complex Object: ${Array.isArray(data) ? `Array(${data.length})` : `Object with ${Object.keys(data).length} properties`}]`;
  }

  const jsonString = performanceJsonStringify(data);
  return truncateText(jsonString, maxLength);
};

/**
 * Format JSON for copy operations with full fidelity
 * Preserves structure while handling large objects safely
 */
export const formatJsonForCopy = (data: any): string => {
  if (!data) return "";

  // For large objects, provide a summary
  if (JsonUtils.isComplex(data)) {
    return performanceJsonStringify(data);
  }

  // For normal objects, use performant stringification
  return performanceJsonStringify(data);
};

/**
 * Create a compact single-line preview of JSON data
 * Perfect for inline display in log entries
 */
export const formatJsonPreview = (
  data: any,
  maxLength: number = 200
): string => {
  if (!data) return "";

  const formatted = formatDataForDisplay(data, maxLength);

  // Convert multi-line JSON to single line for compact display
  return formatted.replace(/\n\s*/g, " ").replace(/\s+/g, " ").trim();
};

/**
 * Format JSON with syntax highlighting information
 * Returns an object with the formatted string and metadata for styling
 */
export const formatJsonWithMetadata = (
  data: any
): {
  content: string;
  isLarge: boolean;
  type: "array" | "object" | "primitive";
  itemCount?: number;
} => {
  if (!data || typeof data !== "object") {
    return {
      content: JSON.stringify(data),
      isLarge: false,
      type: "primitive",
    };
  }

  const isLarge = JsonUtils.isComplex(data);
  const isArray = Array.isArray(data);

  return {
    content: isLarge
      ? performanceJsonStringify(data)
      : performanceJsonStringify(data),
    isLarge,
    type: isArray ? "array" : "object",
    itemCount: isArray ? data.length : Object.keys(data).length,
  };
};

/**
 * Format JSON data specifically for search and filtering
 * Creates searchable text content from JSON objects
 */
export const formatJsonForSearch = (data: any): string => {
  if (!data) return "";

  try {
    // For large objects, create a searchable summary
    if (JsonUtils.isComplex(data)) {
      const keys = Object.keys(data);
      const preview = keys.slice(0, 20).join(" ");
      return `[Large object with keys: ${preview}${keys.length > 20 ? "..." : ""}]`;
    }

    // For normal objects, create a flat searchable string
    const jsonString = performanceJsonStringify(data);
    return jsonString
      .replace(/[{}"[\]:,]/g, " ") // Remove JSON syntax
      .replace(/\s+/g, " ") // Normalize whitespace
      .trim()
      .toLowerCase();
  } catch {
    return "[Error creating searchable content]";
  }
};

/**
 * ENHANCED: Get display strategy for different data types
 * UNIFIED: Uses JsonUtils.isComplex for complexity detection
 */
export const getDisplayStrategy = (data: any) => {
  if (!data || typeof data !== "object") {
    return { strategy: "direct", reason: "primitive" };
  }

  const isComplex = JsonUtils.isComplex(data);

  return {
    strategy: isComplex ? "summarize" : "full",
    reason: isComplex ? "complex-object" : "simple-object",
    displayText: isComplex
      ? `[Complex ${Array.isArray(data) ? "Array" : "Object"}]`
      : performanceJsonStringify(data),
  };
};

/**
 * Format error information when JSON processing fails
 */
export const formatJsonError = (error: Error, data?: any): string => {
  const dataInfo = data
    ? ` (${typeof data} with ${
        typeof data === "object" && data ? Object.keys(data).length : "unknown"
      } properties)`
    : "";

  return `[JSON Error: ${error.message}${dataInfo}]`;
};

/**
 * Helper function to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
}
