import { SHARED_TOKENS } from "../shared-tokens";

/**
 * Compact JsonView styling for dependency components
 */
export const COMPACT_JSON_STYLE = {
  fontFamily: SHARED_TOKENS.fonts.mono,
  fontSize: "11px",
  backgroundColor: "transparent",
} as const;

/**
 * Component name extraction regex
 */
export const COMPONENT_NAME_REGEX = /\[([^\]]+)\]/;
