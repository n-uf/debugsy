/**
 * useScrollFollowing - Smart scroll following with snapshot behavior
 *
 * Ported from debugsy's proven scroll following implementation.
 * Automatically follows new content, captures snapshots when user scrolls away.
 */

import { useCallback, useEffect, useState, type RefObject } from "react";

export interface ScrollFollowingConfig {
  /** Height of each item in pixels (for threshold calculation) */
  itemHeight: number;
  /** Number of items to scroll before stopping following (default: 3) */
  thresholdItems?: number;
  /** Whether following is paused (default: false) */
  isPaused?: boolean;
  /**
   * Log order: 'desc' = newest at top (default), 'asc' = oldest at top
   * - 'desc': scrollTop=0 is newest logs, scroll down to see older
   * - 'asc': scrollTop=max is newest logs, scroll up to see older
   */
  logOrder?: "desc" | "asc";
  /** Callback when following state changes */
  onFollowingChange?: (isFollowing: boolean) => void;
  /** Callback when snapshot is captured */
  onSnapshotCapture?: () => void;
}

export interface ScrollFollowingState<T> {
  /** Whether currently following new content */
  isFollowing: boolean;
  /** Set following state */
  setIsFollowing: (following: boolean) => void;
  /** Captured snapshot of items when user scrolled away */
  snapshotItems: T[];
  /** Set snapshot items */
  setSnapshotItems: (items: T[]) => void;
  /** Return to following mode and clear snapshot */
  returnToFollowing: () => void;
  /** Scroll handler to attach to container */
  handleScroll: (event: React.UIEvent<HTMLElement>) => void;
}

/**
 * Hook for managing scroll following behavior with snapshot support
 *
 * @example
 * ```tsx
 * const {
 *   isFollowing,
 *   snapshotItems,
 *   returnToFollowing,
 *   handleScroll
 * } = useScrollFollowing({
 *   items: logs,
 *   containerRef: logsContainerRef,
 *   itemHeight: 28,
 *   isPaused: false,
 * });
 *
 * const activeItems = isFollowing ? items : snapshotItems;
 * ```
 */
export function useScrollFollowing<T>(config: {
  items: T[];
  containerRef: RefObject<HTMLElement | null>;
  config: ScrollFollowingConfig;
}): ScrollFollowingState<T> {
  const { items, containerRef, config: followConfig } = config;
  const {
    itemHeight,
    thresholdItems = 3,
    isPaused = false,
    logOrder = "desc",
    onFollowingChange,
    onSnapshotCapture,
  } = followConfig;

  const [isFollowing, setIsFollowing] = useState(true);
  const [snapshotItems, setSnapshotItems] = useState<T[]>([]);

  // Handle scroll following logic
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLElement>) => {
      if (isPaused) return; // Don't change following state when paused

      const target = event.currentTarget;
      const scrollTop = target.scrollTop;
      const scrollHeight = target.scrollHeight;
      const clientHeight = target.clientHeight;
      const threshold = itemHeight * thresholdItems;

      // Calculate if user is near newest logs based on log order
      let isNearNewest: boolean;
      if (logOrder === "desc") {
        // Newest at top: check if scrollTop is near 0
        isNearNewest = scrollTop <= threshold;
      } else {
        // Newest at bottom: check if scrollTop is near max (scrollHeight - clientHeight)
        const maxScroll = scrollHeight - clientHeight;
        isNearNewest = scrollTop >= maxScroll - threshold;
      }

      if (!isNearNewest && isFollowing) {
        // User scrolled away from newest, stop following and capture snapshot
        setIsFollowing(false);
        setSnapshotItems([...items]);
        onFollowingChange?.(false);
        onSnapshotCapture?.();
      } else if (isNearNewest && !isFollowing) {
        // User scrolled back to newest, resume following
        setIsFollowing(true);
        setSnapshotItems([]);
        onFollowingChange?.(true);
      }
    },
    [
      isPaused,
      isFollowing,
      items,
      itemHeight,
      thresholdItems,
      logOrder,
      onFollowingChange,
      onSnapshotCapture,
    ]
  );

  // Return to following mode programmatically
  const returnToFollowing = useCallback(() => {
    setIsFollowing(true);
    setSnapshotItems([]);
    onFollowingChange?.(true);

    // Scroll to newest items based on log order
    if (containerRef.current) {
      if (logOrder === "desc") {
        containerRef.current.scrollTop = 0; // Newest at top
      } else {
        // Newest at bottom - scroll to max
        const maxScroll =
          containerRef.current.scrollHeight - containerRef.current.clientHeight;
        containerRef.current.scrollTop = maxScroll;
      }
    }
  }, [containerRef, logOrder, onFollowingChange]);

  // Auto-scroll to newest when following and new items arrive
  useEffect(() => {
    if (isFollowing && !isPaused && containerRef.current) {
      const container = containerRef.current;
      requestAnimationFrame(() => {
        if (logOrder === "desc") {
          container.scrollTop = 0; // Newest at top
        } else {
          // Newest at bottom - scroll to max
          const maxScroll = container.scrollHeight - container.clientHeight;
          container.scrollTop = maxScroll;
        }
      });
    }
  }, [items.length, isFollowing, isPaused, logOrder, containerRef]);

  return {
    isFollowing,
    setIsFollowing,
    snapshotItems,
    setSnapshotItems,
    returnToFollowing,
    handleScroll,
  };
}
