/**
 * Enhanced Object Display Utilities
 * Provides better type information and formatting for object values
 * Maintains V2 look & feel with enhanced information
 */

/**
 * Enhanced object display information
 */
export interface EnhancedDisplay {
  display: string;
  type: string;
  badge?: string;
}

/**
 * Get enhanced display information for any value
 * Returns human-readable representation with type info
 */
export const getEnhancedObjectDisplay = (value: any): EnhancedDisplay => {
  if (value === null) return { display: "null", type: "null" };
  if (value === undefined) return { display: "undefined", type: "undefined" };

  if (typeof value === "object") {
    try {
      // Arrays
      if (Array.isArray(value)) {
        const badge = value.length > 10 ? "🔢" : value.length > 0 ? "📋" : "📄";
        return {
          display: `Array(${value.length})`,
          type: "array",
          badge,
        };
      }

      // Constructor-based objects
      const constructorName = value.constructor?.name;
      if (constructorName && constructorName !== "Object") {
        const badge =
          constructorName === "HTMLElement"
            ? "🌐"
            : constructorName.includes("Fiber")
              ? "⚛️"
              : constructorName === "Date"
                ? "📅"
                : constructorName === "Map"
                  ? "🗺️"
                  : constructorName === "Set"
                    ? "📦"
                    : "🏗️";
        return {
          display: `${constructorName}{}`,
          type: "constructor",
          badge,
        };
      }

      // Plain objects
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return { display: "{}", type: "object", badge: "📄" };
      } else if (keys.length <= 3) {
        return {
          display: `{${keys.join(", ")}}`,
          type: "object",
          badge: "📋",
        };
      } else {
        return {
          display: `{${keys.slice(0, 3).join(", ")}, +${keys.length - 3}}`,
          type: "object",
          badge: "📊",
        };
      }
    } catch (error) {
      return { display: "[Object]", type: "unknown", badge: "❓" };
    }
  }

  // Functions
  if (typeof value === "function") {
    const funcName = value.name || "anonymous";
    return {
      display: `ƒ ${funcName}`,
      type: "function",
      badge: "ƒ",
    };
  }

  // Primitives
  const type = typeof value;
  const badge =
    type === "string"
      ? "📝"
      : type === "number"
        ? "🔢"
        : type === "boolean"
          ? "✓"
          : "❓";

  return {
    display: String(value),
    type,
    badge,
  };
};

