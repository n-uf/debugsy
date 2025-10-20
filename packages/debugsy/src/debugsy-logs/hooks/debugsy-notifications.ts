import { useEffect, useReducer } from "react";

// Subscribers for state changes
const subscribers = new Set<() => void>();

// Batch mechanism to prevent excessive updates while allowing necessary ones
let pendingNotification = false;
let lastNotificationTime = 0;
const THROTTLE_MS = 16; // ~60fps max update rate

// Re-entrancy guard to prevent infinite feedback loops
let isNotifying = false;

// React render phase detection to prevent state updates during render
let inRenderPhase = false;
let renderPhaseDepth = 0;

/**
 * Mark that we're entering a React render phase
 * This prevents state updates during render which would cause infinite loops
 */
export function enterRenderPhase(): void {
  renderPhaseDepth++;
  inRenderPhase = true;
}

/**
 * Mark that we're exiting a React render phase
 */
export function exitRenderPhase(): void {
  renderPhaseDepth = Math.max(0, renderPhaseDepth - 1);
  if (renderPhaseDepth === 0) {
    inRenderPhase = false;
  }
}

/**
 * Notify all subscribers of state changes
 * Use queueMicrotask for immediate but deferred execution with throttling
 * FIXED: Added re-entrancy guard to prevent infinite loops
 * FIXED: Added React render phase detection to prevent state updates during render
 */
export function notifySubscribers(): void {
  // Prevent re-entrant calls that cause infinite loops
  if (isNotifying) {
    return; // Silent return, no warning needed
  }

  // CRITICAL FIX: Do NOT notify during React render phase
  // This prevents infinite loops from useWhyDidYouUpdate/useRenderTracker
  if (inRenderPhase) {
    return; // Silent return - this is expected behavior
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
export function useDebugsySubscription(): void {
  // Use useReducer for stable forceUpdate - no new objects created
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  useEffect(() => {
    const unsubscribe = subscribeToDebugChanges(() => forceUpdate());
    return unsubscribe;
  }, []);
}

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
