/**
 * JSON Display Formatting Utilities
 *
 * This module provides UI-specific JSON formatting functions for displaying
 * JSON data in logs, previews, tooltips, and other interface elements.
 */

import { truncateText } from "./json-core";
import {
  isLikelyLargeObject,
  performantJsonStringify,
  smartJsonStringify,
} from "./json-performance";

/**
 * Detect React components with compiled code specifically for display purposes
 */
const isReactComponentForDisplay = (data: any): boolean => {
  if (!data || typeof data !== "object") return false;

  try {
    const hasReactStructure =
      data._owner !== undefined ||
      data.elementType !== undefined ||
      data.type !== undefined ||
      data.key !== undefined ||
      data.ref !== undefined ||
      data.props !== undefined;

    if (!hasReactStructure) return false;

    // Check for compiled code indicators
    if (data.type && typeof data.type === "string") {
      return (
        data.type.length > 2000 ||
        data.type.includes("__TURBOPACK__") ||
        data.type.includes("__webpack_require__") ||
        data.type.includes("node_modules") ||
        data.type.includes("$28$ecmascript$29$")
      );
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Format a React component for display
 */
const formatReactComponentForDisplay = (data: any): string => {
  try {
    const parts = [];

    if (data.tag !== undefined) parts.push(`Tag: ${data.tag}`);
    if (data.key !== null && data.key !== undefined)
      parts.push(`Key: ${data.key}`);

    if (data.type && typeof data.type === "string" && data.type.length > 1000) {
      const nameMatch = data.type.match(
        /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/
      );
      const componentName = nameMatch ? nameMatch[1] : "CompiledComponent";
      parts.push(`Type: ${componentName} (${data.type.length} chars)`);
    } else if (data.type) {
      parts.push(
        `Type: ${typeof data.type === "function" ? data.type.name || "Function" : "Other"}`
      );
    }

    const otherProps = Object.keys(data).filter(
      (k) => !["tag", "key", "type", "elementType"].includes(k)
    );
    if (otherProps.length > 0) {
      parts.push(`+${otherProps.length} props`);
    }

    return `React Component: {${parts.join(", ")}}`;
  } catch {
    return "React Component: [Unable to parse]";
  }
};

/**
 * OPTIMIZED: Format JSON data for display with minimal overhead for small objects
 * Uses fast-path for common simple cases to reduce log rendering overhead
 */
export const formatDataForDisplay = (
  data: any,
  maxLength: number = 100
): string => {
  if (!data) return "";

  // FAST PATH: Handle primitives and small simple objects directly
  if (typeof data !== "object") {
    return truncateText(JSON.stringify(data), maxLength);
  }

  // FAST PATH: Small arrays (common in logs)
  if (Array.isArray(data) && data.length <= 3) {
    try {
      const simple = JSON.stringify(data);
      if (simple.length <= maxLength) return simple;
    } catch {
      // Fall through to safer handling
    }
  }

  // FAST PATH: Small objects with simple properties (very common)
  if (!Array.isArray(data)) {
    try {
      const keys = Object.keys(data);
      if (keys.length <= 3) {
        // Check if all values are simple (no nested objects)
        const hasComplexValues = keys.some((key) => {
          const value = data[key];
          return typeof value === "object" && value !== null;
        });

        if (!hasComplexValues) {
          const simple = JSON.stringify(data);
          if (simple.length <= maxLength) return simple;
        }
      }
    } catch {
      // Fall through to safer handling
    }
  }

  // COMPLEX PATH: Use smart handling for potentially problematic objects

  // Special handling for React components with compiled code
  if (isReactComponentForDisplay(data)) {
    const formatted = formatReactComponentForDisplay(data);
    return truncateText(formatted, maxLength);
  }

  // Use smart stringification that prevents expensive operations on large objects
  const jsonString = smartJsonStringify(data, 2, 10); // Shallow depth, few keys for preview
  return truncateText(jsonString, maxLength);
};

/**
 * Generate a safe tooltip string for JSON data
 * Provides informative previews without expensive operations
 */
export const formatJsonTooltip = (
  data: any,
  maxLength: number = 500
): string => {
  if (!data) return "";

  // Special handling for React components
  if (isReactComponentForDisplay(data)) {
    return formatReactComponentForDisplay(data);
  }

  // For large objects, provide a simple summary instead of full JSON
  if (isLikelyLargeObject(data)) {
    if (Array.isArray(data)) {
      return `[Large Array: ${data.length} items - Click to expand for details]`;
    } else {
      const keyCount = Object.keys(data).length;
      return `[Large Object: ${keyCount} properties - Click to expand for details]`;
    }
  }

  // For smaller objects, show a truncated preview
  const jsonString = performantJsonStringify(data);
  return truncateText(jsonString, maxLength);
};

/**
 * Format JSON for copy operations with full fidelity
 * Preserves structure while handling large objects safely
 */
export const formatJsonForCopy = (data: any): string => {
  if (!data) return "";

  // For large objects, provide a more detailed summary but still safe
  if (isLikelyLargeObject(data)) {
    return smartJsonStringify(data, 5, 50); // Deeper but still limited
  }

  // For normal objects, use performant stringification
  return performantJsonStringify(data, 2);
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

  const isLarge = isLikelyLargeObject(data);
  const isArray = Array.isArray(data);

  return {
    content: isLarge
      ? smartJsonStringify(data, 3, 20)
      : performantJsonStringify(data, 2),
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
    if (isLikelyLargeObject(data)) {
      const keys = Object.keys(data);
      const preview = keys.slice(0, 20).join(" ");
      return `[Large object with keys: ${preview}${keys.length > 20 ? "..." : ""}]`;
    }

    // For normal objects, create a flat searchable string
    const jsonString = performantJsonStringify(data);
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
 * Determine the best display strategy for a JSON object
 * Returns recommendations for how to display the object
 */
export const getDisplayStrategy = (
  data: any
): {
  strategy: "inline" | "collapsed" | "summary" | "error";
  reason: string;
  recommendations: {
    maxPreviewLength: number;
    shouldAutoExpand: boolean;
    collapseDepth: number;
  };
} => {
  if (!data) {
    return {
      strategy: "inline",
      reason: "No data to display",
      recommendations: {
        maxPreviewLength: 100,
        shouldAutoExpand: false,
        collapseDepth: 0,
      },
    };
  }

  if (typeof data !== "object") {
    return {
      strategy: "inline",
      reason: "Primitive value - safe to display inline",
      recommendations: {
        maxPreviewLength: 200,
        shouldAutoExpand: true,
        collapseDepth: 0,
      },
    };
  }

  if (isLikelyLargeObject(data)) {
    return {
      strategy: "summary",
      reason:
        "Large object detected - show summary to prevent performance issues",
      recommendations: {
        maxPreviewLength: 100,
        shouldAutoExpand: false,
        collapseDepth: 1,
      },
    };
  }

  const keyCount = Object.keys(data).length;
  if (keyCount > 20) {
    return {
      strategy: "collapsed",
      reason: "Medium-sized object - start collapsed for better UX",
      recommendations: {
        maxPreviewLength: 300,
        shouldAutoExpand: false,
        collapseDepth: 2,
      },
    };
  }

  return {
    strategy: "inline",
    reason: "Small object - safe to display fully",
    recommendations: {
      maxPreviewLength: 500,
      shouldAutoExpand: true,
      collapseDepth: 3,
    },
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
