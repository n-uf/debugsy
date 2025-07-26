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
 * Performance monitoring for sanitization operations
 */
interface PerformanceStats {
  needsSanitizationCalls: number;
  needsSanitizationTime: number;
  sanitizeDataCalls: number;
  sanitizeDataTime: number;
  cacheHits: number;
  cacheMisses: number;
}

/**
 * Global performance statistics
 */
const performanceStats: PerformanceStats = {
  needsSanitizationCalls: 0,
  needsSanitizationTime: 0,
  sanitizeDataCalls: 0,
  sanitizeDataTime: 0,
  cacheHits: 0,
  cacheMisses: 0,
};

/**
 * Fast memoization cache for needsSanitization results
 * Using WeakMap for automatic garbage collection
 */
const needsSanitizationCache = new WeakMap<object, boolean>();

/**
 * Performance budget constants
 */
const PERFORMANCE_BUDGET = {
  /** Maximum time allowed for needsSanitization check (microseconds) */
  MAX_NEEDS_SANITIZATION_TIME: 100, // 0.1ms
  /** Maximum time allowed for full sanitization (milliseconds) */
  MAX_SANITIZATION_TIME: 10, // 10ms
  /** Cache size limit for performance monitoring */
  MAX_CACHE_SIZE: 1000,
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
 * OPTIMIZED: Cached regex patterns for compiled code detection
 */
const COMPILED_CODE_PATTERNS = {
  turbopack: /__TURBOPACK__/,
  webpack: /__webpack_require__/,
  interop: /_interop_require_default/,
  compiled: /compiled\$2f/,
  nodeModules: /node_modules/,
  chunks: /chunks\$2f/,
  functionPattern: /function[^{]*\{[^}]*__[A-Z_]+__/,
  minifiedVars: /[a-zA-Z]\$[a-zA-Z0-9]{10,}/,
  modulePaths: /\$5b[a-zA-Z0-9_$]+\$5d/,
};

/**
 * OPTIMIZED: Cached React internal keys for faster lookup
 */
const REACT_INTERNAL_KEYS = new Set([
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
]);

/**
 * ENHANCED: Check if an object is a DOM element with React Fiber attached
 */
function isDOMElementWithReactFiber(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;

  try {
    // Check if it's a DOM element
    if (typeof HTMLElement !== "undefined" && obj instanceof HTMLElement) {
      // Check for React Fiber properties (these create circular references)
      for (const key in obj) {
        if (
          key.includes("__reactFiber") ||
          key.includes("__reactInternalInstance")
        ) {
          return true;
        }
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * ENHANCED: Check if an object is a React Fiber node
 */
function isReactFiberNode(obj: any): boolean {
  if (!obj || typeof obj !== "object") return false;

  try {
    // React Fiber nodes have these characteristic properties
    return (
      obj.tag !== undefined &&
      obj.type !== undefined &&
      obj.stateNode !== undefined &&
      (obj.child !== undefined ||
        obj.return !== undefined ||
        obj.sibling !== undefined)
    );
  } catch {
    return false;
  }
}

/**
 * ULTRA-FAST: Simple React element check (optimized for speed)
 */
function isReactElement(obj: any): boolean {
  return !!(obj && obj.$$typeof && obj.type);
}

/**
 * ULTRA-FAST: Simple check for React internals (optimized for speed)
 */
function containsReactInternals(obj: any): boolean {
  return !!(obj && (obj._owner || obj.$$typeof || obj.memoizedState));
}

/**
 * SIMPLIFIED: Fast check for objects that likely need sanitization
 */
function quickSanitizationCheck(data: any): boolean {
  // Fast primitive check
  if (!data || typeof data !== "object") return false;

  // Fast array check
  if (Array.isArray(data)) {
    return data.length > 20; // Simple length check
  }

  // Fast React checks (only the most common patterns)
  if (data.$$typeof || data._owner || data.type) return true;

  // Fast DOM element check
  if (data.nodeType && data.tagName) return true;

  // Simple property count check (much faster)
  let count = 0;
  for (const key in data) {
    if (++count > 15) return true; // Early exit
    // Quick function check on first few properties
    if (count <= 3 && typeof data[key] === "function") return true;
  }

  return false;
}

/**
 * OPTIMIZED: Safely detect if an object is a React component (reduced overhead)
 */
function isReactComponent(obj: any): boolean {
  if (typeof obj !== "function") return false;

  try {
    // Fast checks before expensive toString()
    if (obj.prototype?.isReactComponent === true) return true;
    if (obj.defaultProps !== undefined || obj.propTypes !== undefined)
      return true;

    // Only do expensive string analysis if necessary
    const str = obj.toString();
    if (str.length > 5000) return true; // Likely compiled if very long

    return (
      str.includes("createElement") ||
      str.includes("jsx") ||
      str.includes("useState") ||
      str.includes("useEffect")
    );
  } catch {
    return false;
  }
}

/**
 * OPTIMIZED: Check if a string looks like compiled code (cached patterns)
 */
function isCompiledCode(str: string): boolean {
  if (typeof str !== "string" || str.length < 1000) return false;

  // Use cached regex patterns for better performance
  return (
    COMPILED_CODE_PATTERNS.turbopack.test(str) ||
    COMPILED_CODE_PATTERNS.webpack.test(str) ||
    COMPILED_CODE_PATTERNS.interop.test(str) ||
    COMPILED_CODE_PATTERNS.compiled.test(str) ||
    COMPILED_CODE_PATTERNS.nodeModules.test(str) ||
    COMPILED_CODE_PATTERNS.chunks.test(str) ||
    COMPILED_CODE_PATTERNS.functionPattern.test(str) ||
    COMPILED_CODE_PATTERNS.minifiedVars.test(str) ||
    COMPILED_CODE_PATTERNS.modulePaths.test(str)
  );
}

/**
 * ENHANCED: Create a summary for DOM elements with React Fiber nodes
 */
function summarizeDOMElementWithFiber(element: any): any {
  try {
    const summary: any = {
      __type: "DOMElementWithReactFiber",
      tagName: element.tagName || "Unknown",
      id: element.id || null,
      className: element.className || null,
      __warning: "Contains React Fiber nodes with circular references",
    };

    // Count React Fiber properties
    let fiberPropCount = 0;
    for (const key in element) {
      if (
        key.includes("__reactFiber") ||
        key.includes("__reactInternalInstance")
      ) {
        fiberPropCount++;
      }
    }

    summary.reactFiberProperties = fiberPropCount;

    // Add safe attributes without diving into Fiber nodes
    if (element.attributes && element.attributes.length > 0) {
      const attrs: any = {};
      for (let i = 0; i < Math.min(element.attributes.length, 5); i++) {
        const attr = element.attributes[i];
        attrs[attr.name] = attr.value;
      }
      summary.attributes = attrs;
    }

    return summary;
  } catch {
    return {
      __type: "DOMElementWithReactFiber",
      __error: "Failed to summarize",
    };
  }
}

/**
 * ENHANCED: Create a summary for React Fiber nodes
 */
function summarizeReactFiberNode(node: any): any {
  try {
    const summary: any = {
      __type: "ReactFiberNode",
      tag: node.tag,
      type:
        typeof node.type === "string"
          ? node.type
          : node.type?.name || "Component",
      __warning: "React Fiber node with potential circular references",
    };

    // Add safe properties without circular references
    if (node.key !== null && node.key !== undefined) {
      summary.key = node.key;
    }

    if (node.index !== undefined) {
      summary.index = node.index;
    }

    // Count child/sibling relationships without traversing them
    summary.hasChild = node.child !== null && node.child !== undefined;
    summary.hasSibling = node.sibling !== null && node.sibling !== undefined;
    summary.hasReturn = node.return !== null && node.return !== undefined;

    return summary;
  } catch {
    return { __type: "ReactFiberNode", __error: "Failed to summarize" };
  }
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

  // ENHANCED: Handle DOM elements with React Fiber nodes (PRIORITY CHECK)
  if (isDOMElementWithReactFiber(value)) {
    const summary = summarizeDOMElementWithFiber(value);
    return summary;
  }

  // Handle regular DOM elements
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
      // ENHANCED: Handle React Fiber nodes (PRIORITY CHECK)
      if (isReactFiberNode(value)) {
        const summary = summarizeReactFiberNode(value);
        tracker.remove(value);
        return summary;
      }

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
 * - DOM elements with React Fiber nodes (NEW)
 * - React Fiber nodes directly (NEW)
 */
export function sanitizeLogData(
  data: any,
  config: Partial<SanitizationConfig> = {}
): any {
  const startTime = performance.now();
  performanceStats.sanitizeDataCalls++;

  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const tracker = new CircularReferenceTracker();

  try {
    const result = sanitizeValue(data, "root", 0, finalConfig, tracker);
    const endTime = performance.now();
    const sanitizationTime = Math.round((endTime - startTime) * 100) / 100;

    // Update performance statistics
    performanceStats.sanitizeDataTime += endTime - startTime;

    // Performance warning if sanitization is too slow
    if (sanitizationTime > PERFORMANCE_BUDGET.MAX_SANITIZATION_TIME) {
      console.warn(
        `⚠️ [Sanitization] Slow sanitization detected: ${sanitizationTime}ms (budget: ${PERFORMANCE_BUDGET.MAX_SANITIZATION_TIME}ms)`,
        { config: finalConfig, dataType: typeof data }
      );
    }

    // Add sanitization metadata
    return {
      __sanitized: true,
      __sanitizationTime: sanitizationTime,
      __config: finalConfig,
      data: result,
    };
  } catch (error) {
    const endTime = performance.now();
    performanceStats.sanitizeDataTime += endTime - startTime;

    return {
      __sanitized: true,
      __error: `Sanitization failed: ${error instanceof Error ? error.message : "unknown"}`,
      data: "[Unsanitizable data]",
    };
  }
}

/**
 * ULTRA-FAST: Check if data needs sanitization with simplified logic
 * This function is called for EVERY debug log entry, so it must be extremely fast
 */
export function needsSanitization(data: any): boolean {
  const startTime = performance.now();
  performanceStats.needsSanitizationCalls++;

  // FAST PATH 1: Primitives and null/undefined (most common case)
  if (!data || typeof data !== "object") {
    const endTime = performance.now();
    performanceStats.needsSanitizationTime += (endTime - startTime) * 1000;
    return false;
  }

  // FAST PATH 2: Check memoization cache
  if (needsSanitizationCache.has(data)) {
    const endTime = performance.now();
    performanceStats.needsSanitizationTime += (endTime - startTime) * 1000;
    performanceStats.cacheHits++;
    return needsSanitizationCache.get(data)!;
  }

  performanceStats.cacheMisses++;

  try {
    // SIMPLIFIED: Use single fast check instead of multiple expensive ones
    const needsSanitization = quickSanitizationCheck(data);

    // Cache the result
    needsSanitizationCache.set(data, needsSanitization);

    const endTime = performance.now();
    const checkTime = (endTime - startTime) * 1000; // Convert to microseconds
    performanceStats.needsSanitizationTime += checkTime;

    // Performance warning if check is too slow
    if (checkTime > PERFORMANCE_BUDGET.MAX_NEEDS_SANITIZATION_TIME) {
      console.warn(
        `⚠️ [Sanitization] Slow needsSanitization check: ${checkTime.toFixed(2)}μs (budget: ${PERFORMANCE_BUDGET.MAX_NEEDS_SANITIZATION_TIME}μs)`,
        {
          dataType: typeof data,
          arrayLength: Array.isArray(data) ? data.length : "N/A",
        }
      );
    }

    return needsSanitization;
  } catch (error) {
    const endTime = performance.now();
    performanceStats.needsSanitizationTime += (endTime - startTime) * 1000;

    // If we can't analyze it safely, assume it needs sanitization
    const result = true;
    needsSanitizationCache.set(data, result);
    return result;
  }
}

/**
 * Get performance statistics for monitoring and optimization
 */
export function getSanitizationPerformanceStats() {
  const avgNeedsTime =
    performanceStats.needsSanitizationCalls > 0
      ? performanceStats.needsSanitizationTime /
        performanceStats.needsSanitizationCalls
      : 0;

  const avgSanitizeTime =
    performanceStats.sanitizeDataCalls > 0
      ? performanceStats.sanitizeDataTime / performanceStats.sanitizeDataCalls
      : 0;

  const cacheHitRate =
    performanceStats.cacheHits + performanceStats.cacheMisses > 0
      ? (performanceStats.cacheHits /
          (performanceStats.cacheHits + performanceStats.cacheMisses)) *
        100
      : 0;

  return {
    needsSanitizationCalls: performanceStats.needsSanitizationCalls,
    avgNeedsSanitizationTime: Math.round(avgNeedsTime * 100) / 100, // microseconds
    sanitizeDataCalls: performanceStats.sanitizeDataCalls,
    avgSanitizeDataTime: Math.round(avgSanitizeTime * 100) / 100, // milliseconds
    cacheHitRate: Math.round(cacheHitRate * 100) / 100, // percentage
    totalCacheOperations:
      performanceStats.cacheHits + performanceStats.cacheMisses,
    performanceBudget: PERFORMANCE_BUDGET,
    isPerformant:
      avgNeedsTime <= PERFORMANCE_BUDGET.MAX_NEEDS_SANITIZATION_TIME &&
      avgSanitizeTime <= PERFORMANCE_BUDGET.MAX_SANITIZATION_TIME,
  };
}

/**
 * Reset performance statistics (for testing/monitoring)
 */
export function resetSanitizationPerformanceStats() {
  performanceStats.needsSanitizationCalls = 0;
  performanceStats.needsSanitizationTime = 0;
  performanceStats.sanitizeDataCalls = 0;
  performanceStats.sanitizeDataTime = 0;
  performanceStats.cacheHits = 0;
  performanceStats.cacheMisses = 0;
  // Note: WeakMap doesn't support clear() - cache will be garbage collected automatically
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
