/**
 * Safe JSON stringification utilities for handling circular references,
 * DOM elements, and other problematic objects.
 *
 * Ported from debugsy's proven solution.
 */

import superjson from "superjson";
import { registerSuperjsonCustomSerializers } from "../../shared/superjson-config";

// Initialize superjson custom serializers once
let isInitialized = false;

function ensureSuperjsonInitialized(): void {
  if (!isInitialized) {
    registerSuperjsonCustomSerializers();
    isInitialized = true;
  }
}

/**
 * Safe wrapper around superjson.stringify that handles circular references
 * and other problematic objects using superjson's custom serializers.
 *
 * This is the core utility ported from debugsy.
 */
export function safeSuperjsonStringify(
  obj: any,
  space?: string | number
): string {
  ensureSuperjsonInitialized();

  try {
    // Use superjson with custom serializers to handle problematic objects
    const result = superjson.stringify(obj);

    // If space is provided, re-parse and stringify with formatting
    if (space !== undefined) {
      try {
        const parsed = superjson.parse(result);
        return JSON.stringify(parsed, null, space);
      } catch {
        return result; // Return unformatted if formatting fails
      }
    }

    return result;
  } catch (error) {
    // Final fallback for truly unserializable objects
    try {
      return JSON.stringify(
        {
          __error: "Failed to serialize object",
          __type: typeof obj,
          __constructor: obj?.constructor?.name || "Unknown",
          __message: error instanceof Error ? error.message : "Unknown error",
        },
        null,
        space
      );
    } catch {
      return JSON.stringify(
        {
          __error: "Completely unserializable object",
          __fallback: String(obj),
        },
        null,
        space
      );
    }
  }
}

/**
 * Safely stringify any object, handling circular references and special types.
 * Returns a truncated string suitable for badges and inline display.
 *
 * @param value - The value to stringify
 * @param maxLength - Maximum length of the output string (default: 100)
 * @returns A safe string representation
 */
export function safeStringify(value: unknown, maxLength: number = 100): string {
  if (value === undefined) return "";
  if (value === null) return "null";

  // Handle primitives directly
  if (typeof value !== "object") {
    return String(value);
  }

  try {
    // Use superjson with custom serializers
    const result = safeSuperjsonStringify(value);

    // Truncate if too long
    if (result.length > maxLength) {
      return result.substring(0, maxLength - 3) + "...";
    }

    return result;
  } catch (error) {
    // Fallback for truly unserializable objects
    try {
      // Try to get constructor name or type info
      const constructor = (value as any)?.constructor?.name;
      const type = constructor || typeof value;

      // Check if it's a DOM element
      if (
        (value as any)?.nodeType !== undefined ||
        type?.includes("Element") ||
        type?.includes("Node")
      ) {
        return `[${type}]`;
      }

      // Check if it's a React element
      if (
        (value as any)?.$$typeof !== undefined ||
        (value as any)?._owner !== undefined
      ) {
        return "[ReactElement]";
      }

      return `[${type}]`;
    } catch {
      return "[Unserializable]";
    }
  }
}

/**
 * Check if a value is likely to have circular references or be problematic.
 *
 * @param value - The value to check
 * @returns True if the value is likely problematic
 */
export function isProblematicObject(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;

  try {
    const obj = value as any;

    // Check for React elements
    if (obj.$$typeof || obj._owner || obj._store) return true;

    // Check for React Fiber
    if (
      obj.__reactFiber$ ||
      obj.__reactInternalInstance ||
      obj._reactInternalFiber
    ) {
      return true;
    }

    // Check for DOM elements
    if (
      obj.nodeType !== undefined ||
      obj.constructor?.name?.includes("Element") ||
      obj.constructor?.name?.includes("Node")
    ) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}
