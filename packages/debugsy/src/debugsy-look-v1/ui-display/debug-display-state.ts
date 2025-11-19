/**
 * Debug Display State Management
 *
 * Contains all display-related types and state management for debug UI feedback.
 * Extracted from debugsy-constants.ts and debug-notifications.ts for better organization.
 */

import { useEffect, useState } from "react";

// Debug display content types
export interface DebugDisplayContent {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number; // Auto-clear after duration (ms), 0 for manual clear
  timestamp: number;
}

export interface DebugDisplayState {
  content: DebugDisplayContent | null;
}

// Global display state for debug UI feedback
let debugDisplayState: DebugDisplayState = {
  content: null,
};

// Display listeners
let displayListeners: Set<() => void> = new Set();

/**
 * Set debug display content for UI feedback
 */
export const setDebugDisplayContent = (
  content: Omit<DebugDisplayContent, "timestamp"> | null
) => {
  if (content) {
    debugDisplayState.content = {
      ...content,
      timestamp: Date.now(),
    };

    // Auto-clear if duration is specified
    if (content.duration && content.duration > 0) {
      setTimeout(() => {
        clearDebugDisplayContent();
      }, content.duration);
    }
  } else {
    debugDisplayState.content = null;
  }

  // Notify all listeners
  displayListeners.forEach((listener) => listener());
};

/**
 * Clear debug display content
 */
export const clearDebugDisplayContent = () => {
  debugDisplayState.content = null;
  displayListeners.forEach((listener) => listener());
};

/**
 * Hook to manage debug display content
 */
export const useDebugDisplayContent = () => {
  const [content, setContent] = useState<DebugDisplayContent | null>(
    debugDisplayState.content
  );

  useEffect(() => {
    const listener = () => {
      setContent(debugDisplayState.content);
    };

    displayListeners.add(listener);
    return () => {
      displayListeners.delete(listener);
    };
  }, []);

  return {
    content,
    setContent: setDebugDisplayContent,
    clearContent: clearDebugDisplayContent,
  };
};
