"use client";

import React from "react";
import type { PauseState } from "../../hooks/use-pause-state";
import type { ScrollFollowingState } from "../../hooks/use-scroll-following";

export interface LogsContainerBanner {
  /**
   * Banner content (typically a Banner component)
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
   * Optional Banner component to use for auto-generated banners
   */
  BannerComponent?: React.ComponentType<{
    emoji: string;
    message: string;
    variant?: "info" | "warning" | "success" | "error" | "paused" | "snapshot";
    onClick?: () => void;
    title?: string;
  }>;
  /**
   * Optional truncation panel configuration
   */
  truncation?: LogsContainerTruncation;
  /**
   * Truncation panel component
   */
  TruncationPanel?: React.ComponentType<LogsContainerTruncation>;
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
   * Item height for virtualization
   */
  itemHeight?: number;
  /**
   * Overscan count for virtualization
   */
  overscan?: number;
  /**
   * VirtualizedList component (optional)
   */
  VirtualizedList?: React.ComponentType<{
    items: T[];
    itemHeight: number;
    containerRef: React.RefObject<HTMLDivElement | null>;
    keyExtractor: (item: T) => string | number;
    virtualizationThreshold: number;
    overscan: number;
    renderItem: (item: T, index: number) => React.ReactNode;
    footer?: React.ReactNode;
  }>;
  /**
   * Border left color
   */
  borderLeft?: string;
  /**
   * Padding
   */
  padding?: string;
  /**
   * Background color
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
 *       content: <Banner message="Paused" onClick={resume} />
 *     }
 *   ]}
 *   truncation={{
 *     hiddenCount: 100,
 *     totalCount: 500,
 *     maxRendered: 400,
 *     onCopyAll: handleCopy,
 *   }}
 *   TruncationPanel={TruncationPanel}
 *   VirtualizedList={VirtualizedList}
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
  BannerComponent,
  truncation,
  TruncationPanel,
  truncationThreshold = 30,
  maxRendered,
  totalCount: providedTotalCount,
  hiddenLogsIndicator,
  virtualized = true,
  virtualizationThreshold = 50,
  itemHeight = 20,
  overscan = 5,
  VirtualizedList,
  borderLeft,
  padding = "4px 8px 24px 8px",
  backgroundColor,
  style = {},
  className = "",
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
  if (pauseState?.isPaused && BannerComponent) {
    autoBanners.push({
      show: true,
      content: (
        <BannerComponent
          emoji="⏸️"
          message={`Log rendering paused - ${pauseState.pausedItems.length} logs frozen`}
          variant="paused"
          onClick={() => {
            pauseState.resume();
            onDisplayMessage?.("Log rendering resumed", "success");
          }}
          title="Click to resume log rendering"
        />
      ),
    });
  }

  // Snapshot banner (only when not paused)
  if (
    scrollFollowingState &&
    !scrollFollowingState.isFollowing &&
    !pauseState?.isPaused &&
    BannerComponent
  ) {
    const snapshotCount =
      scrollFollowingState.snapshotItems.length > 0
        ? scrollFollowingState.snapshotItems.length
        : items.length;

    autoBanners.push({
      show: true,
      content: (
        <BannerComponent
          emoji="📌"
          message={`Viewing snapshot at ${snapshotCount} logs - Click to return to live stream`}
          variant="snapshot"
          onClick={() => {
            scrollFollowingState.returnToFollowing();
            onDisplayMessage?.("Returned to following live logs", "success");
          }}
          title="Click to return to following live logs"
        />
      ),
    });
  }

  // Combine auto-generated banners with custom banners
  const allBanners = [...autoBanners, ...topBanners];

  return (
    <div
      ref={effectiveRef}
      className={className}
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "auto",
        display: "flex",
        flexDirection: "column",
        padding,
        backgroundColor,
        borderLeft,
        ...style,
      }}
      onScroll={
        scrollFollowingState?.handleScroll
          ? (e) => scrollFollowingState.handleScroll(e)
          : undefined
      }
    >
      {/* Conditional Banners */}
      {allBanners.map((banner, index) =>
        banner.show ? (
          <React.Fragment key={`banner-${index}`}>
            {banner.content}
          </React.Fragment>
        ) : null
      )}

      {/* Logs List - Wrapped for Cmd+A selection (only logs, not banners) */}
      <div
        ref={effectiveLogsOnlyRef}
        tabIndex={0}
        style={{ flex: 1, outline: "none" }}
      >
        {items.length === 0 ? (
          // Empty state
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "100%",
              color: "rgb(var(--color-text-muted))",
              fontSize: "11px",
              fontFamily: "monospace",
              textAlign: "center",
              padding: "20px",
              whiteSpace: "pre-line",
            }}
          >
            {emptyMessage}
          </div>
        ) : virtualized && VirtualizedList ? (
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
      {shouldShowTruncationBanner && TruncationPanel && (
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
        TruncationPanel &&
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

