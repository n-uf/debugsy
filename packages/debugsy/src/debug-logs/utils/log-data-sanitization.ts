import { safeSuperjsonStringify } from "../components/logs/utils/json/json-core";

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
    // Check for React Fiber properties (these create circular references)
    if (
      data.hasOwnProperty("__reactFiber$") ||
      data.hasOwnProperty("__reactInternalInstance") ||
      data.hasOwnProperty("_reactInternalFiber")
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
