/**
 * useCopyState - 3-state copy indicator state machine
 * 
 * Ported from debugsy's copy state management.
 * Manages idle → copying → copied states with auto-reset.
 */

import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = 0 | 1 | 2;

export interface CopyStateConfig {
  /** Auto-reset after delay (ms), 0 to disable (default: 3000) */
  autoResetDelay?: number;
  /** Callback when state changes */
  onStateChange?: (state: CopyState) => void;
}

export interface CopyStateReturn {
  /** Current copy state (0: idle, 1: copying, 2: copied) */
  state: CopyState;
  /** Set copy state */
  setState: (state: CopyState) => void;
  /** Advance to next state (cycles 0 → 1 → 2 → 0) */
  next: () => void;
  /** Reset to idle (0) */
  reset: () => void;
  /** Get icon for current state */
  getIcon: () => string;
  /** Get variant for current state */
  getVariant: () => "default" | "success" | "copying";
  /** Get color for current state (gray → blue → green) */
  getColor: () => string;
}

/**
 * Hook for managing 3-state copy indicator
 * 
 * @example
 * ```tsx
 * const copy = useCopyState({
 *   autoResetDelay: 3000,
 *   onStateChange: (state) => console.log('Copy state:', state),
 * });
 * 
 * <button onClick={copy.next}>
 *   {copy.getIcon()} {['Copy', 'Copying...', 'Copied!'][copy.state]}
 * </button>
 * ```
 */
export function useCopyState(
  config: CopyStateConfig = {}
): CopyStateReturn {
  const { autoResetDelay = 3000, onStateChange } = config;

  const [state, setState] = useState<CopyState>(0);
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-reset after delay
  useEffect(() => {
    if (state !== 0 && autoResetDelay > 0) {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout
      timeoutRef.current = setTimeout(() => {
        setState(0);
        onStateChange?.(0);
      }, autoResetDelay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, autoResetDelay, onStateChange]);

  const next = useCallback(() => {
    const nextState = ((state + 1) % 3) as CopyState;
    setState(nextState);
    onStateChange?.(nextState);
  }, [state, onStateChange]);

  const reset = useCallback(() => {
    setState(0);
    onStateChange?.(0);
  }, [onStateChange]);

  const getIcon = useCallback((): string => {
    return ["📋", "⏳", "✅"][state] ?? "📋";
  }, [state]);

  const getVariant = useCallback((): "default" | "success" | "copying" => {
    return ["default", "copying", "success"][state] as
      | "default"
      | "success"
      | "copying";
  }, [state]);

  const getColor = useCallback((): string => {
    // Color progression: idle (gray) → copying (blue) → copied (green)
    return ["#6b7280", "#3b82f6", "#10b981"][state] ?? "#6b7280";
  }, [state]);

  return {
    state,
    setState,
    next,
    reset,
    getIcon,
    getVariant,
    getColor,
  };
}

