/**
 * Shared engineering-focused design tokens for debug formatters
 */
export const SHARED_TOKENS = {
  spacing: {
    xs: "2px",
    sm: "4px",
    md: "6px",
    lg: "8px",
    xl: "12px",
    xxl: "16px",
  },

  colors: {
    // Terminal-like base colors
    bg: "#0d1117",
    bgSecondary: "#161b22",
    bgTertiary: "#21262d",
    border: "#30363d",
    borderSecondary: "#21262d",

    // Status colors
    success: "#28a745",
    warning: "#fb8500",
    error: "#d73a49",
    info: "#58a6ff",
    critical: "#da3633",

    // Dependency change colors
    added: "#28a745",
    removed: "#d73a49",
    changed: "#fb8500",

    // Text colors
    text: "#f0f6fc",
    textSecondary: "#8b949e",
    textMuted: "#6e7681",
    accent: "#58a6ff",

    // Category specific colors
    performance: "#28a745",
    debug: "#fb8500",
    dependencies: "#58a6ff",
    system: "#8b5cf6",
    circuit: "#d73a49",
    memory: "#10b981",
    network: "#3b82f6",
    storage: "#f59e0b",
  },

  fonts: {
    mono: "'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace",
  },

  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.1)",
    md: "0 2px 4px 0 rgba(0, 0, 0, 0.15)",
  },

  borderRadius: {
    sm: "2px",
    md: "3px",
    lg: "4px",
  },
} as const;

/**
 * Common metric value types with consistent styling
 */
export const METRIC_TYPES = {
  percentage: { suffix: "%", color: SHARED_TOKENS.colors.info },
  bytes: { suffix: "B", color: SHARED_TOKENS.colors.memory },
  count: { suffix: "", color: SHARED_TOKENS.colors.text },
  time: { suffix: "ms", color: SHARED_TOKENS.colors.warning },
  boolean: { suffix: "", color: SHARED_TOKENS.colors.success },
} as const;

export type MetricType = keyof typeof METRIC_TYPES;
