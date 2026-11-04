/**
 * Display Queue State System
 *
 * Multi-item queue management with:
 * - Semantic priority system (ERROR > ACTION > PROGRESS > LOG)
 * - Memorization/interruption (high-priority temporarily hides low-priority)
 * - History tracking (configurable limit, default 100)
 * - Auto-restoration (memorized items restore when interrupting items complete)
 */

import type { DisplayAlert } from "./display-alert";
import { DisplayPriority, sortByPriority, shouldMemorize } from "./display-priority";

/** Individual display item in the queue */
export interface DisplayQueueItem {
  // Identity
  id: string; // Unique identifier
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: number;

  // Priority & Ordering
  priority: DisplayPriority; // Semantic priority (ERROR = 0, ACTION = 1, PROGRESS = 2, LOG = 3)

  // Progress/Loading
  mode: "progress" | "loading";
  progress?: {
    value: number; // 0-100 (ignored if loading)
    color?: string;
    height?: number;
  };

  // Lifecycle
  phase: "active" | "complete"; // Current phase
  result?: "success" | "error"; // Completion result
  autohide: boolean; // Auto-hide after completion?
  duration?: number; // How long to show after completion (ms)
  persistent?: boolean; // Never auto-hide

  // Multi-step Operations
  isMultiStep?: boolean; // Part of multi-step flow?
  currentStep?: number; // Current step (1-based)
  totalSteps?: number; // Total steps in flow
  allowInterruption?: boolean; // Can be interrupted?

  // Processing Time
  showProcessingTime?: boolean; // Show elapsed time?
  processingStartTime?: number; // When operation started

  // Animation Control (per-item)
  animateProgress?: boolean; // Animate progress bar with pulse effect (default: false)

  // Alert (error with recovery) — see display-alert.ts
  alert?: DisplayAlert; // When set, Display renders alert mode and swaps its action slots

  // Memorization State
  memorized?: boolean; // Currently memorized (not visible but in memory)
  memorizedAt?: number; // When item was memorized

  // Internal Timer
  timerId?: NodeJS.Timeout; // Auto-hide timer ID
}

/** Queue state with memorization and history */
interface DisplayQueueState {
  // Active items (visible + memorized)
  items: Map<string, DisplayQueueItem>;

  // History (completed/dismissed items)
  history: DisplayQueueItem[];
  historyLimit: number; // Maximum history items (default: 100)

  // Display configuration
  maxSlots: number; // Maximum visible slots (default: 3)

  // Listeners
  listeners: Set<(visible: DisplayQueueItem[], memorized: DisplayQueueItem[]) => void>;
  historyListeners: Set<(history: DisplayQueueItem[]) => void>;

  // ID generation
  nextId: number;
}

// Global queue state
const queueState: DisplayQueueState = {
  items: new Map(),
  history: [],
  historyLimit: 100,
  maxSlots: 3,
  listeners: new Set(),
  historyListeners: new Set(),
  nextId: 1,
};

/**
 * Configure queue settings
 */
export function configureQueue(options: {
  maxSlots?: number;
  historyLimit?: number;
}): void {
  if (options.maxSlots !== undefined) {
    queueState.maxSlots = options.maxSlots;
  }
  if (options.historyLimit !== undefined) {
    queueState.historyLimit = options.historyLimit;
  }
  notifyListeners();
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `display-${queueState.nextId++}`;
}

/**
 * Get visible and memorized items based on priority and slot capacity
 */
function getVisibleAndMemorized(): {
  visible: DisplayQueueItem[];
  memorized: DisplayQueueItem[];
} {
  const allItems = Array.from(queueState.items.values());
  const sorted = sortByPriority(allItems);

  // Take top N slots for visible items
  const visible = sorted.slice(0, queueState.maxSlots);

  // Remaining items are memorized (if they qualify)
  const memorized = sorted.slice(queueState.maxSlots).filter((item) => {
    return shouldMemorize(item.priority, item.phase);
  });

  // Mark memorization state
  visible.forEach((item) => {
    item.memorized = false;
  });

  memorized.forEach((item) => {
    if (!item.memorized) {
      item.memorized = true;
      item.memorizedAt = Date.now();
    }
  });

  return { visible, memorized };
}

/**
 * Notify all listeners of queue change
 */
function notifyListeners(): void {
  const { visible, memorized } = getVisibleAndMemorized();
  queueState.listeners.forEach((listener) => listener(visible, memorized));
}

/**
 * Notify history listeners
 */
function notifyHistoryListeners(): void {
  queueState.historyListeners.forEach((listener) => listener([...queueState.history]));
}

/**
 * Move item to history
 */
function moveToHistory(item: DisplayQueueItem): void {
  // Add to history (most recent first)
  queueState.history.unshift(item);

  // Trim history to limit
  if (queueState.history.length > queueState.historyLimit) {
    queueState.history = queueState.history.slice(0, queueState.historyLimit);
  }

  notifyHistoryListeners();
}

/**
 * Start auto-hide timer for item
 */
