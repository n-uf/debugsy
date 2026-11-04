/**
 * Depth Control Helpers - Default implementations for depth control
 *
 * Provides standard color progressions and descriptions matching debugsy V1.
 */

export type DepthSetting = "str" | "1" | "3" | "5" | "10" | "all";

/**
 * Get depth color - Original debugsy V1 color progression
 *
 * Color progression: pink → red → orange → purple → blue → green
 *
 * @param depth - Depth setting value
 * @returns Color hex code
 */
export function getDepthColor(depth: DepthSetting): string {
  switch (depth) {
    case "str":
      return "#ec4899"; // pink (string mode - most restrictive, border only)
    case "1":
      return "#ef4444"; // red (1 level)
    case "3":
      return "#f59e0b"; // orange (3 levels)
    case "5":
      return "#8b5cf6"; // purple (5 levels)
    case "10":
      return "#3b82f6"; // blue (10 levels)
    case "all":
      return "#10b981"; // green (unlimited - most permissive)
    default:
      return "#6b7280"; // gray (fallback)
  }
}

/**
 * Get depth description - Human-readable depth setting
 *
 * @param depth - Depth setting value
 * @returns Description string
 */
export function getDepthDescription(depth: DepthSetting): string {
  switch (depth) {
    case "all":
      return "Full depth (no limits)";
    case "10":
      return "10 levels deep";
    case "5":
      return "5 levels deep";
    case "3":
      return "3 levels deep";
    case "1":
      return "1 level only";
    case "str":
      return "String format (1000 chars)";
    default:
      return "Unknown setting";
  }
}

/**
 * Get depth width - Progress bar width as percentage
 *
 * @param depth - Depth setting value
 * @returns Width percentage string
 */
export function getDepthWidth(depth: DepthSetting): string {
  if (depth === "str") return "100%"; // String mode shows full border

  const depths: DepthSetting[] = ["str", "1", "3", "5", "10", "all"];
  const currentIndex = depths.indexOf(depth);
  return `${((currentIndex + 1) / depths.length) * 100}%`;
}

/**
 * Check if depth mode uses border-only styling (no fill)
 *
 * @param depth - Depth setting value
 * @returns True if mode should use border only
 */
export function isDepthBorderOnly(depth: DepthSetting): boolean {
  return depth === "str";
}

/**
 * Get depth background color (transparent for border-only modes)
 *
 * @param depth - Depth setting value
 * @returns Background color (transparent for "str" mode)
 */
export function getDepthBackgroundColor(depth: DepthSetting): string {
  return isDepthBorderOnly(depth) ? "transparent" : getDepthColor(depth);
}
