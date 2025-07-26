import React from "react";

/**
 * Configuration for data sanitization
 */
interface SanitizationConfig {
  /** Maximum depth to traverse objects */
  maxDepth: number;
  /** Maximum number of properties to include per object */
  maxProperties: number;
  /** Maximum string length before truncation */
  maxStringLength: number;
  /** Maximum array length before truncation */
  maxArrayLength: number;
  /** Whether to include function signatures */
  includeFunctionSignatures: boolean;
  /** Whether to detect and summarize React components */
  detectReactComponents: boolean;
}

/**
 * Default sanitization configuration optimized for debug logging
 */
const DEFAULT_CONFIG: SanitizationConfig = {
  maxDepth: 3,
  maxProperties: 10,
  maxStringLength: 500,
  maxArrayLength: 20,
  includeFunctionSignatures: true,
  detectReactComponents: true,
};

/**
 * Tracks objects being processed to prevent infinite recursion
 */
class CircularReferenceTracker {
  private seen = new WeakSet();
  private pathStack: string[] = [];

  has(obj: any): boolean {
    return this.seen.has(obj);
  }

  add(obj: any, path: string): void {
    this.seen.add(obj);
    this.pathStack.push(path);
  }

  remove(obj: any): void {
    this.seen.delete(obj);
    this.pathStack.pop();
  }

  getCurrentPath(): string {
    return this.pathStack.join(".");
  }

  getCircularRef(): string {
    return `[Circular Reference: ${this.getCurrentPath()}]`;
  }
}

/**
 * Safely detect if an object is a React element
 */
function isReactElement(obj: any): boolean {
  try {
    return (
      obj !== null &&
      typeof obj === "object" &&
      typeof obj.$$typeof === "symbol" &&
      obj.$$typeof.toString().includes("react.element")
    );
  } catch {
    return false;
  }
}

/**
 * Safely detect if an object is a React component
 */
function isReactComponent(obj: any): boolean {
  try {
    if (typeof obj !== "function") return false;

    // Check for React component patterns
    const str = obj.toString();
    return (
      str.includes("createElement") ||
      str.includes("jsx") ||
      str.includes("React") ||
      str.includes("useState") ||
      str.includes("useEffect") ||
      obj.prototype?.isReactComponent === true ||
      obj.defaultProps !== undefined ||
      obj.propTypes !== undefined
    );
  } catch {
    return false;
  }
}

/**
 * Check if an object contains potentially problematic React structures
 */
function containsReactInternals(obj: any): boolean {
  try {
    if (!obj || typeof obj !== "object") return false;

    // Check for React Fiber node properties
    const reactInternalKeys = [
      "_owner",
      "ref",
      "key",
      "$$typeof",
      "type",
      "props",
      "_store",
      "_self",
      "_source",
      "memoizedState",
      "memoizedProps",
      "stateNode",
      "child",
      "sibling",
      "return",
      "alternate",
    ];

    return reactInternalKeys.some((key) => key in obj);
  } catch {
    return false;
  }
}

/**
 * Check if a string looks like compiled code (Turbopack, Webpack, etc.)
 */