function startAutoHideTimer(item: DisplayQueueItem): void {
  // Don't start timer if:
  // - Not auto-hide
  // - Persistent
  // - Still in active phase
  // - Memorized (wait until visible again)
  if (
    !item.autohide ||
    item.persistent ||
    item.phase === "active" ||
    item.memorized
  ) {
    return;
  }

  const duration = item.duration ?? 2000;

  item.timerId = setTimeout(() => {
    removeFromQueue(item.id);
  }, duration);

  // Update item in map
  queueState.items.set(item.id, item);
}

/**
 * Cancel auto-hide timer
 */
function cancelAutoHideTimer(item: DisplayQueueItem): void {
  if (item.timerId) {
    clearTimeout(item.timerId);
    item.timerId = undefined;
    queueState.items.set(item.id, item);
  }
}

/**
 * Add item to queue
 *
 * @param config - Item configuration (without id/timestamp/timerId)
 * @returns Item ID for future reference
 */
export function addToQueue(
  config: Omit<DisplayQueueItem, "id" | "timestamp" | "timerId" | "memorized" | "memorizedAt"> & { id?: string }
): string {
  const id = config.id ?? generateId();

  const item: DisplayQueueItem = {
    ...config,
    id,
    timestamp: Date.now(),
    memorized: false,
  };

  queueState.items.set(id, item);

  // Check if this item should get a slot (might interrupt lower priority)
  notifyListeners();

  // Start timer if complete
  if (item.phase === "complete") {
    startAutoHideTimer(item);
  }

  return id;
}

/**
 * Update existing queue item
 *
 * @param id - Item ID
 * @param updates - Partial updates to apply
 */
export function updateQueueItem(
  id: string,
  updates: Partial<DisplayQueueItem>
): void {
  const item = queueState.items.get(id);
  if (!item) return;

  // Cancel timer if updating
    cancelAutoHideTimer(item);

  // Apply updates
  const updatedItem: DisplayQueueItem = {
    ...item,
    ...updates,
    id, // Preserve ID
    timestamp: item.timestamp, // Preserve original timestamp
  };

  queueState.items.set(id, updatedItem);

  // Re-evaluate visibility (priority might have changed)
  notifyListeners();

  // Restart timer if now complete
  if (updatedItem.phase === "complete") {
    startAutoHideTimer(updatedItem);
  }
}

/**
 * Remove item from queue
 *
 * @param id - Item ID to remove
 */
export function removeFromQueue(id: string): void {
  const item = queueState.items.get(id);
  if (!item) return;

  // Cancel timer
  cancelAutoHideTimer(item);

  // Move to history
  moveToHistory(item);

  // Remove from active queue
  queueState.items.delete(id);

  // Notify (might restore memorized items)
  notifyListeners();
}

/**
 * Clear queue with optional filter
 *
 * @param filter - Optional filter function (returns true to clear)
 */
export function clearQueue(
  filter?: (item: DisplayQueueItem) => boolean
): void {
  const itemsToClear = filter
    ? Array.from(queueState.items.values()).filter(filter)
    : Array.from(queueState.items.values());

  itemsToClear.forEach((item) => {
    removeFromQueue(item.id);
  });
}

/**
 * Get all items (visible + memorized) sorted by priority
 */
export function getSortedQueue(): DisplayQueueItem[] {
  const items = Array.from(queueState.items.values());
  return sortByPriority(items);
}

/**
 * Get visible items only
 */
export function getVisibleItems(): DisplayQueueItem[] {
  return getVisibleAndMemorized().visible;
}

/**
 * Get memorized items only
 */
export function getMemorizedItems(): DisplayQueueItem[] {
  return getVisibleAndMemorized().memorized;
      }

/**
 * Get history (completed/dismissed items)
 */
export function getHistory(): DisplayQueueItem[] {
  return [...queueState.history];
}

/**
 * Clear history
 */
export function clearHistory(): void {
  queueState.history = [];
  notifyHistoryListeners();
}

/**
 * Subscribe to queue changes (visible + memorized)
 *
 * @param listener - Callback function receiving visible and memorized items
 * @returns Unsubscribe function
 */
export function subscribeToQueue(
  listener: (visible: DisplayQueueItem[], memorized: DisplayQueueItem[]) => void
): () => void {
  queueState.listeners.add(listener);

  // Immediately notify with current state
  const { visible, memorized } = getVisibleAndMemorized();
  listener(visible, memorized);

  // Return unsubscribe function
  return () => {
    queueState.listeners.delete(listener);
  };
}

/**
 * Subscribe to history changes
 *
 * @param listener - Callback function receiving history items
 * @returns Unsubscribe function
 */
export function subscribeToHistory(
  listener: (history: DisplayQueueItem[]) => void
): () => void {
  queueState.historyListeners.add(listener);

  // Immediately notify with current state
  listener([...queueState.history]);

  // Return unsubscribe function
  return () => {
    queueState.historyListeners.delete(listener);
  };
}

// Re-export DisplayPriority for convenience
export { DisplayPriority };
