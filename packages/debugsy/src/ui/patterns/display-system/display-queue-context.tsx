/**
 * Display Queue Context
 *
 * Provides isolated display queue instances per component tree with:
 * - Semantic priority system
 * - Memorization/interruption
 * - History tracking
 */

"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  type ReactNode,
} from "react";
import {
  sortByPriority,
  shouldMemorize,
} from "./display-priority";
import type { DisplayQueueItem } from "./display-queue-state";

/** Queue state for a single context instance */
interface QueueState {
  items: Map<string, DisplayQueueItem>;
  history: DisplayQueueItem[];
  historyLimit: number;
  maxSlots: number;
  listeners: Set<(visible: DisplayQueueItem[], memorized: DisplayQueueItem[]) => void>;
  historyListeners: Set<(history: DisplayQueueItem[]) => void>;
  nextId: number;
}

/** Context value with queue operations */
interface DisplayQueueContextValue {
  // Queue operations
  addToQueue: (
    config: Omit<DisplayQueueItem, "id" | "timestamp" | "timerId" | "memorized" | "memorizedAt">
  ) => string;
  updateQueueItem: (id: string, updates: Partial<DisplayQueueItem>) => void;
  removeFromQueue: (id: string) => void;
  clearQueue: (filter?: (item: DisplayQueueItem) => boolean) => void;
  
  // Configuration
  configureQueue: (options: { maxSlots?: number; historyLimit?: number }) => void;
  
  // Getters
  getSortedQueue: () => DisplayQueueItem[];
  getVisibleItems: () => DisplayQueueItem[];
  getMemorizedItems: () => DisplayQueueItem[];
  getHistory: () => DisplayQueueItem[];
  
  // Subscriptions
  subscribeToQueue: (
    listener: (visible: DisplayQueueItem[], memorized: DisplayQueueItem[]) => void
  ) => () => void;
  subscribeToHistory: (listener: (history: DisplayQueueItem[]) => void) => () => void;
  
  // History management
  clearHistory: () => void;
}

const DisplayQueueContext = createContext<DisplayQueueContextValue | null>(null);

/**
 * DisplayQueueProvider - Provides isolated display queue with memorization
 */
