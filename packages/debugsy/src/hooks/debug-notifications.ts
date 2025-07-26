import { useEffect, useReducer, useState } from "react";
import type { DebugDisplayContent, DebugDisplayState } from "./debug-constants";

// Subscribers for state changes
const subscribers = new Set<() => void>();

// Batch mechanism to prevent excessive updates while allowing necessary ones
let pendingNotification = false;
let lastNotificationTime = 0;
const THROTTLE_MS = 16; // ~60fps max update rate

// Re-entrancy guard to prevent infinite feedback loops
let isNotifying = false;

/**
 * Notify all subscribers of state changes
 * Use queueMicrotask for immediate but deferred execution with throttling
 * FIXED: Added re-entrancy guard to prevent infinite loops
 */
export function notifySubscribers(): void {
  // Prevent re-entrant calls that cause infinite loops
  if (isNotifying) {
    console.warn(
      "🔄 Blocked re-entrant notifySubscribers() call to prevent infinite loop"
    );
    return;
  }

  if (pendingNotification) return; // Already scheduled

  const now = Date.now();
  const timeSinceLastNotification = now - lastNotificationTime;

  if (timeSinceLastNotification < THROTTLE_MS) {
    // Throttle rapid updates - schedule for later
    pendingNotification = true;
    setTimeout(() => {
      pendingNotification = false;
      lastNotificationTime = Date.now();

      isNotifying = true;
      try {
        subscribers.forEach((callback) => {
          try {
            callback();
          } catch (error) {
            console.error("Debug subscriber error:", error);
          }
        });
      } finally {
        isNotifying = false;
      }
    }, THROTTLE_MS - timeSinceLastNotification);
    return;
  }

  pendingNotification = true;
  lastNotificationTime = now;

  // Use queueMicrotask for immediate execution after current call stack
  queueMicrotask(() => {
    pendingNotification = false;

    isNotifying = true;
    try {
      subscribers.forEach((callback) => {
        try {
          callback();
        } catch (error) {
          console.error("Debug subscriber error:", error);
        }
      });
    } finally {
      isNotifying = false;
    }
  });
}

/**
 * Subscribe to debug state changes
 */
export function subscribeToDebugChanges(callback: () => void): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Hook to subscribe to debug state changes
 * FIXED: Use useReducer instead of forceUpdate({}) to prevent infinite loops
 */
export function useDebugSubscription(): void {
  // Use useReducer for stable forceUpdate - no new objects created
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const unsubscribe = subscribeToDebugChanges(() => forceUpdate());
    return unsubscribe;
  }, []);
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

/**
 * Debug performance timing utilities
 */
export class DebugTimer {
  private static timers = new Map<string, number>();

  static start(key: string): void {
    DebugTimer.timers.set(key, Date.now());
  }

  static end(key: string): number | null {
    const startTime = DebugTimer.timers.get(key);
    if (startTime === undefined) return null;

    const duration = Date.now() - startTime;
    DebugTimer.timers.delete(key);
    return duration;
  }

  static endAndLog(key: string, label?: string): number | null {
    const duration = DebugTimer.end(key);
    if (duration !== null) {
      console.log(`⏱️ ${label || key}: ${duration}ms`);
    }
    return duration;
  }

  static clear(): void {
    DebugTimer.timers.clear();
  }
}

/**
 * Utility to batch multiple debug operations
 */
export class DebugBatch {
  private operations: (() => void)[] = [];
  private scheduled = false;

  add(operation: () => void): void {
    this.operations.push(operation);
    if (!this.scheduled) {
      this.scheduled = true;
      queueMicrotask(() => {
        this.flush();
      });
    }
  }

  flush(): void {
    const ops = [...this.operations];
    this.operations = [];
    this.scheduled = false;

    ops.forEach((op) => {
      try {
        op();
      } catch (error) {
        console.error("Debug batch operation error:", error);
      }
    });

    // Notify once after all operations
    notifySubscribers();
  }
}

// Global debug batch instance
export const debugBatch = new DebugBatch();

/**
 * Rate limiter for debug operations
 */
export class DebugRateLimiter {
  private lastCall = 0;
  private readonly interval: number;

  constructor(intervalMs: number = 100) {
    this.interval = intervalMs;
  }

  canExecute(): boolean {
    const now = Date.now();
    if (now - this.lastCall >= this.interval) {
      this.lastCall = now;
      return true;
    }
    return false;
  }

  execute(operation: () => void): boolean {
    if (this.canExecute()) {
      operation();
      return true;
    }
    return false;
  }
}
