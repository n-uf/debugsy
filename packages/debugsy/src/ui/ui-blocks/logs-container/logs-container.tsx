"use client";

import React from "react";
import type { PauseState } from "../../hooks/use-pause-state";
import type { ScrollFollowingState } from "../../hooks/use-scroll-following";
import { Notice } from "../../primitives/notice";
import { VirtualizedList } from "../shared/virtualized-list/virtualized-list";
import { TruncationPanel } from "../truncation-panel/truncation-panel";

export interface LogsContainerBanner {
  /**
   * Banner content (typically a Notice)
   */
  content: React.ReactNode;
  /**
   * Condition to show the banner
   */
  show: boolean;
}

export interface LogsContainerTruncation {
  /**
   * Number of hidden logs (optional - auto-calculated if not provided)
   */
  hiddenCount?: number;
  /**
   * Total log count (optional - auto-calculated if not provided)
   */
  totalCount?: number;
  /**
   * Maximum rendered count (optional - auto-calculated if not provided)
   */
  maxRendered?: number;
  /**
   * Actual rendered count (optional)
   */
  renderedCount?: number;
  /**
   * Copy all handler
   */
  onCopyAll?: () => void;
  /**
   * Clear all handler
   */
  onClearAll?: () => void;
}

export interface LogsContainerProps<T> {
  /**
   * Container ref for scroll management
   */
  containerRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Optional ref for logs-only selection (Cmd+A should select only logs, not banners)
   */
  logsOnlyRef?: React.RefObject<HTMLDivElement | null>;
  /**
   * Array of log items
   */
  items: T[];
  /**
   * Render function for each item (receives item and index)
   */
  renderItem: (item: T, index: number) => React.ReactNode;
  /**
   * Key extractor for items
   */
  keyExtractor: (item: T) => string | number;
  /**
   * Optional banners to show at the top
   */
  topBanners?: LogsContainerBanner[];
  /**
   * Optional scroll following state - when provided, auto-generates snapshot banner
   */
  scrollFollowingState?: ScrollFollowingState<T>;
  /**
   * Optional pause state - when provided, auto-generates pause banner
   */
  pauseState?: PauseState<T>;
  /**
   * Optional display content setter for feedback messages
   */
  onDisplayMessage?: (
    message: string,
    type?: "info" | "success" | "error"
  ) => void;
  /**
   * Optional truncation panel configuration
   */
  truncation?: LogsContainerTruncation;
  /**
   * Threshold for auto-generating truncation banner (default: 30)
   * Shows banner when totalCount > threshold
   */
  truncationThreshold?: number;
  /**
   * Maximum items to render before truncating (used with auto-truncation)
   */
  maxRendered?: number;
  /**
   * Total count of items (before slicing) - used for truncation banner
   * If not provided, uses items.length
   */
  totalCount?: number;
  /**
   * Hidden logs indicator component (rendered at end of list)
   */
  hiddenLogsIndicator?: React.ReactNode;
  /**
   * Whether to use virtualization
   */
  virtualized?: boolean;
  /**
   * Virtualization threshold
   */
  virtualizationThreshold?: number;
  /**
   * Item height for virtualization (a collapsed log row is 24px)
   */
  itemHeight?: number;
  /**
   * Overscan count for virtualization
   */
  overscan?: number;
  /**
   * Border left (any CSS border-left value)
   */
  borderLeft?: string;
  /**
   * Padding (any CSS padding value; default: none, 24px at the bottom)
   */
  padding?: string;
  /**
   * Background color (default: the panel's canvas)
   */
  backgroundColor?: string;
  /**
   * Additional styles
   */
  style?: React.CSSProperties;
  /**
   * Additional className
   */
  className?: string;
  /**
   * Custom empty state message (when no items)
   */
  emptyMessage?: string;
}

/**
 * LogsContainer - Container for displaying logs with scrollable content, conditional banners, and truncation panel
 *
 * A specialized container for displaying logs. Handles scrollable content, conditional banners, and truncation panel.
 *
 * @example
 * ```tsx
 * <LogsContainer
 *   containerRef={logsContainerRef}
 *   items={logEntries}
 *   renderItem={(entry) => <LogEntry entry={entry} />}
 *   keyExtractor={(entry) => entry.id}
 *   topBanners={[
 *     {
 *       show: isPaused,
 *       content: <Notice tone="warn" onClick={resume}>Paused</Notice>
 *     }
 *   ]}
 *   truncation={{
 *     hiddenCount: 100,
 *     totalCount: 500,
 *     maxRendered: 400,
 *     onCopyAll: handleCopy,
 *   }}
 * />
 * ```
 */
