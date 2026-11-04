/**
 * useHoverMessage - Display messages on hover
 * 
 * Ported from debugsy's hover message system.
 * Shows descriptive messages in a display system when hovering over interactive elements.
 */

import { useCallback } from "react";

export interface HoverMessageConfig {
  /** Function to set display message */
  setMessage: (message: string, type?: "info" | "success" | "error") => void;
  /** Function to clear display message */
  clearMessage: () => void;
}

export interface HoverMessageHandlers {
  /** Mouse enter handler */
  onMouseEnter: (message: string, type?: "info" | "success" | "error") => void;
  /** Mouse leave handler */
  onMouseLeave: () => void;
  /** Get handlers object for spreading onto elements */
  getHandlers: (
    message: string,
    type?: "info" | "success" | "error"
  ) => {
    onMouseEnter: () => void;
    onMouseLeave: () => void;
  };
}

/**
 * Hook for managing hover message display
 * 
 * @example
 * ```tsx
 * const hover = useHoverMessage({
 *   setMessage: (msg, type) => setDisplayContent({ message: msg, type }),
 *   clearMessage: () => clearDisplayContent(),
 * });
 * 
 * <button {...hover.getHandlers('Click to copy logs', 'info')}>
 *   Copy
 * </button>
 * ```
 */
export function useHoverMessage(
  config: HoverMessageConfig
): HoverMessageHandlers {
  const { setMessage, clearMessage } = config;

  const onMouseEnter = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => {
      setMessage(message, type);
    },
    [setMessage]
  );

  const onMouseLeave = useCallback(() => {
    clearMessage();
  }, [clearMessage]);

  const getHandlers = useCallback(
    (message: string, type: "info" | "success" | "error" = "info") => ({
      onMouseEnter: () => onMouseEnter(message, type),
      onMouseLeave: onMouseLeave,
    }),
    [onMouseEnter, onMouseLeave]
  );

  return {
    onMouseEnter,
    onMouseLeave,
    getHandlers,
  };
}

