/**
 * useKeyboardSelection - Handle Cmd+A to select only container content
 *
 * Ported from debugsy's keyboard selection handling.
 * Prevents Cmd+A from selecting entire page, only selects container content.
 */

import { useEffect, type RefObject } from "react";

export interface KeyboardSelectionConfig {
  /** Ref to container element */
  containerRef: RefObject<HTMLElement | null>;
  /** Whether to enable keyboard selection (default: true) */
  enabled?: boolean;
}

/**
 * Hook for handling Cmd+A to select only container content
 *
 * @example
 * ```tsx
 * const containerRef = useRef<HTMLDivElement>(null);
 *
 * useKeyboardSelection({
 *   containerRef,
 *   enabled: true,
 * });
 *
 * <div ref={containerRef} tabIndex={0}>
 *   {content}
 * </div>
 * ```
 */
export function useKeyboardSelection(config: KeyboardSelectionConfig): void {
  const { containerRef, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        // Check if the focus is within our container
        const activeElement = document.activeElement;
        const isWithinContainer =
          containerRef.current?.contains(activeElement) ||
          containerRef.current === activeElement;

        if (isWithinContainer && containerRef.current) {
          event.preventDefault();
          event.stopPropagation();

          // Select the text content of the container
          const selection = window.getSelection();
          const range = document.createRange();
          range.selectNodeContents(containerRef.current);
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, [containerRef, enabled]);
}
