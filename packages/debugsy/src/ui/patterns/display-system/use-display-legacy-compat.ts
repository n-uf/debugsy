/**
 * Legacy Display Compatibility Hook
 *
 * Provides legacy setDisplayContent API that uses the context-based queue under the hood.
 * This allows existing code to work without modification while using isolated queues.
 */

import { useCallback } from "react";
import { useDisplayQueueContext } from "./display-queue-context";
import { DisplayPriority } from "./display-priority";
import type { DisplayContent } from "./display-state";

/**
 * useLegacyDisplayCompat - Legacy setDisplayContent that uses scoped queue
 *
 * Drop-in replacement for global setDisplayContent that uses the scoped queue.
 * Must be used within a DisplayQueueProvider.
 *
 * @example
 * ```tsx
 * const { setDisplayContent, clearDisplayContent } = useLegacyDisplayCompat();
 *
 * setDisplayContent({
 *   message: "Action complete!",
 *   type: "success",
 *   duration: 2000,
 * });
 * ```
 */
export const useLegacyDisplayCompat = () => {
  const { addToQueue, clearQueue } = useDisplayQueueContext();

  const setDisplayContent = useCallback(
    (content: Omit<DisplayContent, "timestamp">): void => {
      // Convert legacy DisplayContent to queue item
      const hasProgress = content.progress !== undefined;
      const isLoading = hasProgress && content.progress?.loading === true;

      addToQueue({
        message: content.message,
        type: content.type,
        priority: DisplayPriority.ACTION, // Legacy content uses ACTION priority
        mode: hasProgress ? (isLoading ? "loading" : "progress") : "progress",
        progress: content.progress
          ? {
              value: content.progress.value,
              color: content.progress.color,
              height: content.progress.height,
            }
          : undefined,
        phase: "complete", // Legacy content is always complete phase
        result: content.type === "error" ? "error" : "success",
        autohide: content.duration !== undefined && content.duration !== 0,
        duration: content.duration,
        persistent: content.duration === 0,
      });
    },
    [addToQueue]
  );

  const clearDisplayContent = useCallback((): void => {
    clearQueue(); // Clear all items
  }, [clearQueue]);

  return {
    setDisplayContent,
    clearDisplayContent,
  };
};

