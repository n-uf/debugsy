import { safeSuperjsonStringify } from "../../ui/utils/safe-stringify";

// Performance constants for sanitization
export const SANITIZATION_CONFIG = {
  /** Maximum depth for object traversal (for remaining non-superjson cases) */
  MAX_DEPTH: 5,
  /** Maximum number of properties to process per object */
  MAX_PROPERTIES: 50,
  /** Maximum time allowed for sanitization (ms) */
  MAX_SANITIZATION_TIME: 10, // 10ms
  /** Cache size limit for performance monitoring */
  MAX_CACHE_SIZE: 1000,
};

/**
 * OPTIMIZED: Cached regex patterns for compiled code detection
 */
const COMPILED_CODE_PATTERNS = {
  turbopack: /__TURBOPACK__/,
  webpack: /__webpack_require__/,
  nextjs: /_next\/static|__next_/,
  reactFiber: /__reactFiber|__reactInternalInstance/,
} as const;

/**
 * Safely sanitize React elements to extract useful information
 * without the problematic $$typeof symbols and circular references
 */
const sanitizeReactElement = (element: any): any => {
  if (!element || typeof element !== "object") {
    return element;
  }

  // If it's a React element, extract safe information
  if (element.hasOwnProperty("$$typeof") || element.hasOwnProperty("_owner")) {
    const safeName =
      typeof element.type === "function"
        ? `[Function: ${element.type.name || "Anonymous"}]`
        : typeof element.type === "string"
          ? element.type
          : "[Unknown React Element]";

    return {
      __isReactElement: true,
      type: safeName,
      // Recursively sanitize props, but avoid _owner and other problematic properties
      props: element.props ? sanitizeLogData(element.props) : undefined,
      key: element.key,
      // Skip: $$typeof, _owner, _store (these cause the issues)
    };
  }

  return element;
};

/**
 * Primary data sanitization using safe superjson
 * UNIFIED: Uses safeSuperjsonStringify for consistent handling of problematic objects
 */
export const sanitizeLogData = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }

  // For primitive types, return as-is
  if (typeof data !== "object") {
    return data;
  }

  // Handle React elements before superjson processing
  if (isProblematicData(data)) {
    const sanitized = sanitizeReactElement(data);
    if (sanitized !== data) {
      return sanitized;
    }
  }

  try {
    // Use unified safe superjson wrapper to handle circular references, DOM elements, etc.
    // Parse and stringify to ensure clean data structure
    const serialized = safeSuperjsonStringify(data);
    return JSON.parse(serialized);
  } catch (error) {
    // Fallback for extremely problematic objects
    console.warn(
      "Failed to sanitize log data with safeSuperjsonStringify:",
      error
    );
    return {
      __sanitizationError: true,
      __originalType: typeof data,
      __error:
        error instanceof Error ? error.message : "Unknown sanitization error",
    };
  }
};

/**
 * Fast check for obviously problematic data that should be excluded
 */
const isProblematicData = (data: any): boolean => {
  if (!data || typeof data !== "object") return false;

  try {
    // Check for React elements with $$typeof symbol (the main culprit!)
    if (
      data.hasOwnProperty("$$typeof") ||
      data.hasOwnProperty("_owner") ||
      data.hasOwnProperty("_store")
    ) {
      return true;
    }

    // Check for React Fiber properties (these create circular references)
    if (
      data.hasOwnProperty("__reactFiber$") ||
      data.hasOwnProperty("__reactInternalInstance") ||
      data.hasOwnProperty("_reactInternalFiber")
    ) {
      return true;
    }

    // Check for React element-like structures
    if (
      data.type &&
      (typeof data.type === "function" || typeof data.type === "string") &&
      data.props !== undefined
    ) {
      return true;
    }

    // Check for DOM elements
    if (
      data.nodeType !== undefined ||
      data.constructor?.name?.includes("Element") ||
      data.constructor?.name?.includes("Node")
    ) {
      return true;
    }

    // Check for compiled code in object values
    const stringified = String(data);
    return Object.values(COMPILED_CODE_PATTERNS).some((pattern) =>
      pattern.test(stringified)
    );
  } catch {
    // If we can't safely check, consider it potentially problematic
    return true;
  }
};

/**
 * Enhanced log data sanitization that preserves as much information as possible
 * SIMPLIFIED: Uses superjson for heavy lifting, basic filtering for performance
 */
export const sanitizeLogDataAdvanced = (
  data: unknown,
  options: {
    maxDepth?: number;
    preserveStructure?: boolean;
    includeMetadata?: boolean;
  } = {}
): {
  data: unknown;
  metadata?: {
    sanitized: boolean;
    issues: string[];
    performance: {
      timeMs: number;
    };
  };
} => {
  const startTime = performance.now();
  const issues: string[] = [];
  let sanitized = false;

  try {
    // Quick problematic data check
    if (isProblematicData(data)) {
      issues.push("Potentially problematic data detected");
      sanitized = true;
    }

    // Use superjson for safe serialization
    const sanitizedData = sanitizeLogData(data);

    if (sanitizedData !== data) {
      sanitized = true;
      issues.push("Data transformed by superjson");
    }

    const result = {
      data: sanitizedData,
      ...(options.includeMetadata && {
        metadata: {
          sanitized,
          issues,
          performance: {
            timeMs: performance.now() - startTime,
          },
        },
      }),
    };

    return result;
  } catch (error) {
    const fallbackData = {
      __sanitizationFailed: true,
      __originalType: typeof data,
      __error: error instanceof Error ? error.message : "Unknown error",
    };

    return {
      data: fallbackData,
      ...(options.includeMetadata && {
        metadata: {
          sanitized: true,
          issues: ["Complete sanitization failure", ...issues],
          performance: {
            timeMs: performance.now() - startTime,
          },
        },
      }),
    };
  }
};