export const LogsContainer = <T = unknown,>({
  containerRef,
  logsOnlyRef,
  items,
  renderItem,
  keyExtractor,
  topBanners = [],
  scrollFollowingState,
  pauseState,
  onDisplayMessage,
  truncation,
  truncationThreshold = 30,
  maxRendered,
  totalCount: providedTotalCount,
  hiddenLogsIndicator,
  virtualized = true,
  virtualizationThreshold = 50,
  itemHeight = 24,
  overscan = 5,
  borderLeft,
  padding,
  backgroundColor,
  style,
  className,
  emptyMessage = "No entries yet.",
}: LogsContainerProps<T>) => {
  const internalRef = React.useRef<HTMLDivElement | null>(null);
  const effectiveRef = containerRef ?? internalRef;
  const internalLogsOnlyRef = React.useRef<HTMLDivElement | null>(null);
  const effectiveLogsOnlyRef = logsOnlyRef ?? internalLogsOnlyRef;

  // Calculate truncation status for auto-generation
  const totalCount = providedTotalCount ?? items.length;
  const effectiveMaxRendered = maxRendered ?? truncationThreshold;
  const shouldShowTruncationBanner = totalCount > effectiveMaxRendered;
  const hiddenCount = shouldShowTruncationBanner
    ? totalCount - effectiveMaxRendered
    : 0;

  // Auto-generate banners based on state
  const autoBanners: LogsContainerBanner[] = [];

  // Pause banner (high priority)
  if (pauseState?.isPaused) {
    autoBanners.push({
      show: true,
      content: (
        <Notice
          tone="warn"
          title="Click to resume log rendering"
          onClick={() => {
            pauseState.resume();
            onDisplayMessage?.("Log rendering resumed", "success");
          }}
        >
          <span className="dbg-log-note">
            Log rendering paused - {pauseState.pausedItems.length} logs frozen
          </span>
          <span className="dbg-log-note-hint">Click to resume</span>
        </Notice>
      ),
    });
  }

  // Snapshot banner (only when not paused)
  if (
    scrollFollowingState &&
    !scrollFollowingState.isFollowing &&
    !pauseState?.isPaused
  ) {
    const snapshotCount =
      scrollFollowingState.snapshotItems.length > 0
        ? scrollFollowingState.snapshotItems.length
        : items.length;

    autoBanners.push({
      show: true,
      content: (
        <Notice
          tone="info"
          title="Click to return to following live logs"
          onClick={() => {
            scrollFollowingState.returnToFollowing();
            onDisplayMessage?.("Returned to following live logs", "success");
          }}
        >
          <span className="dbg-log-note">
            Viewing snapshot at {snapshotCount} logs
          </span>
          <span className="dbg-log-note-hint">Click to return to live stream</span>
        </Notice>
      ),
    });
  }

  // Combine auto-generated banners with custom banners
  const shownBanners = [...autoBanners, ...topBanners].filter(
    (banner) => banner.show
  );

  // Inline style only for what the caller sets (the look comes from the sheet)
  const containerStyle: React.CSSProperties = { ...style };
  if (padding !== undefined) containerStyle.padding = padding;
  if (backgroundColor !== undefined)
    containerStyle.backgroundColor = backgroundColor;
  if (borderLeft !== undefined) containerStyle.borderLeft = borderLeft;

  return (
    <div
      ref={effectiveRef}
      className={
        className
          ? `dbg-log-scroll dbg-scroll ${className}`
          : "dbg-log-scroll dbg-scroll"
      }
      style={containerStyle}
      onScroll={
        scrollFollowingState?.handleScroll
          ? (e) => scrollFollowingState.handleScroll(e)
          : undefined
      }
    >
      {/* Conditional Banners (one sticky stack above the list) */}
      {shownBanners.length > 0 && (
        <div className="dbg-log-banners">
          {shownBanners.map((banner, index) => (
            <React.Fragment key={`banner-${index}`}>
              {banner.content}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Logs List - Wrapped for Cmd+A selection (only logs, not banners) */}
      <div
        ref={effectiveLogsOnlyRef}
        className="dbg-log-list"
        data-empty={items.length === 0 ? "true" : undefined}
        tabIndex={0}
      >
        {items.length === 0 ? (
          // Empty state
          <div className="dbg-log-empty">{emptyMessage}</div>
        ) : virtualized ? (
          <VirtualizedList
            items={items}
            itemHeight={itemHeight}
            containerRef={effectiveRef}
            keyExtractor={keyExtractor}
            virtualizationThreshold={virtualizationThreshold}
            overscan={overscan}
            renderItem={renderItem}
            footer={hiddenLogsIndicator}
          />
        ) : (
          <>
            {items.map((item, index) => (
              <React.Fragment key={keyExtractor(item)}>
                {renderItem(item, index)}
              </React.Fragment>
            ))}
            {hiddenLogsIndicator}
          </>
        )}
      </div>

      {/* Auto-generated Truncation Panel (when truncated) */}
      {shouldShowTruncationBanner && (
        <TruncationPanel
          hiddenCount={hiddenCount}
          totalCount={totalCount}
          maxRendered={effectiveMaxRendered}
          renderedCount={items.length}
          onCopyAll={truncation?.onCopyAll}
          onClearAll={truncation?.onClearAll}
        />
      )}

      {/* Manual Truncation Panel (for custom control when NOT auto-truncating) */}
      {!shouldShowTruncationBanner &&
        truncation &&
        truncation.hiddenCount !== undefined &&
        truncation.totalCount !== undefined &&
        truncation.maxRendered !== undefined && (
          <TruncationPanel
            hiddenCount={truncation.hiddenCount}
            totalCount={truncation.totalCount}
            maxRendered={truncation.maxRendered}
            renderedCount={truncation.renderedCount}
            onCopyAll={truncation.onCopyAll}
            onClearAll={truncation.onClearAll}
          />
        )}
    </div>
  );
};

LogsContainer.displayName = "LogsContainer";
