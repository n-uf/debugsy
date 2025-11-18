"use client";

import React, { useEffect, useMemo, useState } from "react";
import type { DebugLogEntry } from "../../../debugsy-logs/use-debugsy";
import { type DepthSetting } from "../../../shared/object-depth-utils";
import { MemoizedLogEntry } from "./memoized-log-entry";

/**
 * Virtualized log container that only renders visible logs for performance
 * Solves browser freezing when logs > 50 by limiting DOM elements
 * Enhanced with scroll following detection
 */
export const VirtualizedLogContainer: React.FC<{
  logs: DebugLogEntry[];
  depthSetting: DepthSetting;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScrollFollowing?: (
    scrollTop: number,
    containerHeight: number,
    contentHeight: number
  ) => void;
}> = React.memo(({ logs, depthSetting, containerRef, onScrollFollowing }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const itemHeight = 28; // Approximate height per log entry

  // Update container height and track scroll position
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

        // Notify parent about scroll position for following logic
        if (onScrollFollowing) {
          const contentHeight = container.scrollHeight;
          onScrollFollowing(
            newScrollTop,
            container.clientHeight,
            contentHeight
          );
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
  }, [containerRef, onScrollFollowing, logs.length, itemHeight]);

  // Calculate visible range with 5x rendering area (2 up, 1 visible, 2 down)
  const visibleRange = useMemo(() => {
    const visibleItemCount = Math.ceil(containerHeight / itemHeight);
    const visibleStartIndex = Math.floor(scrollTop / itemHeight);
    const visibleEndIndex = visibleStartIndex + visibleItemCount - 1;

    // Calculate 5x rendering area with smart boundary handling
    const totalRenderCount = visibleItemCount * 5;
    const sectionSize = visibleItemCount;

    let renderStartIndex: number;
    let renderEndIndex: number;

    // Boundary handling
    if (visibleStartIndex < sectionSize * 2) {
      // Upper boundary: 1 visible + 4 down
      renderStartIndex = 0;
      renderEndIndex = Math.min(logs.length - 1, totalRenderCount - 1);
    } else if (visibleEndIndex > logs.length - 1 - sectionSize * 2) {
      // Lower boundary: 4 up + 1 visible
      renderStartIndex = Math.max(0, logs.length - totalRenderCount);
      renderEndIndex = logs.length - 1;
    } else {
      // Normal case: 2 up + 1 visible + 2 down
      renderStartIndex = visibleStartIndex - sectionSize * 2;
      renderEndIndex = Math.min(
        logs.length - 1,
        visibleEndIndex + sectionSize * 2
      );
    }

    return {
      startIndex: renderStartIndex,
      endIndex: renderEndIndex,
      visibleStartIndex,
      visibleEndIndex,
    };
  }, [scrollTop, containerHeight, logs.length, itemHeight]);

  // Only use virtualization for large lists to avoid unnecessary complexity
  if (logs.length <= 50) {
    return (
      <>
        {logs.map((log, index) => (
          <MemoizedLogEntry
            key={`${log.timestamp}-${index}`}
            log={log}
            index={index}
            uniqueKey={`${log.timestamp}-${log.point}-${index}`}
            depthSetting={depthSetting}
          />
        ))}
      </>
    );
  }

  // Get logs to render (5x visible area: 2 up + 1 visible + 2 down)
  const logsToRender = logs.slice(
    visibleRange.startIndex,
    visibleRange.endIndex + 1
  );

  // Calculate bottom spacer height, accounting for panels that appear after logs
  // These panels are: TruncationInfoPanel (~60px) + hidden logs indicator (~40px)
  const PANELS_AFTER_LOGS_HEIGHT = 100; // Approximate combined height of panels after logs
  const bottomSpacerHeight = visibleRange.endIndex < logs.length - 1
    ? Math.max(0, (logs.length - 1 - visibleRange.endIndex) * itemHeight - PANELS_AFTER_LOGS_HEIGHT)
    : 0;

  return (
    <>
      {/* Spacer for items before render range */}
      {visibleRange.startIndex > 0 && (
        <div style={{ height: visibleRange.startIndex * itemHeight }} />
      )}

      {/* Rendered items (5x visible area with smart boundaries) */}
      {logsToRender.map((log, relativeIndex) => {
        const actualIndex = visibleRange.startIndex + relativeIndex;
        return (
          <MemoizedLogEntry
            key={`${log.timestamp}-${actualIndex}`}
            log={log}
            index={actualIndex}
            uniqueKey={`${log.timestamp}-${log.point}-${actualIndex}`}
            depthSetting={depthSetting}
          />
        );
      })}

      {/* Spacer for items after render range - adjusted for panels that appear after logs */}
      {bottomSpacerHeight > 0 && (
        <div
          style={{
            height: bottomSpacerHeight,
          }}
        />
      )}
    </>
  );
});

VirtualizedLogContainer.displayName = "VirtualizedLogContainer";
