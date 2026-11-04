/**
 * usePauseState - State preservation when pausing live updates
 * 
 * Ported from debugsy's pause state management.
 * Preserves exact state at pause moment for review.
 */

import { useCallback, useState } from "react";

export interface PauseStateConfig {
  /** Callback when pause state changes */
  onPauseChange?: (isPaused: boolean) => void;
  /** Callback when paused items are captured */
  onPausedCapture?: (itemCount: number) => void;
}

export interface PauseState<T> {
  /** Whether currently paused */
  isPaused: boolean;
  /** Items captured at pause moment */
  pausedItems: T[];
  /** Pause - capture current items state */
  pause: (currentItems: T[]) => void;
  /** Resume - clear paused items */
  resume: () => void;
  /** Toggle pause state */
  toggle: (currentItems: T[]) => void;
}

/**
 * Hook for managing pause state with item preservation
 * 
 * @example
 * ```tsx
 * const {
 *   isPaused,
 *   pausedItems,
 *   pause,
 *   resume,
 *   toggle
 * } = usePauseState<LogEntry>({
 *   onPauseChange: (paused) => console.log('Paused:', paused),
 * });
 * 
 * const activeItems = isPaused ? pausedItems : liveItems;
 * ```
 */
export function usePauseState<T>(
  config: PauseStateConfig = {}
): PauseState<T> {
  const { onPauseChange, onPausedCapture } = config;

  const [isPaused, setIsPaused] = useState(false);
  const [pausedItems, setPausedItems] = useState<T[]>([]);

  const pause = useCallback(
    (currentItems: T[]) => {
      setIsPaused(true);
      setPausedItems([...currentItems]);
      onPauseChange?.(true);
      onPausedCapture?.(currentItems.length);
    },
    [onPauseChange, onPausedCapture]
  );

  const resume = useCallback(() => {
    setIsPaused(false);
    setPausedItems([]);
    onPauseChange?.(false);
  }, [onPauseChange]);

  const toggle = useCallback(
    (currentItems: T[]) => {
      if (isPaused) {
        resume();
      } else {
        pause(currentItems);
      }
    },
    [isPaused, pause, resume]
  );

  return {
    isPaused,
    pausedItems,
    pause,
    resume,
    toggle,
  };
}