function isCompiledCode(str: string): boolean {
  if (typeof str !== "string" || str.length < 1000) return false;

  const compiledPatterns = [
    "__TURBOPACK__",
    "__webpack_require__",
    "_interop_require_default",
    "compiled$2f",
    "node_modules",
    "chunks$2f",
    // Function pattern for compiled code
    /function[^{]*\{[^}]*__[A-Z_]+__/,
    // Long minified variable names
    /[a-zA-Z]\$[a-zA-Z0-9]{10,}/,
    // Webpack/Turbopack module paths
    /\$5b[a-zA-Z0-9_$]+\$5d/,
  ];

  return compiledPatterns.some((pattern) =>
    typeof pattern === "string" ? str.includes(pattern) : pattern.test(str)
  );
}

/**
 * Create a summary for React elements
 */
function summarizeReactElement(element: any): any {
  try {
    const summary: any = {
      __type: "ReactElement",
      elementType:
        typeof element.type === "string"
          ? element.type
          : element.type?.name || "Component",
      key: element.key,
      propsCount: element.props ? Object.keys(element.props).length : 0,
    };

    // Include some safe props
    if (element.props) {
      const safeProps: any = {};
      const props = element.props;

      // Include primitive props only
      Object.keys(props)
        .slice(0, 5)
        .forEach((key) => {
          const value = props[key];
          if (key === "children") {
            if (React.isValidElement(value)) {
              safeProps[key] = "[ReactElement]";
            } else if (Array.isArray(value)) {
              safeProps[key] = `[${value.length} children]`;
            } else if (typeof value === "string" && value.length < 50) {
              safeProps[key] = value;
            } else {
              safeProps[key] = "[Complex children]";
            }
          } else if (
            typeof value === "string" ||
            typeof value === "number" ||
            typeof value === "boolean"
          ) {
            safeProps[key] =
              typeof value === "string" && value.length > 50
                ? value.substring(0, 50) + "..."
                : value;
          } else if (typeof value === "function") {
            safeProps[key] = `[Function: ${value.name || "anonymous"}]`;
          } else {
            safeProps[key] = `[${typeof value}]`;
          }
        });

      summary.props = safeProps;
    }

    return summary;
  } catch {
    return { __type: "ReactElement", __error: "Failed to summarize" };
  }
}

/**
 * Create a summary for React components (functions/classes)
 */
function summarizeReactComponent(component: any): any {
  try {
    const summary: any = {
      __type: "ReactComponent",
      name: component.name || component.displayName || "Anonymous",
      isClass: component.prototype?.isReactComponent === true,
      hasDefaultProps: component.defaultProps !== undefined,
      hasPropTypes: component.propTypes !== undefined,
    };

    // Check for compiled code
    const codeStr = component.toString();
    if (isCompiledCode(codeStr)) {
      summary.isCompiled = true;
      summary.codePreview = "[Compiled/Minified Code]";
      summary.codeLength = codeStr.length;
    } else {
      summary.codePreview =
        codeStr.length > 200 ? codeStr.substring(0, 200) + "..." : codeStr;
    }

    return summary;
  } catch {
    return { __type: "ReactComponent", __error: "Failed to summarize" };
  }
}

/**
 * Sanitize a single value based on its type
 */
function sanitizeValue(
  value: any,
  path: string,
  depth: number,
  config: SanitizationConfig,
  tracker: CircularReferenceTracker
): any {
  // Handle null and undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle primitives
  if (typeof value === "boolean" || typeof value === "number") {
    return value;
  }

  // Handle strings
  if (typeof value === "string") {
    if (isCompiledCode(value)) {
      return `[Compiled Code: ${value.length} chars]`;
    }
    return value.length > config.maxStringLength
      ? value.substring(0, config.maxStringLength) +
          `... (${value.length} total chars)`
      : value;
  }

  // Handle functions
  if (typeof value === "function") {
    if (config.detectReactComponents && isReactComponent(value)) {
      return summarizeReactComponent(value);
    }

    if (config.includeFunctionSignatures) {
      const name = value.name || "anonymous";
      const codeStr = value.toString();

      if (isCompiledCode(codeStr)) {
        return `[Compiled Function: ${name}]`;
      }

      // Extract function signature (first line)
      const signature = codeStr.split("\n")[0];
      return `[Function: ${name}] ${signature.length > 100 ? signature.substring(0, 100) + "..." : signature}`;
    }

    return `[Function: ${value.name || "anonymous"}]`;
  }

  // Handle symbols
  if (typeof value === "symbol") {
    return `[Symbol: ${value.toString()}]`;
  }

  // Handle dates
  if (value instanceof Date) {
    return { __type: "Date", value: value.toISOString() };
  }

  // Handle errors
  if (value instanceof Error) {
    return {
      __type: "Error",
      name: value.name,
      message: value.message,
      stack: value.stack?.substring(0, 500),
    };
  }

  // Handle DOM elements
  if (typeof HTMLElement !== "undefined" && value instanceof HTMLElement) {
    return {
      __type: "HTMLElement",
      tagName: value.tagName,
      id: value.id,
      className: value.className,
    };
  }

  // Check depth limit
  if (depth >= config.maxDepth) {
    return `[Object: max depth ${config.maxDepth} reached]`;
  }

  // Handle objects and arrays
  if (typeof value === "object") {
    // Check circular references
    if (tracker.has(value)) {
      return tracker.getCircularRef();
    }

    // Add to circular reference tracker
    tracker.add(value, path);

    try {
      // Handle React elements
      if (config.detectReactComponents && isReactElement(value)) {
        const summary = summarizeReactElement(value);
        tracker.remove(value);
        return summary;
      }

      // Check for React internals
      if (containsReactInternals(value)) {
        const summary = {
          __type: "ReactInternals",
          __warning: "Contains React internal structures",
          safeKeys: Object.keys(value).slice(0, 3),
          totalKeys: Object.keys(value).length,
        };
        tracker.remove(value);
        return summary;
      }

      // Handle arrays
      if (Array.isArray(value)) {
        const result = value
          .slice(0, config.maxArrayLength)
          .map((item, index) =>
            sanitizeValue(item, `${path}[${index}]`, depth + 1, config, tracker)
          );

        if (value.length > config.maxArrayLength) {
          result.push(
            `... (${value.length - config.maxArrayLength} more items)`
          );
        }

        tracker.remove(value);
        return result;
      }

      // Handle regular objects
      const result: any = {};
      const keys = Object.keys(value);

      // Limit number of properties
      const limitedKeys = keys.slice(0, config.maxProperties);

      for (const key of limitedKeys) {
        try {
          result[key] = sanitizeValue(
            value[key],
            `${path}.${key}`,
            depth + 1,
            config,
            tracker
          );
        } catch (error) {
          result[key] =
            `[Error accessing property: ${error instanceof Error ? error.message : "unknown"}]`;
        }
      }

      // Add metadata about truncation
      if (keys.length > config.maxProperties) {
        result.__truncated = `... (${keys.length - config.maxProperties} more properties)`;
      }

      tracker.remove(value);
      return result;
    } catch (error) {
      tracker.remove(value);
      return `[Error sanitizing object: ${error instanceof Error ? error.message : "unknown"}]`;
    }
  }

  // Fallback for unknown types
  return `[Unknown type: ${typeof value}]`;
}

/**
 * MAIN FUNCTION: Sanitize data for safe logging
 *
 * This function processes any data structure and makes it safe for:
 * - JSON serialization
 * - Storage in memory
 * - Display in debug panels
 * - Console logging
 *
 * It handles:
 * - React elements and components
 * - Circular references
 * - Large objects and deep nesting
 * - Functions and compiled code
 * - DOM elements
 * - Errors and special objects
 */
export function sanitizeLogData(
  data: any,
  config: Partial<SanitizationConfig> = {}
): any {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const tracker = new CircularReferenceTracker();

  try {
    const startTime = performance.now();
    const result = sanitizeValue(data, "root", 0, finalConfig, tracker);
    const endTime = performance.now();

    // Add sanitization metadata
    return {
      __sanitized: true,
      __sanitizationTime: Math.round((endTime - startTime) * 100) / 100,
      __config: finalConfig,
      data: result,
    };
  } catch (error) {
    return {
      __sanitized: true,
      __error: `Sanitization failed: ${error instanceof Error ? error.message : "unknown"}`,
      data: "[Unsanitizable data]",
    };
  }
}

/**
 * Fast check if data needs sanitization
 * Returns true if data likely contains problematic structures
 */
export function needsSanitization(data: any): boolean {
  if (!data || typeof data !== "object") {
    return false;
  }

  try {
    // Quick checks for problematic structures
    if (isReactElement(data)) return true;
    if (containsReactInternals(data)) return true;
    if (Array.isArray(data) && data.length > 50) return true;

    // Check object size and complexity
    const keys = Object.keys(data);
    if (keys.length > 20) return true;

    // Check for functions or React components
    for (const key of keys.slice(0, 10)) {
      const value = data[key];
      if (typeof value === "function") return true;
      if (isReactElement(value)) return true;
      if (containsReactInternals(value)) return true;
    }

    return false;
  } catch {
    return true; // If we can't analyze it, it's probably problematic
  }
}

/**
 * Preset configurations for different use cases
 */
export const SANITIZATION_PRESETS = {
  /** Minimal sanitization for performance-critical paths */
  minimal: {
    maxDepth: 2,
    maxProperties: 5,
    maxStringLength: 200,
    maxArrayLength: 10,
    includeFunctionSignatures: false,
    detectReactComponents: true,
  },

  /** Balanced sanitization for general debugging */
  balanced: DEFAULT_CONFIG,

  /** Thorough sanitization for complex debugging scenarios */
  thorough: {
    maxDepth: 5,
    maxProperties: 20,
    maxStringLength: 1000,
    maxArrayLength: 50,
    includeFunctionSignatures: true,
    detectReactComponents: true,
  },

  /** React-focused sanitization for UI debugging */
  reactFocused: {
    maxDepth: 4,
    maxProperties: 15,
    maxStringLength: 300,
    maxArrayLength: 30,
    includeFunctionSignatures: true,
    detectReactComponents: true,
  },
} as const;

export default sanitizeLogData;
