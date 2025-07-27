"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DebugLogEntry } from "../../debugsy-logs/use-debugsy";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../ui-display/debug-display-state";

// Import extracted components
import {
  ActionsPanel,
  DebugStatusPanels,
  TruncationInfoPanel,
  VirtualizedLogContainer,
} from "./components";

// Import object depth utilities
import { type DepthSetting } from "../../shared/object-depth-utils";

// Import extracted utilities and formatters
import {
  DEFAULT_COPY_CONFIG,
  getAutoResetAfterDelay,
  getDisplayDuration,
} from "./config/copy-config";
import {
  type CopyState,
  copyLogsToClipboard,
  getHoverMessage,
  getLogsToCopy,
} from "./utils/copy-utilities";
import {
  LOG_STYLES,
  getLogsTruncationInfo,
  prepareLogsForRendering,
} from "./utils/log-utilities";

export interface DebugLogsListProps {
  logs: DebugLogEntry[];
  onClearLogs?: () => void;
}

/**
 * Debug Logs List - Main orchestrator for the debug logs display system
 *
 * EXTRACTED COMPONENT ARCHITECTURE:
 * This component now serves as the main coordinator, importing specialized components:
 *
 * 📦 **Core Components** (./components/):
 * - MemoizedLogEntry: Individual log rendering with performance optimization
 * - VirtualizedLogContainer: High-performance virtualized log display (>50 items)
 * - TruncationInfoPanel: Interactive warning panel with Clear/Copy All buttons
 * - DebugStatusPanels: Sticky status panels for pause/following states
 * - ActionsPanel: Right sidebar with copy progression, pause, and health buttons
 *
 * 🎯 **Main Responsibilities**:
 * - State management (copy state, pause/following, scroll position)
 * - Event handling coordination (copy, pause, scroll following)
 * - Data preparation (active logs, truncation info, reversed logs)
 * - Layout orchestration and container structure
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
 *
 * 9. 🏗️ COMPONENT EXTRACTION: Granular, maintainable architecture
 *    - Each component has single responsibility
 *    - Independent testing and development possible
 *    - Better code organization and reusability
 *    - Cleaner main orchestrator with focused logic
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
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all");
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

      await copyLogsToClipboard(logsToCopy, depthSetting);
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
  }, [activeLogs, copyState, depthSetting]);

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
      await copyLogsToClipboard(logs, depthSetting); // Copy ALL logs, not just active ones

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
  }, [logs, depthSetting]);

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
              depthSetting={depthSetting}
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
        depthSetting={depthSetting}
        onCopyLogs={handleCopyLogs}
        onPauseResume={handlePauseResume}
        onHealthSnapshot={handleHealthSnapshot}
        onDepthChange={setDepthSetting}
        onButtonMouseEnter={handleButtonMouseEnter}
        onButtonMouseLeave={handleButtonMouseLeave}
      />
    </div>
  );
};

DebugLogsList.displayName = "DebugLogsList";
