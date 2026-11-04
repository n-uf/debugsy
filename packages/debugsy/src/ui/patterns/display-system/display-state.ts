/**
 * Display State System
 *
 * Global state management for display content (tooltips, notifications, feedback)
 * Used for hover feedback and action results
 */

export interface DisplayProgress {
  /** Current progress value (0-100) - ignored if loading is true */
  value: number;
  /** Progress bar color (defaults to type color) */
  color?: string;
  /** Progress bar height in pixels (defaults to 2px) */
  height?: number;
  /** Loading mode - shows indeterminate animated progress when true */
  loading?: boolean;
}

export interface DisplayContent {
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: number;
  duration?: number; // 0 = manual clear, undefined = no auto-clear
  /** Optional progress bar visualization */
  progress?: DisplayProgress;
}

let currentDisplay: DisplayContent | null = null;
const listeners: Set<(content: DisplayContent | null) => void> = new Set();
let clearTimeoutId: NodeJS.Timeout | undefined;

/**
 * Set display content with auto-clear support
 */
export const setDisplayContent = (
  content: Omit<DisplayContent, "timestamp">
): void => {
  // Clear existing timeout
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
    clearTimeoutId = undefined;
  }

  // Set new content
  currentDisplay = {
    ...content,
    timestamp: Date.now(),
  };

  // Notify all listeners
  listeners.forEach((listener) => listener(currentDisplay));

  // Auto-clear if duration specified and > 0
  if (content.duration !== undefined && content.duration > 0) {
    clearTimeoutId = setTimeout(() => {
      clearDisplayContent();
    }, content.duration);
  }
};

/**
 * Clear display content
 */
export const clearDisplayContent = (): void => {
  if (clearTimeoutId) {
    clearTimeout(clearTimeoutId);
    clearTimeoutId = undefined;
  }

  currentDisplay = null;
  listeners.forEach((listener) => listener(null));
};

/**
 * Subscribe to display content changes
 * Returns unsubscribe function
 */
export const subscribeToDisplay = (
  listener: (content: DisplayContent | null) => void
): (() => void) => {
  listeners.add(listener);

  // Send current state immediately
  listener(currentDisplay);

  // Return unsubscribe function
  return () => {
    listeners.delete(listener);
  };
};

/**
 * Get current display content (synchronous)
 */
export const getCurrentDisplay = (): DisplayContent | null => {
  return currentDisplay;
};

/**
 * Helper: Show loading message with indeterminate progress
 */
export const setLoadingDisplay = (
  message: string,
  options?: {
    type?: "success" | "error" | "warning" | "info";
    color?: string;
    height?: number;
  }
): void => {
  setDisplayContent({
    message,
    type: options?.type ?? "info",
    duration: 0, // Manual clear for loading states
    progress: {
      value: 0,
      loading: true,
      color: options?.color,
      height: options?.height ?? 2,
    },
  });
};

/**
 * Helper: Show progress message with determinate progress bar
 */
export const setProgressDisplay = (
  message: string,
  progressValue: number,
  options?: {
    type?: "success" | "error" | "warning" | "info";
    color?: string;
    height?: number;
    duration?: number;
  }
): void => {
  setDisplayContent({
    message,
    type: options?.type ?? "info",
    duration: options?.duration ?? 0,
    progress: {
      value: progressValue,
      loading: false,
      color: options?.color,
      height: options?.height ?? 2,
    },
  });
};
