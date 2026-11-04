"use client";

import React, { useEffect, useMemo, useState } from "react";
import { cn } from "../../../utils/cn";

export interface VirtualizedListProps<T = unknown> {
  /**
   * Array of items to render
   */
  items: T[];
  /**
   * Height of each item in pixels
   */
  itemHeight: number;
  /**
   * Render function for each item
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Container ref (required for scroll tracking)
   */
  containerRef: React.RefObject<HTMLDivElement | null>;
  /**
   * Callback when scroll position changes
   */
  onScroll?: (scrollInfo: {
    scrollTop: number;
    containerHeight: number;
    contentHeight: number;
  }) => void;
  /**
   * Overscan multiplier (default: 5 = 2 up + 1 visible + 2 down)
   */
  overscan?: number;
  /**
   * Threshold for enabling virtualization (default: 50)
   * Below this count, all items are rendered
   */
  virtualizationThreshold?: number;
  /**
   * Custom key extractor
   */
  keyExtractor?: (item: T, index: number) => string | number;
  /**
   * Container className
   */
  className?: string;
  /**
   * Custom empty state
   */
  emptyState?: React.ReactNode;
  /**
   * Footer content to render after all items (e.g., hidden logs indicator)
   * Only rendered when scrolled to bottom or when virtualization is disabled
   */
  footer?: React.ReactNode;
}

function VirtualizedListInner<T = unknown>(
  {
    items,
    itemHeight,
    renderItem,
    containerRef,
    onScroll,
    overscan = 5,
    virtualizationThreshold = 50,
    keyExtractor,
    className,
    emptyState,
    footer,
  }: VirtualizedListProps<T>,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  // Track scroll position and container size
  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    const updateHeight = () => {
      if (container) {
        setContainerHeight(container.clientHeight);
      }
    };

    const handleScroll = () => {
      if (container) {
        const newScrollTop = container.scrollTop;
        setScrollTop(newScrollTop);

        // Notify parent about scroll position
        if (onScroll) {
          onScroll({
            scrollTop: newScrollTop,
            containerHeight: container.clientHeight,
            contentHeight: container.scrollHeight,
          });
        }
      }
    };

    updateHeight();
    container.addEventListener("scroll", handleScroll, { passive: true });

    const resizeObserver = new ResizeObserver(updateHeight);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, onScroll, items.length, itemHeight]);

  // Calculate visible range with overscan
  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const visibleStartIndex = Math.floor(scrollTop / itemHeight);
    const visibleEndIndex = visibleStartIndex + visibleItemCount - 1;

    // Calculate overscan rendering area with smart boundary handling
    const totalRenderCount = visibleItemCount * overscan;
    const sectionSize = visibleItemCount;

    let renderStartIndex: number;
    let renderEndIndex: number;

    // Boundary handling
    if (visibleStartIndex < sectionSize * 2) {
      // Upper boundary
      renderStartIndex = 0;
      renderEndIndex = Math.min(items.length - 1, totalRenderCount - 1);
    } else if (visibleEndIndex > items.length - 1 - sectionSize * 2) {
      // Lower boundary
      renderStartIndex = Math.max(0, items.length - totalRenderCount);
      renderEndIndex = items.length - 1;
    } else {
      // Normal case: centered overscan
      renderStartIndex = visibleStartIndex - sectionSize * 2;
      renderEndIndex = Math.min(
        items.length - 1,
        visibleEndIndex + sectionSize * 2
      );
    }

    return {
      startIndex: renderStartIndex,
      endIndex: renderEndIndex,
      visibleStartIndex,
      visibleEndIndex,
    };
  }, [scrollTop, containerHeight, items.length, itemHeight, overscan]);

  // Default key extractor
  const getKey = keyExtractor ?? ((item: T, index: number) => index);

  // Empty state
  if (items.length === 0 && emptyState) {
    return (
      <div
        ref={ref}
        className={cn("flex items-center justify-center p-8", className)}
      >
        {emptyState}
      </div>
    );
  }

  // For small lists, skip virtualization
  if (items.length <= virtualizationThreshold) {
    return (
      <div ref={ref} className={className}>
        {items.map((item, index) => (
          <React.Fragment key={getKey(item, index)}>
            {renderItem(item, index)}
          </React.Fragment>
        ))}
        {footer}
      </div>
    );
  }

  // Virtualized rendering
  const itemsToRender = items.slice(
    visibleRange.startIndex,
    visibleRange.endIndex + 1
  );

  return (
    <div ref={ref} className={className}>
      {/* Spacer for items before render range */}
      {visibleRange.startIndex > 0 && (
        <div style={{ height: visibleRange.startIndex * itemHeight }} />
      )}

      {/* Rendered items with overscan */}
      {itemsToRender.map((item, relativeIndex) => {
        const actualIndex = visibleRange.startIndex + relativeIndex;
        return (
          <React.Fragment key={getKey(item, actualIndex)}>
            {renderItem(item, actualIndex)}
          </React.Fragment>
        );
      })}

      {/* Render footer when scrolled to bottom */}
      {visibleRange.endIndex >= items.length - 1 && footer}

      {/* Spacer for items after render range */}
      {visibleRange.endIndex < items.length - 1 && (
        <div
          style={{
            height: (items.length - 1 - visibleRange.endIndex) * itemHeight,
          }}
        />
      )}
    </div>
  );
}

const VirtualizedList = React.forwardRef(VirtualizedListInner) as <T = unknown>(
  props: VirtualizedListProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> }
) => ReturnType<typeof VirtualizedListInner>;

(VirtualizedList as React.FC).displayName = "VirtualizedList";

export { VirtualizedList };
