/**
 * Color tokens extracted from debugsy and surface-ui usage patterns
 * These colors are used consistently across the monorepo
 */

export const colors = {
  // Primary (blue - interactions, active states)
  primary: {
    50: "#f0f9ff",
    100: "#e0f2fe",
    500: "#3b82f6",
    600: "#2563eb",
    900: "#1e3a8a",
  },

  // Success (green - enabled states, positive actions)
  success: {
    50: "#f0fdf4",
    200: "#bbf7d0",
    500: "#10b981",
    600: "#059669",
  },

  // Error (red - disabled states, errors)
  error: {
    50: "#fef2f2",
    200: "#fecaca",
    500: "#ef4444",
    600: "#dc2626",
  },

  // Warning (yellow - alerts, cautions)
  warning: {
    50: "#fefce8",
    200: "#fde047",
    500: "#f59e0b",
    800: "#854d0e",
  },

  // Neutral (gray - UI chrome, borders, text)
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },

  // Terminal/Debug UI colors (dark theme)
  terminal: {
    bgDark: "#000000f0",
    bgDarkSecondary: "#00000080",
    border: "#374151",
    borderSecondary: "#4b5563",
    text: "#f0f6fc",
    textSecondary: "#8b949e",
    textMuted: "#6b7280",
    success: "#10b981",
    resizeHandle: "#10b981",
  },
} as const;

export type ColorScale = keyof typeof colors;
export type ColorShade = keyof (typeof colors)[ColorScale];
