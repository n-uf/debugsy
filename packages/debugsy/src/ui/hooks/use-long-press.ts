"use client";

import { useCallback, useRef } from "react";

export interface UseLongPressOptions {
  /**
   * Duration in milliseconds to trigger long press (default: 500ms)
   */
  threshold?: number;
  /**
   * Callback when long press is triggered
   */
  onLongPress: () => void;
  /**
   * Callback when press starts (optional)
   */
  onStart?: () => void;
  /**
   * Callback when press is cancelled (short press/click)
   */
  onCancel?: () => void;
}

/**
 * Hook for detecting long press gestures
 *
 * Returns event handlers to attach to an element.
 * Distinguishes between short clicks and long presses.
 *
 * @example
 * ```tsx
 * const longPressAttrs = useLongPress({
 *   threshold: 500,
 *   onLongPress: () => console.log("Long pressed!"),
 *   onCancel: () => console.log("Short clicked!"),
 * });
 *
 * <div {...longPressAttrs}>Press and hold me</div>
 * ```
 */
export const useLongPress = ({
  threshold = 500,
  onLongPress,
  onStart,
  onCancel,
}: UseLongPressOptions) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  const start = useCallback(() => {
    isLongPressRef.current = false;
    onStart?.();

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onLongPress();
    }, threshold);
  }, [onLongPress, onStart, threshold]);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // If it wasn't a long press, it's a short click
    if (!isLongPressRef.current) {
      onCancel?.();
    }

    isLongPressRef.current = false;
  }, [onCancel]);

  const handleMouseDown = useCallback(() => {
    start();
  }, [start]);

  const handleMouseUp = useCallback(() => {
    cancel();
  }, [cancel]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    isLongPressRef.current = false;
  }, []);

  const handleTouchStart = useCallback(() => {
    start();
  }, [start]);

  const handleTouchEnd = useCallback(() => {
    cancel();
  }, [cancel]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
};
