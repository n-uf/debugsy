/**
 * Display Helper Functions
 *
 * Utility functions for formatting and styling display content.
 */

import type { DisplayContent } from "../../../patterns/display-system/display-state";

/**
 * Format timestamp to MM:SS format
 */
export const formatTime = (timestamp: string | number): string => {
  if (typeof timestamp === "string") return timestamp;
  const date = new Date(timestamp);
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

/**
 * Get color for content type
 */
export const getContentColor = (type: DisplayContent["type"]): string => {
  switch (type) {
    case "success":
      return "#10b981";
    case "error":
      return "#ef4444";
    case "warning":
      return "#fbbf24";
    case "info":
      return "#60a5fa";
  }
};

/**
 * Get emoji for content type
 */
export const getContentEmoji = (type: DisplayContent["type"]): string => {
  switch (type) {
    case "success":
      return "✅";
    case "error":
      return "❌";
    case "warning":
      return "⚠️";
    case "info":
      return "ℹ️";
  }
};

/**
 * Calculate elapsed time string
 */
export const getElapsedTime = (
  showProcessingTime: boolean,
  itemShowProcessingTime?: boolean,
  processingStartTime?: number
): string => {
  if (!showProcessingTime || !itemShowProcessingTime || !processingStartTime) {
    return "";
  }
  const elapsed = (Date.now() - processingStartTime) / 1000;
  return ` (${elapsed.toFixed(1)}s)`;
};

// =============================================================================
// ALERT MODE
// =============================================================================

/** Alert text colours on the dark display panel. */
export const DISPLAY_ALERT_COLORS = {
  error: "#ef4444",
  warning: "#fbbf24",
} as const;

/** Panel tint behind an alert (keeps the dark display, reads as the alert colour). */
export const DISPLAY_ALERT_SURFACES = {
  error: "rgba(239, 68, 68, 0.14)",
  warning: "rgba(245, 158, 11, 0.12)",
} as const;

/**
 * Colours of the detail banner (concept C), per severity: a deep tinted
 * surface with one soft accent for text, icon and controls, a thin rule on
 * top and outlined buttons.
 */
export const DISPLAY_ALERT_BANNER = {
  error: {
    background: "#37110f",
    text: "#de8481",
    muted: "#bb6c69",
    controlBorder: "#541c19",
    controlHover: "#4a1714",
    controlStrongBorder: "#7a2a26",
    rule: "#571d1a",
    ok: "#9fd6a8",
  },
  warning: {
    background: "#33250a",
    text: "#e3b45f",
    muted: "#b8914c",
    controlBorder: "#5a4214",
    controlHover: "#46330e",
    controlStrongBorder: "#7a5a1c",
    rule: "#664b12",
    ok: "#a7d8a0",
  },
} as const;

/** The error banner palette (kept for existing imports). */
export const DISPLAY_ALERT_PANEL = DISPLAY_ALERT_BANNER.error;


/** Default slot colours per alert action kind (the display's slot palette). */
export const DISPLAY_ALERT_SLOT_COLORS = {
  retry: { bg: "#dc2626", hover: "#b91c1c", color: "#ffffff" },
  details: { bg: "#6366f1", hover: "#4f46e5", color: "#ffffff" },
  dismiss: { bg: "#ffffff", hover: "#e5e7eb", color: "#4b5563" },
  custom: { bg: "#ffffff", hover: "#e5e7eb", color: "#4b5563" },
} as const;

/**
 * Font size that fits `text` into a character budget: full size within the
 * budget, scaled down proportionally beyond it, never below `min`. Text
 * past the minimum wraps instead of being cut off.
 */
export const fitAlertFontSize = (
  text: string,
  budget: number,
  base: number,
  min: number,
): number => {
  const length = [...text].length;
  if (length <= budget || length === 0) return base;
  const scaled = Math.floor(((base * budget) / length) * 10) / 10;
  return Math.max(min, scaled);
};
