/**
 * Core JSON utilities for safe stringification and object handling
 *
 * This module provides the foundation for all JSON operations in the debug system,
 * handling edge cases like circular references, DOM elements, and Next.js special objects.
 */

/**
 * Check if an object is a React component with compiled code
 * These should be handled specially to prevent huge string serialization
 */
const isReactComponentWithCompiledCode = (value: any, key: string): boolean => {
  if (!value || typeof value !== "object") return false;

  try {
    // Check for React component-like structure
    const hasReactStructure =
      value._owner !== undefined ||
      value.elementType !== undefined ||
      value.type !== undefined ||
      "key" in value ||
      "ref" in value ||
      value.props !== undefined;

    if (!hasReactStructure) return false;

    // Check for huge 'type' property (common in compiled components)
    if (
      value.type &&
      typeof value.type === "string" &&
      value.type.length > 2000
    ) {
      return true;
    }

    // Check for compiled code patterns
    if (value.type && typeof value.type === "string") {
      const hasCompiledPatterns =
        value.type.includes("__TURBOPACK__") ||
        value.type.includes("__webpack_require__") ||
        value.type.includes("node_modules") ||
        value.type.includes("$28$ecmascript$29$") ||
        value.type.includes("_imported_module_");

      if (hasCompiledPatterns && value.type.length > 500) return true;
    }

    return false;
  } catch {
    return false;
  }
};

/**
 * Check if an object is a Next.js special object (params, searchParams, etc.)
 *
 * Next.js has special objects like `params` and `searchParams` that trigger warnings
 * when their properties are enumerated directly. These warnings appear as:
 * - "params are being enumerated. params should be unwrapped with React.use()"
 * - "The keys of searchParams were accessed directly. searchParams should be unwrapped with React.use()"
 *
 * This function identifies such objects early to prevent enumeration in JSON.stringify()
 */
const isNextJsSpecialObject = (value: any, key: string): boolean => {
  if (!value || typeof value !== "object") return false;

  // Quick check for Next.js specific keys
  if (key === "params" || key === "searchParams") {
    return true;
  }

  // Check for Next.js params/searchParams by looking for specific characteristics
  // These objects have special behavior and should not be enumerated
  try {
    // Avoid accessing constructor or prototype directly as it might trigger warnings
    const valueString = Object.prototype.toString.call(value);

    // Check if this looks like a Next.js object without triggering enumeration
    if (valueString === "[object Object]") {
      // Check if object has the typical Next.js warning characteristics
      // by checking for specific property patterns without enumerating
      const hasParams = key.toLowerCase().includes("param");
      const hasSearch = key.toLowerCase().includes("search");

      if (hasParams || hasSearch) {
        return true;
      }
    }

    return false;
  } catch {
    // If we can't safely check, assume it might be special for these specific keys
    return key === "params" || key === "searchParams" || key.includes("Params");
  }
};

/**
 * Safe JSON stringify that handles circular references and Next.js objects
 *
 * This is the core stringification function that all other JSON utilities should use.
 * It safely handles:
 * - Circular references
 * - DOM elements
 * - React internal properties
 * - Next.js special objects
 * - Function objects
 * - Undefined values
 */
export const safeJsonStringify = (obj: any, space?: number): string => {
  const seen = new WeakSet();
  try {
    return JSON.stringify(
      obj,
      (key, value) => {
        if (typeof value === "object" && value !== null) {
          if (seen.has(value)) {
            return "[Circular Reference]";
          }
          seen.add(value);

          // Handle Next.js special objects before enumeration to prevent warnings
          if (isNextJsSpecialObject(value, key)) {
            if (key === "params" || key.includes("Params")) {
              return "[Next.js Params Object]";
            }
            if (key === "searchParams" || key.includes("SearchParams")) {
              return "[Next.js SearchParams Object]";
            }
            return "[Next.js Special Object]";
          }

          // Handle React components with compiled code
          if (isReactComponentWithCompiledCode(value, key)) {
            // Try to extract meaningful info without serializing huge strings
            const componentInfo = [];
            if (value.tag !== undefined) componentInfo.push(`tag:${value.tag}`);
            // Skip key property entirely for React elements to avoid warnings
            if ("key" in value) {
              componentInfo.push(`key:[protected]`);
            }

            if (
              value.type &&
              typeof value.type === "string" &&
              value.type.length > 1000
            ) {
              // Extract component name if possible
              const nameMatch = value.type.match(
                /function\s+([A-Za-z_$][A-Za-z0-9_$]*)/
              );
              const componentName = nameMatch ? nameMatch[1] : "Unknown";
              componentInfo.push(`compiled:${componentName}`);
            } else if (value.type && typeof value.type === "function") {
              componentInfo.push(`func:${value.type.name || "anonymous"}`);
            }

            return `[React Component: ${componentInfo.join(", ")}]`;
          }

          // Filter out React internal properties and DOM elements
          // Use try-catch to prevent any property access warnings
          try {
            if (
              value.constructor?.name === "HTMLElement" ||
              value.constructor?.name?.includes("Element") ||
              key.startsWith("__react") ||
              key.startsWith("_react") ||
              key === "stateNode" ||
              key === "fiber"
            ) {
              return "[DOM Element]";
            }
          } catch {
            // If we can't safely check the constructor, treat as potentially problematic
            if (
              key.startsWith("__react") ||
              key.startsWith("_react") ||
              key === "stateNode" ||
              key === "fiber"
            ) {
              return "[React Internal]";
            }
          }
        }

        // Handle functions
        if (typeof value === "function") {
          return `[Function: ${value.name || "anonymous"}]`;
        }

        // Handle undefined (JSON.stringify normally omits these)
        if (value === undefined) {
          return "[undefined]";
        }

        return value;
      },
      space
    );
  } catch (error) {
    return `[Error stringifying: ${error instanceof Error ? error.message : "unknown"}]`;
  }
};

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
      const result = safeJsonStringify(obj, 2);
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
