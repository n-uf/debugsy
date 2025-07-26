"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DebugLogEntry } from "../../hooks/use-debug";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../../hooks/use-debug";

// Import extracted utilities and formatters
import {
  DEFAULT_COPY_CONFIG,
  getAutoResetAfterDelay,
  getButtonTransitionDuration,
  getDisplayDuration,
  getProgressBarDuration,
} from "./config/copy-config";
import { DefaultLogFormatter } from "./formatters";
import {
  type CopyState,
  copyLogsToClipboard,
  getCopyIcon,
  getHoverMessage,
  getLogsToCopy,
  getProgressColor,
  getProgressWidth,
} from "./utils/copy-utilities";
import {
  LOG_RENDERING_CONFIG,
  LOG_STYLES,
  getLogsTruncationInfo,
  prepareLogsForRendering,
} from "./utils/log-utilities";

export interface DebugLogsListProps {
  logs: DebugLogEntry[];
  onClearLogs?: () => void;
}

/**
 * Memoized log entry component to prevent unnecessary re-renders
 * Each log entry is memoized based on its content, not array position
 */
const MemoizedLogEntry: React.FC<{
  log: DebugLogEntry;
  index: number;
  uniqueKey: string;
}> = React.memo(
  ({ log, index, uniqueKey }) => {
    // OPTIMIZED: All logs flow through DefaultLogFormatter with automatic expansion routing
    // DefaultLogFormatter now automatically detects log type and routes to appropriate expansion content
    // This provides consistent behavior while allowing specialized expansion content
    return <DefaultLogFormatter log={log} index={index} />;
  },
  (prevProps, nextProps) => {
    // Custom comparison function - only re-render if the actual log content changed
    return (
      prevProps.uniqueKey === nextProps.uniqueKey &&
      prevProps.log === nextProps.log &&
      prevProps.index === nextProps.index
    );
  }
);

MemoizedLogEntry.displayName = "MemoizedLogEntry";

/**
 * Virtualized log container that only renders visible logs for performance
 * Solves browser freezing when logs > 50 by limiting DOM elements
 * Enhanced with scroll following detection
 */
const VirtualizedLogContainer: React.FC<{
  logs: DebugLogEntry[];
  containerRef: React.RefObject<HTMLDivElement | null>;
  onScrollFollowing?: (
    scrollTop: number,
    containerHeight: number,
    contentHeight: number
  ) => void;
}> = React.memo(({ logs, containerRef, onScrollFollowing }) => {
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
          />
        );
      })}

      {/* Spacer for items after render range */}
      {visibleRange.endIndex < logs.length - 1 && (
        <div
          style={{
            height: (logs.length - 1 - visibleRange.endIndex) * itemHeight,
          }}
        />
      )}
    </>
  );
});

VirtualizedLogContainer.displayName = "VirtualizedLogContainer";

/**
 * Truncation Info Panel Component with action buttons
 */
interface TruncationInfoPanelProps {
  truncationInfo: {
    isLogsTruncated: boolean;
    hiddenLogsCount: number;
    maxRendered: number;
  };
  totalLogs: number;
  renderedLogs: number;
  onClearLogs: () => void;
  onCopyAllLogs: () => void;
}

