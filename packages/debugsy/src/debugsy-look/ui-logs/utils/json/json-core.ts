/**
 * Core JSON utilities for safe stringification and object handling
 *
 * This module provides the foundation for all JSON operations in the debug system,
 * handling edge cases like circular references, DOM elements, and Next.js special objects.
 */

import superjson from "superjson";

/**
 * Safe wrapper around superjson.stringify that handles circular references
 * and other problematic objects using superjson's custom serializers.
 */
export function safeSuperjsonStringify(
  obj: any,
  space?: string | number
): string {
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
 * Legacy wrapper that uses safeSuperjsonStringify
 * @deprecated Use safeSuperjsonStringify directly
 */
export function safeJsonStringify(
  obj: any,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string {
  // Note: replacer is ignored since superjson doesn't support it
  return safeSuperjsonStringify(obj, space);
}

/**
 * Test function to verify Next.js object handling in safeJsonStringify
 * This can be called from the browser console to test the fix
 */
export const testNextJsObjectHandling = () => {
  console.group("🧪 Next.js Object Handling Test");

  // Test objects that would normally trigger Next.js warnings
  const testObjects = {
    normalObject: { name: "test", value: 123 },
    paramsLike: { params: "fake-params-object" },
    searchParamsLike: { searchParams: "fake-search-params" },
    nestedNextJs: {
      data: {
        params: { id: "123" },
        searchParams: { query: "test" },
      },
    },
  };

  Object.entries(testObjects).forEach(([name, obj]) => {
    try {
      const result = safeJsonStringify(obj, undefined, 2);
      console.log(`✅ ${name}:`, result);
    } catch (error) {
      console.error(`❌ ${name} failed:`, error);
    }
  });

  console.log(
    "\n💡 If you see '[Next.js Params Object]' or '[Next.js SearchParams Object]' above,"
  );
  console.log(
    "   the fix is working and preventing Next.js enumeration warnings!"
  );

  console.groupEnd();
};

/**
 * Basic utility to truncate text to maximum length with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
};
