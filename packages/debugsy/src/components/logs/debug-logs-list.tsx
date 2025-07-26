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
 */
const VirtualizedLogContainer: React.FC<{
  logs: DebugLogEntry[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}> = React.memo(({ logs, containerRef }) => {
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
        setScrollTop(container.scrollTop);
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
  }, [containerRef]);

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
 * Debug Logs List - Displays the scrollable list of debug log entries
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
 */
// Timing constants moved to ../config/copy-config.ts for centralized configuration

export const DebugLogsList: React.FC<DebugLogsListProps> = ({ logs }) => {
  const [copyState, setCopyState] = useState<CopyState>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedLogs, setPausedLogs] = useState<DebugLogEntry[]>([]);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const stateResetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Memoize active logs to prevent unnecessary recalculations
  const activeLogs = useMemo(() => {
    return isPaused ? pausedLogs : logs;
  }, [isPaused, pausedLogs, logs]);

  // Memoize prepared logs for rendering to prevent repeated processing
  const reversedLogs = useMemo(() => {
    return prepareLogsForRendering(activeLogs);
  }, [activeLogs]);

  // Memoize truncation info
  const truncationInfo = useMemo(() => {
    return getLogsTruncationInfo(activeLogs.length);
  }, [activeLogs.length]);

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
      // Resume - clear paused logs and resume live updates
      setIsPaused(false);
      setPausedLogs([]);

      // Show feedback
      setDebugDisplayContent({
        message: "Log rendering resumed",
        type: "success",
        duration: 2000,
      });
    } else {
      // Pause - capture current logs state
      setIsPaused(true);
      setPausedLogs([...logs]);

      // Show feedback
      setDebugDisplayContent({
        message: "Log rendering paused",
        type: "info",
        duration: 2000,
      });
    }
  }, [isPaused, logs]);

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
          padding: "4px 8px",
          outline: "none",
        }}
      >
        {truncationInfo.isLogsTruncated && (
          <div style={LOG_STYLES.truncationWarning}>
            ⚠️ Showing latest {LOG_RENDERING_CONFIG.MAX_RENDERED_LOGS} of{" "}
            {logs.length} logs (performance limit)
          </div>
        )}

        {isPaused && (
          <div
            style={{
              ...LOG_STYLES.truncationWarning,
              backgroundColor: "#fbbf2422",
              borderColor: "#f59e0b44",
              color: "#f59e0b",
              fontWeight: "bold",
            }}
          >
            ⏸️ Log rendering paused - {pausedLogs.length} logs frozen
          </div>
        )}

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
            />

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
                }}
              >
                <span style={{ color: "#fbbf24", fontSize: "12px" }}>📁</span>
                <span style={{ color: "#fbbf24", fontWeight: "bold" }}>
                  ... and {truncationInfo.hiddenLogsCount.toLocaleString()} more
                  logs hidden for performance
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Actions Panel - Vertical button panel on the right of logs */}
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
          onClick={handleCopyLogs}
          disabled={activeLogs.length === 0}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: activeLogs.length === 0 ? "#1a1a1a" : "#2d3748", // Lighter active background
            color: activeLogs.length === 0 ? "#4a5568" : "#e2e8f0", // Higher contrast text
            border: "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            cursor: activeLogs.length === 0 ? "not-allowed" : "pointer",
            opacity: activeLogs.length === 0 ? 0.4 : 0.9, // Much higher opacity for active
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            boxShadow:
              activeLogs.length === 0
                ? "0 1px 2px rgba(0, 0, 0, 0.2)"
                : "0 2px 4px rgba(0, 0, 0, 0.4)", // More prominent shadow for active
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={handleButtonMouseEnter}
          onMouseLeave={handleButtonMouseLeave}
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
          onClick={handlePauseResume}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: isPaused ? "#fbbf24" : "#2d3748", // Yellow when paused
            color: isPaused ? "#1f2937" : "#e2e8f0", // Dark text on yellow, light on dark
            border: isPaused ? "2px solid #f59e0b" : "none", // Yellow border when paused
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            cursor: "pointer",
            opacity: 0.9,
            transition: "all 0.2s ease",
            boxShadow: isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)" // Yellow glow when paused
              : "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 2px 8px rgba(251, 191, 36, 0.8)"
              : "0 2px 4px rgba(0, 0, 0, 0.4)";

            // Show descriptive hover message
            setDebugDisplayContent({
              message: isPaused
                ? "Resume log rendering"
                : "Pause log rendering",
              type: "info",
              duration: 0, // Don't auto-clear
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)"
              : "0 1px 2px rgba(0, 0, 0, 0.3)";

            // Clear hover message
            clearDebugDisplayContent();
          }}
          title={isPaused ? "Resume log rendering" : "Pause log rendering"}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>

        {/* Health Snapshot Button */}
        <button
          onClick={handleHealthSnapshot}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#2d3748",
            color: "#68d391", // Green color for health
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

            // Show descriptive hover message
            setDebugDisplayContent({
              message: "Capture application health metrics",
              type: "info",
              duration: 0, // Don't auto-clear
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 1px 2px rgba(0, 0, 0, 0.3)";

            // Clear hover message
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
    </div>
  );
};

DebugLogsList.displayName = "DebugLogsList";