const TruncationInfoPanel: React.FC<TruncationInfoPanelProps> = React.memo(
  ({ truncationInfo, totalLogs, renderedLogs, onClearLogs, onCopyAllLogs }) => {
    if (!truncationInfo.isLogsTruncated) return null;

    const handleClearClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onClearLogs();
      },
      [onClearLogs]
    );

    const handleCopyAllClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onCopyAllLogs();
      },
      [onCopyAllLogs]
    );

    return (
      <div
        style={{
          ...LOG_STYLES.truncationWarning,
          marginTop: "12px",
          marginBottom: "32px", // Significantly increased to prevent cutoff
          position: "relative",
          zIndex: 1,
          backgroundColor: "#78350f33",
          border: "2px solid #fbbf24",
          fontWeight: "bold",
          boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          minHeight: "44px",
        }}
      >
        <div style={{ flex: 1 }}>
          <div>
            ⚠️ Showing latest {LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS} of{" "}
            {totalLogs} logs (performance limit)
          </div>
          <div style={{ fontSize: "8px", marginTop: "2px", opacity: 0.7 }}>
            [DEBUG: {renderedLogs} rendered, {truncationInfo.hiddenLogsCount}{" "}
            hidden]
          </div>
        </div>

        <div style={{ display: "flex", gap: "6px", marginLeft: "12px" }}>
          {/* Copy All Logs Button - transparent style */}
          <button
            onClick={handleCopyAllClick}
            style={{
              backgroundColor: "transparent",
              color: "#f59e0b", // Orange text to match panel theme
              border: "1px solid #f59e0b", // Orange border
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "9px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              height: "20px",
              minWidth: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f59e0b22"; // Light orange background on hover
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Copy all logs to clipboard"
          >
            Copy All
          </button>

          {/* Clear Logs Button - transparent style */}
          <button
            onClick={handleClearClick}
            style={{
              backgroundColor: "transparent",
              color: "#dc2626", // Red text
              border: "1px solid #dc2626", // Red border
              borderRadius: "3px",
              padding: "4px 8px",
              fontSize: "9px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              height: "20px",
              minWidth: "auto",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#dc262622"; // Light red background on hover
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Clear all logs"
          >
            Clear
          </button>
        </div>
      </div>
    );
  }
);

TruncationInfoPanel.displayName = "TruncationInfoPanel";

/**
 * Debug Status Panels Component - groups all sticky status panels
 */
interface DebugStatusPanelsProps {
  isPaused: boolean;
  pausedLogsCount: number;
  isFollowing: boolean;
  snapshotLogsCount: number;
  onReturnToFollowing: () => void;
}

const DebugStatusPanels: React.FC<DebugStatusPanelsProps> = React.memo(
  ({
    isPaused,
    pausedLogsCount,
    isFollowing,
    snapshotLogsCount,
    onReturnToFollowing,
  }) => {
    // Calculate sticky panel positions for proper stacking
    const panelHeight = 40;
    const pausedPanelTop = 0;
    const followingPanelTop = isPaused ? panelHeight : 0;

    return (
      <>
        {isPaused && (
          <div
            style={{
              ...LOG_STYLES.truncationWarning,
              backgroundColor: "#fbbf2422",
              borderColor: "#f59e0b44",
              color: "#f59e0b",
              fontWeight: "bold",
              position: "sticky",
              top: `${pausedPanelTop}px`,
              zIndex: 11,
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid #f59e0b44",
              marginBottom: "2px",
            }}
          >
            ⏸️ Log rendering paused - {pausedLogsCount} logs frozen
          </div>
        )}

        {!isPaused && !isFollowing && (
          <div
            onClick={onReturnToFollowing}
            style={{
              ...LOG_STYLES.truncationWarning,
              backgroundColor: "#3b82f622",
              borderColor: "#3b82f644",
              color: "#60a5fa",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              userSelect: "none",
              position: "sticky",
              top: `${followingPanelTop}px`,
              zIndex: 10,
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid #3b82f644",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f633";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f622";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Click to return to following live logs"
          >
            📌 Viewing snapshot at {snapshotLogsCount} logs - Click to return to
            live stream
          </div>
        )}
      </>
    );
  }
);

DebugStatusPanels.displayName = "DebugStatusPanels";

/**
 * Actions Panel Component - right sidebar with copy, pause, and health buttons
 */
interface ActionsPanelProps {
  activeLogs: DebugLogEntry[];
  copyState: CopyState;
  isPaused: boolean;
  onCopyLogs: () => void;
  onPauseResume: () => void;
  onHealthSnapshot: () => void;
  onButtonMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onButtonMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const ActionsPanel: React.FC<ActionsPanelProps> = React.memo(
  ({
    activeLogs,
    copyState,
    isPaused,
    onCopyLogs,
    onPauseResume,
    onHealthSnapshot,
    onButtonMouseEnter,
    onButtonMouseLeave,
  }) => {
    return (
      <div
        style={{
          width: "32px",
          backgroundColor: "#ffffff08",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4px 2px",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        {/* Copy Button */}
        <button
          onClick={onCopyLogs}
          disabled={activeLogs.length === 0}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: activeLogs.length === 0 ? "#1a1a1a" : "#2d3748",
            color: activeLogs.length === 0 ? "#4a5568" : "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            cursor: activeLogs.length === 0 ? "not-allowed" : "pointer",
            opacity: activeLogs.length === 0 ? 0.4 : 0.9,
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            boxShadow:
              activeLogs.length === 0
                ? "0 1px 2px rgba(0, 0, 0, 0.2)"
                : "0 2px 4px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={onButtonMouseEnter}
          onMouseLeave={onButtonMouseLeave}
        >
          {/* Progress Bar Background */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "2px",
              backgroundColor: "#1f2937",
              borderRadius: "0 0 3px 3px",
            }}
          >
            {/* Progress Bar Fill */}
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                width: getProgressWidth(
                  copyState,
                  activeLogs.length,
                  DEFAULT_COPY_CONFIG
                ),
                height: "100%",
                backgroundColor: getProgressColor(
                  copyState,
                  DEFAULT_COPY_CONFIG
                ),
                borderRadius: "0 0 3px 3px",
                transition: `all ${getProgressBarDuration()}ms ease`,
                boxShadow: `0 0 3px ${getProgressColor(copyState, DEFAULT_COPY_CONFIG)}40`,
              }}
            />
          </div>

          {/* Button Icon */}
          <span style={{ zIndex: 1 }}>
            {getCopyIcon(copyState, DEFAULT_COPY_CONFIG)}
          </span>
        </button>

        {/* Pause/Resume Button */}
        <button
          onClick={onPauseResume}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: isPaused ? "#fbbf24" : "#2d3748",
            color: isPaused ? "#1f2937" : "#e2e8f0",
            border: isPaused ? "2px solid #f59e0b" : "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            cursor: "pointer",
            opacity: 0.9,
            transition: "all 0.2s ease",
            boxShadow: isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)"
              : "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 2px 8px rgba(251, 191, 36, 0.8)"
              : "0 2px 4px rgba(0, 0, 0, 0.4)";

            setDebugDisplayContent({
              message: isPaused
                ? "Resume log rendering"
                : "Pause log rendering",
              type: "info",
              duration: 0,
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)"
              : "0 1px 2px rgba(0, 0, 0, 0.3)";

            clearDebugDisplayContent();
          }}
          title={isPaused ? "Resume log rendering" : "Pause log rendering"}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>

        {/* Health Snapshot Button */}
        <button
          onClick={onHealthSnapshot}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#2d3748",
            color: "#68d391",
            border: "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            cursor: "pointer",
            opacity: 0.9,
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 4px rgba(0, 0, 0, 0.4)";

            setDebugDisplayContent({
              message: "Capture application health metrics",
              type: "info",
              duration: 0,
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 1px 2px rgba(0, 0, 0, 0.3)";

            clearDebugDisplayContent();
          }}
          title="Capture health snapshot to debug logs"
        >
          🏥
        </button>

        {/* Bottom Separator */}
        <div
          style={{
            width: "16px",
            height: "1px",
            backgroundColor: "#334155",
            marginTop: "auto",
            marginBottom: "2px",
            opacity: 0.6,
          }}
        />
      </div>
    );
  }
);

ActionsPanel.displayName = "ActionsPanel";

/**
 * Debug Logs List - Displays the scrollable list of debug log entries
 *
 * ENHANCED COMPONENT STRUCTURE:
 * - TruncationInfoPanel: Interactive panel with Clear/Copy All buttons at log tail
 * - DebugStatusPanels: Sticky status panels for paused/following states
 * - ActionsPanel: Right sidebar with copy progression, pause, and health buttons
 * - VirtualizedLogContainer: High-performance virtualized log rendering
 *
 * RECENT IMPROVEMENTS:
 * 1. 🔒 SMART RESET BEHAVIOR: Separate control for complete vs auto-reset behavior
 *    - resetOnComplete: false = clicking when complete doesn't cycle back to beginning
 *    - autoResetAfterDelay: true = button auto-resets to idle after 3 seconds
 *    - Best of both worlds: no annoying cycling + convenient auto-reset
 *
 * 2. ⏱️ SYNCHRONIZED TIMING: All animations use consistent timing constants from config
 *    - Progress bar: 300ms transition duration
 *    - Button interactions: 200ms for quick feedback
 *    - Display duration: 3000ms (3 sec) before auto-reset
 *    - Reset delay: 2000ms additional delay for final state
 *    - All timing values centralized in copy-config.ts
 *
 * 3. 🎯 ADAPTIVE BOUNDARIES: Copy progression respects actual log counts
 *    - Percentage steps that would go backwards are automatically skipped
 *    - Ensures monotonically increasing progression (20 → 200 → all)
 *
 * 4. 🏁 MAXIMUM REACHED FINISH: Progression ends when any step copies all logs
 *    - If step 2 copies all available logs, progression finishes immediately
 *    - No redundant subsequent steps (e.g., 150 logs: 20 → 150 (finish), not 20 → 150 → 75% → all)
 *    - Optimal user experience with minimal unnecessary steps
 *
 * 5. 📊 DATA-DRIVEN PROGRESS: Progress bar shows actual data copied vs total logs
 *    - Before: Step 2 of 4 = 50% progress (arbitrary step completion)
 *    - After: 200 logs of 1000 total = 20% progress (meaningful data metric)
 *    - Users see accurate feedback about how much data has been copied
 *
 * 6. 🚀 PERFORMANCE OPTIMIZATIONS: Memoization and virtualization
 *    - Memoized log components prevent unnecessary re-renders
 *    - Virtual scrolling for large lists (>50 items)
 *    - Expensive computations cached with useMemo
 *
 * 7. 🎯 SCROLL FOLLOWING: Smart auto-follow behavior for live logs
 *    - Automatically follows newest logs when at top (reversed order)
 *    - Stops following when user scrolls down, shows clickable return panel
 *    - Returns to following on click or scroll back to top
 *
 * 8. 📋 ENHANCED TRUNCATION PANEL: Interactive info panel with actions
 *    - Clear All Logs: Clears entire log history
 *    - Copy All Logs: Copies complete log set (not just visible)
 *    - Positioned at tail after last log record
 *    - Shows debug info and actionable buttons
 */
// Timing constants moved to ../config/copy-config.ts for centralized configuration

export const DebugLogsList: React.FC<DebugLogsListProps> = ({
  logs,
  onClearLogs,
}) => {
  const [copyState, setCopyState] = useState<CopyState>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedLogs, setPausedLogs] = useState<DebugLogEntry[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [snapshotLogs, setSnapshotLogs] = useState<DebugLogEntry[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const stateResetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize active logs to prevent unnecessary recalculations
  const activeLogs = useMemo(() => {
    if (isPaused) return pausedLogs;
    if (!isFollowing) return snapshotLogs;
    return logs;
  }, [isPaused, pausedLogs, isFollowing, snapshotLogs, logs]);

  // Memoize truncation info based on the ORIGINAL logs, not activeLogs
  const truncationInfo = useMemo(() => {
    return getLogsTruncationInfo(logs.length); // Always use full logs array
  }, [logs.length]); // Based on full logs, not activeLogs

  // Memoize prepared logs for rendering to prevent repeated processing
  const reversedLogs = useMemo(() => {
    return prepareLogsForRendering(activeLogs);
  }, [activeLogs]);

  // Handle scroll following logic
  const handleScrollFollowing = useCallback(
    (scrollTop: number, containerHeight: number, contentHeight: number) => {
      if (isPaused) return; // Don't change following state when paused

      const itemHeight = 28;
      const threshold = itemHeight * 3; // Allow 3 items of scroll before stopping following
      const isNearTop = scrollTop <= threshold; // Since logs are reversed, check proximity to top

      if (!isNearTop && isFollowing) {
        // User scrolled away from top, stop following and capture snapshot
        setIsFollowing(false);
        setSnapshotLogs([...logs]);
      } else if (isNearTop && !isFollowing) {
        // User scrolled back to top, resume following
        setIsFollowing(true);
        setSnapshotLogs([]);
      }
    },
    [isPaused, isFollowing, logs]
  );

  // Function to return to following mode
  const returnToFollowing = useCallback(() => {
    setIsFollowing(true);
    setSnapshotLogs([]);

    // Scroll to head (top) where newest logs are, since logs are reversed
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }

    // Show feedback
    setDebugDisplayContent({
      message: "Returned to following live logs",
      type: "success",
      duration: 2000,
    });
  }, []);

  // Auto-scroll to top (head) when following and new logs arrive
  useEffect(() => {
    if (isFollowing && !isPaused && logsContainerRef.current) {
      const container = logsContainerRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        container.scrollTop = 0; // Scroll to top where newest logs appear
      });
    }
  }, [logs.length, isFollowing, isPaused]);

  // Auto-reset copy state after synchronized display duration
  useEffect(() => {
    if (copyState !== 0) {
      // Clear any existing timeout
      if (stateResetTimeoutRef.current) {
        clearTimeout(stateResetTimeoutRef.current);
      }

      // Use display duration for all states
      const timeoutDuration = getDisplayDuration();
      const shouldAutoReset = getAutoResetAfterDelay();

      // Set new timeout to reset state (if auto-reset is enabled)
      if (shouldAutoReset) {
        stateResetTimeoutRef.current = setTimeout(() => {
          setCopyState(0);
        }, timeoutDuration);
      }
    }

    return () => {
      if (stateResetTimeoutRef.current) {
        clearTimeout(stateResetTimeoutRef.current);
      }
    };
  }, [copyState]);

  const handleCopyLogs = useCallback(async () => {
    try {
      const {
        logs: logsToCopy,
        newState,
        message,
      } = getLogsToCopy(activeLogs, copyState, DEFAULT_COPY_CONFIG);

      await copyLogsToClipboard(logsToCopy);
      setCopyState(newState);

      // Show feedback on display panels
      setDebugDisplayContent({
        message,
        type: "success",
        duration: 3000,
      });

      console.log(`📋 Copied ${logsToCopy.length} logs to clipboard`);
    } catch (error) {
      console.error("Failed to copy logs:", error);

      // Show error on display panels
      setDebugDisplayContent({
        message: "Failed to copy logs",
        type: "error",
        duration: 3000,
      });
    }
  }, [activeLogs, copyState]);

  const handleHealthSnapshot = useCallback(() => {
    // Call the framework's health snapshot function
    const globalDebug = (globalThis as any).surfaceDebug;
    if (globalDebug?.captureHealthSnapshot) {
      globalDebug.captureHealthSnapshot();

      // Show feedback on display panels
      setDebugDisplayContent({
        message: "Health snapshot captured",
        type: "success",
        duration: 2000,
      });
    } else {
      console.warn("⚠️ Health snapshot function not available");

      // Show error on display panels
      setDebugDisplayContent({
        message: "Health snapshot function not available",
        type: "error",
        duration: 3000,
      });
    }
  }, []);

  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      // Resume - clear paused logs, resume live updates, and return to following
      setIsPaused(false);
      setPausedLogs([]);
      setIsFollowing(true);
      setSnapshotLogs([]);

      // Scroll to head (top) when resuming, where newest logs appear
      setTimeout(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = 0;
        }
      }, 0);

      // Show feedback
      setDebugDisplayContent({
        message: "Log rendering resumed and following live stream",
        type: "success",
        duration: 2000,
      });
    } else {
      // Pause - capture current logs state and stop following
      setIsPaused(true);
      setPausedLogs([...logs]);
      setIsFollowing(false);
      setSnapshotLogs([]);

      // Show feedback
      setDebugDisplayContent({
        message: "Log rendering paused",
        type: "info",
        duration: 2000,
      });
    }
  }, [isPaused, logs]);

  // Function to copy all logs (enhanced version of existing functionality)
  const handleCopyAllLogs = useCallback(async () => {
    try {
      await copyLogsToClipboard(logs); // Copy ALL logs, not just active ones

      setDebugDisplayContent({
        message: `Copied all ${logs.length} logs to clipboard`,
        type: "success",
        duration: 3000,
      });

      console.log(`📋 Copied all ${logs.length} logs to clipboard`);
    } catch (error) {
      console.error("Failed to copy all logs:", error);

      setDebugDisplayContent({
        message: "Failed to copy all logs",
        type: "error",
        duration: 3000,
      });
    }
  }, [logs]);

  // Function to clear all logs
  const handleClearAllLogs = useCallback(() => {
    if (onClearLogs) {
      onClearLogs();

      setDebugDisplayContent({
        message: "All logs cleared",
        type: "info",
        duration: 2000,
      });
    } else {
      console.warn(
        "Clear logs functionality not available - onClearLogs prop not provided"
      );

      setDebugDisplayContent({
        message: "Clear logs not available",
        type: "error",
        duration: 2000,
      });
    }
  }, [onClearLogs]);

  // Handle Cmd+A to select only logs content
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "a") {
        // Check if the focus is within our logs container
        const activeElement = document.activeElement;
        const isWithinLogs =
          logsContainerRef.current?.contains(activeElement) ||
          logsContainerRef.current === activeElement;

        if (isWithinLogs) {
          event.preventDefault();
          event.stopPropagation();

          // Select the text content of the logs container
          if (logsContainerRef.current) {
            const selection = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(logsContainerRef.current);
            selection?.removeAllRanges();
            selection?.addRange(range);
          }
        }
      }
    };

    const container = logsContainerRef.current;
    if (container) {
      container.addEventListener("keydown", handleKeyDown);
      return () => container.removeEventListener("keydown", handleKeyDown);
    }
  }, []);

  const handleButtonMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (activeLogs.length > 0) {
        (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.08)";
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          "0 2px 4px rgba(0, 0, 0, 0.4)";

        // Show descriptive hover message in display
        setDebugDisplayContent({
          message: getHoverMessage(
            copyState,
            activeLogs.length,
            DEFAULT_COPY_CONFIG
          ),
          type: "info",
          duration: 0, // Don't auto-clear
        });
      }
    },
    [copyState, activeLogs.length]
  );

  const handleButtonMouseLeave = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
      (e.currentTarget as HTMLButtonElement).style.boxShadow =
        "0 1px 2px rgba(0, 0, 0, 0.3)";

      // Clear hover message from display
      clearDebugDisplayContent();
    },
    []
  );

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Main logs container - make it focusable for Cmd+A */}
      <div
        ref={logsContainerRef}
        tabIndex={0}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "4px 8px 24px 8px", // Increased bottom padding from 4px to 24px
          outline: "none",
        }}
      >
        {/* Debug Status Panels */}
        <DebugStatusPanels
          isPaused={isPaused}
          pausedLogsCount={pausedLogs.length}
          isFollowing={isFollowing}
          snapshotLogsCount={snapshotLogs.length}
          onReturnToFollowing={returnToFollowing}
        />

        {reversedLogs.length === 0 ? (
          <div style={LOG_STYLES.emptyState}>
            No debug logs yet.
            <br />
            Enable debug points and interact with the surface to see logs here.
          </div>
        ) : (
          <>
            {/* Virtualized container that only renders visible logs */}
            <VirtualizedLogContainer
              logs={reversedLogs}
              containerRef={logsContainerRef}
              onScrollFollowing={handleScrollFollowing}
            />
          </>
        )}

        {/* Truncation Info Panel - positioned at tail after all logs */}
        <TruncationInfoPanel
          truncationInfo={truncationInfo}
          totalLogs={logs.length}
          renderedLogs={reversedLogs.length}
          onClearLogs={handleClearAllLogs}
          onCopyAllLogs={handleCopyAllLogs}
        />

        {/* Hidden logs indicator - keep at very bottom */}
        {truncationInfo.isLogsTruncated && (
          <div
            key="hidden-logs-indicator"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginTop: "8px",
              padding: "6px 8px",
              backgroundColor: "#78350f22",
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "monospace",
              lineHeight: "1.2",
              justifyContent: "center",
              border: "1px dashed #78350f44",
              position: "relative", // Changed from sticky to relative
              zIndex: 9,
              backdropFilter: "blur(8px)",
              borderTop: "1px solid #78350f44",
              marginBottom: "8px", // Added bottom margin for spacing
            }}
          >
            <span style={{ color: "#fbbf24", fontSize: "12px" }}>📁</span>
            <span style={{ color: "#fbbf24", fontWeight: "bold" }}>
              ... and {truncationInfo.hiddenLogsCount.toLocaleString()} more
              logs hidden for performance
            </span>
          </div>
        )}
      </div>

      {/* Actions Panel - Right sidebar with interactive buttons */}
      <ActionsPanel
        activeLogs={activeLogs}
        copyState={copyState}
        isPaused={isPaused}
        onCopyLogs={handleCopyLogs}
        onPauseResume={handlePauseResume}
        onHealthSnapshot={handleHealthSnapshot}
        onButtonMouseEnter={handleButtonMouseEnter}
        onButtonMouseLeave={handleButtonMouseLeave}
      />
    </div>
  );
};

DebugLogsList.displayName = "DebugLogsList";
