"use client";

/**
 * Display Queue Helpers (Context-Aware)
 *
 * High-level API for display queue operations using React Context with semantic priorities.
 * These helpers must be used within a DisplayQueueProvider.
 *
 * Priority Levels:
 * - ERROR (0): Critical errors, highest priority
 * - ACTION (1): User action feedback, high priority
 * - PROGRESS (2): Progress/loading states, medium priority
 * - LOG (3): Log entries, lowest priority
 */

import { useCallback } from "react";
import { useDisplayQueueContext } from "./display-queue-context";
import { DisplayPriority } from "./display-priority";

/**
 * useDisplayQueueHelpers - Context-aware display queue helpers
 *
 * Provides semantic operations that work with the scoped display queue.
 * Must be used within a DisplayQueueProvider.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showError, showAction, startLoading } = useDisplayQueueHelpers();
 *
 *   const handleError = () => {
 *     showError("Something failed!", { persistent: true });
 *   };
 *
 *   const handleClick = () => {
 *     showAction("Button clicked!");
 *   };
 *
 *   const handleUpload = async () => {
 *     const id = startLoading("Uploading...");
 *     await upload();
 *     completeLoading(id, "Upload complete!");
 *   };
 * }
 * ```
 */
export const useDisplayQueueHelpers = () => {
  const { addToQueue, updateQueueItem } = useDisplayQueueContext();

  // =============================================================================
  // ERROR Priority Helpers (Priority 0 - Highest)
  // =============================================================================

  const showError = useCallback(
    (
      message: string,
      options?: {
        persistent?: boolean;
        duration?: number;
      }
    ): string => {
      return addToQueue({
        message,
        type: "error",
        priority: DisplayPriority.ERROR,
        mode: "progress",
        progress: {
          value: 0,
        },
        phase: "complete",
        result: "error",
        autohide: !options?.persistent,
        duration: options?.duration ?? 5000,
        persistent: options?.persistent ?? false,
      });
    },
    [addToQueue]
  );

  // =============================================================================
  // ACTION Priority Helpers (Priority 1 - High)
  // =============================================================================

  const showAction = useCallback(
    (
      message: string,
      options?: {
        type?: "success" | "info" | "warning";
        duration?: number;
      }
    ): string => {
      return addToQueue({
        message,
        type: options?.type ?? "info",
        priority: DisplayPriority.ACTION,
        mode: "progress",
        progress: {
          value: 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 1500,
      });
    },
    [addToQueue]
  );

  // =============================================================================
  // PROGRESS Priority Helpers (Priority 2 - Medium)
  // =============================================================================

  const startLoading = useCallback(
    (
      message: string,
      options?: {
        showProcessingTime?: boolean;
        type?: "success" | "error" | "warning" | "info";
        animateProgress?: boolean;
      }
    ): string => {
      return addToQueue({
        message,
        type: options?.type ?? "info",
        priority: DisplayPriority.PROGRESS,
        mode: "loading",
        progress: {
          value: 0,
        },
        phase: "active",
        autohide: false,
        showProcessingTime: options?.showProcessingTime ?? false,
        processingStartTime: Date.now(),
        animateProgress: options?.animateProgress ?? false,
      });
    },
    [addToQueue]
  );

  const completeLoading = useCallback(
    (
      id: string,
      message: string,
      options?: {
        duration?: number;
        progressValue?: number;
      }
    ): void => {
      updateQueueItem(id, {
        message,
        type: "success",
        mode: "progress",
        progress: {
          value: options?.progressValue ?? 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 2000,
      });
    },
    [updateQueueItem]
  );

  const failLoading = useCallback(
    (
      id: string,
      message: string,
      options?: {
        duration?: number;
        persistent?: boolean;
      }
    ): void => {
      updateQueueItem(id, {
        message,
        type: "error",
        mode: "progress",
        progress: {
          value: 0,
        },
        phase: "complete",
        result: "error",
        autohide: !options?.persistent,
        duration: options?.duration ?? 5000,
        persistent: options?.persistent ?? false,
      });
    },
    [updateQueueItem]
  );

  const startMultiStep = useCallback(
    (
      message: string,
      currentStep: number,
      totalSteps: number,
      options?: {
        type?: "success" | "error" | "warning" | "info";
        allowInterruption?: boolean;
        animateProgress?: boolean;
      }
    ): string => {
      return addToQueue({
        message,
        type: options?.type ?? "info",
        priority: DisplayPriority.PROGRESS,
        mode: "loading",
        progress: {
          value: (currentStep / totalSteps) * 100,
        },
        phase: "active",
        autohide: false,
        isMultiStep: true,
        currentStep,
        totalSteps,
        allowInterruption: options?.allowInterruption ?? false,
        animateProgress: options?.animateProgress ?? false,
      });
    },
    [addToQueue]
  );

  const completeMultiStep = useCallback(
    (
      id: string,
      message: string,
      currentStep: number,
      totalSteps: number,
      options?: {
        duration?: number;
      }
    ): void => {
      updateQueueItem(id, {
        message,
        type: "success",
        mode: "progress",
        progress: {
          value: (currentStep / totalSteps) * 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 2000,
        currentStep,
        totalSteps,
      });
    },
    [updateQueueItem]
  );

  // =============================================================================
  // LOG Priority Helpers (Priority 3 - Lowest)
  // =============================================================================

  const addLogEntry = useCallback(
    (
      message: string,
      options?: {
        type?: "success" | "info" | "warning" | "error";
        duration?: number;
      }
    ): string => {
      return addToQueue({
        message,
        type: options?.type ?? "info",
        priority: DisplayPriority.LOG,
        mode: "progress",
        progress: {
          value: 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 3000,
      });
    },
    [addToQueue]
  );

  // =============================================================================
  // Legacy Compatibility (Deprecated)
  // =============================================================================

  const showSuccess = useCallback(
    (
      message: string,
      options?: {
        duration?: number;
        priority?: DisplayPriority;
      }
    ): string => {
      const priority = options?.priority ?? DisplayPriority.ACTION;

      return addToQueue({
        message,
        type: "success",
        priority,
        mode: "progress",
        progress: {
          value: 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 2000,
      });
    },
    [addToQueue]
  );

  const showWarning = useCallback(
    (
      message: string,
      options?: {
        duration?: number;
        priority?: DisplayPriority;
      }
    ): string => {
      const priority = options?.priority ?? DisplayPriority.ACTION;

      return addToQueue({
        message,
        type: "warning",
        priority,
        mode: "progress",
        progress: {
          value: 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 3000,
      });
    },
    [addToQueue]
  );

  const showInfo = useCallback(
    (
      message: string,
      options?: {
        duration?: number;
        priority?: DisplayPriority;
      }
    ): string => {
      const priority = options?.priority ?? DisplayPriority.LOG;

      return addToQueue({
        message,
        type: "info",
        priority,
        mode: "progress",
        progress: {
          value: 100,
        },
        phase: "complete",
        result: "success",
        autohide: true,
        duration: options?.duration ?? 2000,
      });
    },
    [addToQueue]
  );

  return {
    // Semantic helpers (RECOMMENDED)
    showError,
    showAction,
    startLoading,
    completeLoading,
    failLoading,
    startMultiStep,
    completeMultiStep,
    addLogEntry,

    // Legacy compatibility (DEPRECATED)
    showSuccess,
    showWarning,
    showInfo,
  };
};
