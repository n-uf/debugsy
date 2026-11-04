/**
 * Depth control helpers: how deep a copy serialises each log's data.
 */

export type DepthSetting = "str" | "1" | "3" | "5" | "10" | "all";

/** The depth settings from the most to the least restrictive */
export const DEPTH_SETTINGS: readonly DepthSetting[] = ["str", "1", "3", "5", "10", "all"];

/** Human-readable depth setting */
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

/** Lit LED segments for a depth: none for a string, all five for full depth */
export function getDepthSegments(depth: DepthSetting): boolean[] {
  const level = DEPTH_SETTINGS.indexOf(depth);
  return [1, 2, 3, 4, 5].map((n) => n <= level);
}