export const DisplayQueueProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const queueStateRef = useRef<QueueState>({
    items: new Map(),
    history: [],
    historyLimit: 100,
    maxSlots: 3,
    listeners: new Set(),
    historyListeners: new Set(),
    nextId: 1,
  });

  // Get visible and memorized items based on priority and slot capacity
  const getVisibleAndMemorized = useCallback((): {
    visible: DisplayQueueItem[];
    memorized: DisplayQueueItem[];
  } => {
    const allItems = Array.from(queueStateRef.current.items.values());
    const sorted = sortByPriority(allItems);

    // Take top N slots for visible items
    const visible = sorted.slice(0, queueStateRef.current.maxSlots);

    // Remaining items are memorized (if they qualify)
    const memorized = sorted.slice(queueStateRef.current.maxSlots).filter((item) => {
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
  }, []);

  // Notify listeners
  const notifyListeners = useCallback(() => {
    const { visible, memorized } = getVisibleAndMemorized();
    queueStateRef.current.listeners.forEach((listener) => listener(visible, memorized));
  }, [getVisibleAndMemorized]);

  // Notify history listeners
  const notifyHistoryListeners = useCallback(() => {
    queueStateRef.current.historyListeners.forEach((listener) =>
      listener([...queueStateRef.current.history])
    );
  }, []);

  // Move item to history
  const moveToHistory = useCallback(
    (item: DisplayQueueItem) => {
      // Add to history (most recent first)
      queueStateRef.current.history.unshift(item);

      // Trim history to limit
      if (queueStateRef.current.history.length > queueStateRef.current.historyLimit) {
        queueStateRef.current.history = queueStateRef.current.history.slice(
          0,
          queueStateRef.current.historyLimit
        );
      }

      notifyHistoryListeners();
    },
    [notifyHistoryListeners]
  );

  const cancelAutoHideTimer = useCallback((item: DisplayQueueItem) => {
    if (item.timerId) {
      clearTimeout(item.timerId);
      item.timerId = undefined;
      queueStateRef.current.items.set(item.id, item);
    }
  }, []);

  // Internal remove (declared before startAutoHideTimer so it can be used there)
  const removeFromQueueInternal = useCallback(
    (id: string) => {
      const item = queueStateRef.current.items.get(id);
      if (!item) return;

      cancelAutoHideTimer(item);
      moveToHistory(item);
      queueStateRef.current.items.delete(id);
      notifyListeners();
    },
    [cancelAutoHideTimer, moveToHistory, notifyListeners]
  );

  // Timer management
  const startAutoHideTimer = useCallback(
    (item: DisplayQueueItem) => {
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
      removeFromQueueInternal(item.id);
    }, duration);

    queueStateRef.current.items.set(item.id, item);
    },
    [removeFromQueueInternal]
  );

  // Generate ID
  const generateId = useCallback((): string => {
    return `display-${queueStateRef.current.nextId++}`;
  }, []);

  // Context API
  const addToQueue = useCallback(
    (
      config: Omit<
        DisplayQueueItem,
        "id" | "timestamp" | "timerId" | "memorized" | "memorizedAt"
      >
    ): string => {
      const id = generateId();

      const item: DisplayQueueItem = {
        ...config,
        id,
        timestamp: Date.now(),
        memorized: false,
      };

      queueStateRef.current.items.set(id, item);
      notifyListeners();

      if (item.phase === "complete") {
        startAutoHideTimer(item);
      }

      return id;
    },
    [generateId, notifyListeners, startAutoHideTimer]
  );

  const updateQueueItem = useCallback(
    (id: string, updates: Partial<DisplayQueueItem>) => {
      const item = queueStateRef.current.items.get(id);
      if (!item) return;

        cancelAutoHideTimer(item);

      const updatedItem: DisplayQueueItem = {
        ...item,
        ...updates,
        id,
        timestamp: item.timestamp,
      };

      queueStateRef.current.items.set(id, updatedItem);
      notifyListeners();

      if (updatedItem.phase === "complete") {
        startAutoHideTimer(updatedItem);
      }
    },
    [cancelAutoHideTimer, notifyListeners, startAutoHideTimer]
  );

  const removeFromQueue = useCallback(
    (id: string) => {
      removeFromQueueInternal(id);
    },
    [removeFromQueueInternal]
  );

  const clearQueue = useCallback(
    (filter?: (item: DisplayQueueItem) => boolean) => {
      const itemsToClear = filter
        ? Array.from(queueStateRef.current.items.values()).filter(filter)
        : Array.from(queueStateRef.current.items.values());

      itemsToClear.forEach((item) => {
        removeFromQueueInternal(item.id);
      });
    },
    [removeFromQueueInternal]
  );

  const configureQueue = useCallback(
    (options: { maxSlots?: number; historyLimit?: number }) => {
      if (options.maxSlots !== undefined) {
        queueStateRef.current.maxSlots = options.maxSlots;
          }
      if (options.historyLimit !== undefined) {
        queueStateRef.current.historyLimit = options.historyLimit;
      }
      notifyListeners();
    },
    [notifyListeners]
  );

  const getSortedQueue = useCallback((): DisplayQueueItem[] => {
    const items = Array.from(queueStateRef.current.items.values());
    return sortByPriority(items);
  }, []);

  const getVisibleItems = useCallback((): DisplayQueueItem[] => {
    return getVisibleAndMemorized().visible;
  }, [getVisibleAndMemorized]);

  const getMemorizedItems = useCallback((): DisplayQueueItem[] => {
    return getVisibleAndMemorized().memorized;
  }, [getVisibleAndMemorized]);

  const getHistory = useCallback((): DisplayQueueItem[] => {
    return [...queueStateRef.current.history];
  }, []);

  const clearHistory = useCallback(() => {
    queueStateRef.current.history = [];
    notifyHistoryListeners();
  }, [notifyHistoryListeners]);

  const subscribeToQueue = useCallback(
    (listener: (visible: DisplayQueueItem[], memorized: DisplayQueueItem[]) => void) => {
      queueStateRef.current.listeners.add(listener);

      const { visible, memorized } = getVisibleAndMemorized();
      listener(visible, memorized);

      return () => {
        queueStateRef.current.listeners.delete(listener);
      };
    },
    [getVisibleAndMemorized]
  );

  const subscribeToHistory = useCallback(
    (listener: (history: DisplayQueueItem[]) => void) => {
      queueStateRef.current.historyListeners.add(listener);

      listener([...queueStateRef.current.history]);

      return () => {
        queueStateRef.current.historyListeners.delete(listener);
      };
    },
    []
  );

  const contextValue: DisplayQueueContextValue = {
    addToQueue,
    updateQueueItem,
    removeFromQueue,
    clearQueue,
    configureQueue,
    getSortedQueue,
    getVisibleItems,
    getMemorizedItems,
    getHistory,
    subscribeToQueue,
    subscribeToHistory,
    clearHistory,
  };

  return (
    <DisplayQueueContext.Provider value={contextValue}>
      {children}
    </DisplayQueueContext.Provider>
  );
};

/**
 * useDisplayQueueContext - Access queue operations
 */
export function useDisplayQueueContext(): DisplayQueueContextValue {
  const context = useContext(DisplayQueueContext);
  if (!context) {
    throw new Error("useDisplayQueueContext must be used within DisplayQueueProvider");
  }
  return context;
}

/**
 * useDisplayQueue - Subscribe to visible items (scoped to context)
 */
export function useDisplayQueue(): DisplayQueueItem[] {
  const { subscribeToQueue } = useDisplayQueueContext();
  const [items, setItems] = useState<DisplayQueueItem[]>([]);

  useEffect(() => {
    return subscribeToQueue((visible, _memorized) => {
      void _memorized;
      setItems(visible);
    });
  }, [subscribeToQueue]);

  return items;
}

/**
 * useDisplayQueueFull - Subscribe to visible + memorized (scoped to context)
 */
export function useDisplayQueueFull(): {
  visible: DisplayQueueItem[];
  memorized: DisplayQueueItem[];
} {
  const { subscribeToQueue } = useDisplayQueueContext();
  const [visible, setVisible] = useState<DisplayQueueItem[]>([]);
  const [memorized, setMemorized] = useState<DisplayQueueItem[]>([]);

  useEffect(() => {
    return subscribeToQueue((visibleItems, memorizedItems) => {
      setVisible(visibleItems);
      setMemorized(memorizedItems);
    });
  }, [subscribeToQueue]);

  return { visible, memorized };
}

/**
 * useDisplayHistory - Subscribe to history (scoped to context)
 */
export function useDisplayHistory(): DisplayQueueItem[] {
  const { subscribeToHistory } = useDisplayQueueContext();
  const [history, setHistory] = useState<DisplayQueueItem[]>([]);

  useEffect(() => {
    return subscribeToHistory((historyItems) => {
      setHistory(historyItems);
    });
  }, [subscribeToHistory]);

  return history;
}
