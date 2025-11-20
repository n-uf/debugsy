import { useCallback, useEffect, useRef, useState } from "react";

export interface DisplayContentParams {
  message: string;
  type: "success" | "error" | "warning" | "info";
  duration?: number;
}

export interface UseClearConfig<T> {
  /**
   * Whether the system is paused
   */
  isPaused: boolean;
  /**
   * Whether following live updates
   */
  isFollowing: boolean;
  /**
   * Callback to clear storage/logs
   */
  onClearStorage: () => void;
  /**
   * Callback to resume following
   */
  onResume: () => void;
  /**
   * Optional callback to clear local state
   */
  onClearLocalState?: () => void;
  /**
   * Display content function (scoped or global)
   */
  setDisplayContent: (content: DisplayContentParams) => void;
}

export interface UseClearReturn {
  /**
   * Handler for clear action
   */
  handleClear: () => void;
  /**
   * Whether in confirmation state
   */
  clearConfirmation: boolean;
}

/**
 * useClear - Clear logic with double-action confirmation
 *
 * Implements two-step clear process:
 * 1. First action: Clear storage, keep local state (when paused/snapshot)
 * 2. Second action: Clear local state and resume following
 *
 * When following live logs, clears immediately without confirmation.
 *
 * @example
 * ```tsx
 * const { handleClear, clearConfirmation } = useClear({
 *   isPaused: pauseState.isPaused,
 *   isFollowing: scrollFollowing.isFollowing,
 *   onClearStorage: debug.clearLogs,
 *   onResume: () => {
 *     pauseState.resume();
 *     scrollFollowing.returnToFollowing();
 *   },
 * });
 * ```
 */
export function useClear<T>(config: UseClearConfig<T>): UseClearReturn {
  const { isPaused, isFollowing, onClearStorage, onResume, onClearLocalState, setDisplayContent } =
    config;

  const [clearConfirmation, setClearConfirmation] = useState(false);
  const clearConfirmationTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  const handleClear = useCallback(() => {
    // If following live logs, clear immediately
    if (isFollowing && !isPaused) {
      onClearStorage();
      setDisplayContent({
        message: "Logs cleared",
        type: "success",
        duration: 1500,
      });
      return;
    }

    // If paused or scrolled (not following), use two-step process
    if (!clearConfirmation) {
      // First action: Clear storage immediately but keep local state
      onClearStorage();
      setClearConfirmation(true);

      setDisplayContent({
        message:
          "Logs cleared. Press again to clear snapshot and resume following.",
        type: "info",
        duration: 3000,
      });

      // Clear any existing timeout
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }

      // Auto-reset confirmation after 3 seconds
      clearConfirmationTimeoutRef.current = setTimeout(() => {
        setClearConfirmation(false);
      }, 3000);
    } else {
      // Second action: Clear local state and resume following
      setClearConfirmation(false);

      // Clear the confirmation timeout
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }

      // Resume following
      onResume();

      // Clear local state if callback provided
      if (onClearLocalState) {
        onClearLocalState();
      }

      setDisplayContent({
        message: "Snapshot cleared, now following live logs",
        type: "success",
        duration: 2000,
      });
    }
  }, [
    isPaused,
    isFollowing,
    clearConfirmation,
    onClearStorage,
    onResume,
    onClearLocalState,
    setDisplayContent,
  ]);

  // Cleanup confirmation timeout
  useEffect(() => {
    return () => {
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }
    };
  }, []);

  return {
    handleClear,
    clearConfirmation,
  };
}
