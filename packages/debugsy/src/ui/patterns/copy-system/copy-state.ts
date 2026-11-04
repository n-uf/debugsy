/**
 * Copy State System
 * 
 * Multi-state copy progression: idle → partial → complete
 * Visual feedback with icons and progress bars
 */

export type CopyState = 0 | 1 | 2;

/**
 * Get icon for copy state
 */
export const getCopyIcon = (state: CopyState): string => {
  switch (state) {
    case 0:
      return "📋"; // Idle - clipboard
    case 1:
      return "📄"; // Partial - document
    case 2:
      return "✅"; // Complete - checkmark
  }
};

/**
 * Get progress bar width for copy state
 */
export const getProgressWidth = (state: CopyState): string => {
  switch (state) {
    case 0:
      return "0%";
    case 1:
      return "50%";
    case 2:
      return "100%";
  }
};

/**
 * Get progress bar color for copy state
 */
export const getProgressColor = (state: CopyState): string => {
  switch (state) {
    case 0:
      return "#6b7280"; // Gray - idle
    case 1:
      return "#3b82f6"; // Blue - in progress
    case 2:
      return "#10b981"; // Green - complete
  }
};

/**
 * Get next copy state
 */
export const getNextCopyState = (current: CopyState): CopyState => {
  if (current === 0) return 1; // idle → partial
  if (current === 1) return 2; // partial → complete
  return 0; // complete → reset
};

/**
 * Configuration for copy operations
 */
export interface CopyConfig {
  partialCount: number; // Number of items for partial copy
  autoResetDelay: number; // Auto-reset delay in ms (0 = no auto-reset)
}

export const DEFAULT_COPY_CONFIG: CopyConfig = {
  partialCount: 50,
  autoResetDelay: 5000, // 5 seconds
};

/**
 * Get logs to copy based on state
 */
export const getLogsToCopy = <T>(
  allLogs: T[],
  state: CopyState,
  config: CopyConfig = DEFAULT_COPY_CONFIG
): {
  logs: T[];
  nextState: CopyState;
  message: string;
} => {
  if (state === 0) {
    // First click: copy partial (newest N logs)
    const logs = allLogs.slice(0, config.partialCount);
    return {
      logs,
      nextState: 1,
      message: `Copied ${logs.length} newest logs • Click again for all`,
    };
  } else if (state === 1) {
    // Second click: copy all logs
    return {
      logs: allLogs,
      nextState: 2,
      message: `Copied all ${allLogs.length} logs to clipboard`,
    };
  } else {
    // Reset (shouldn't normally happen, but handle gracefully)
    return {
      logs: [],
      nextState: 0,
      message: "Ready to copy logs",
    };
  }
};

/**
 * Get hover message based on copy state
 */
export const getCopyHoverMessage = (
  state: CopyState,
  logCount: number,
  config: CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  if (state === 0) {
    const count = Math.min(logCount, config.partialCount);
    return `Copy ${count} newest logs to clipboard`;
  } else if (state === 1) {
    return `Click again to copy all ${logCount} logs`;
  } else {
    return "Copy complete • Click to reset";
  }
};

