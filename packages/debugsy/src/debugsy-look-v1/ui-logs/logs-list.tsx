"use client";

import { Z_INDEX } from "@workspace/harbuz";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { DebugLogEntry } from "../../debugsy-logs/use-debugsy";
import { useDebugsy } from "../../debugsy-logs/use-debugsy";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../../shared/debug-display-state";

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
  onStateChange?: (state: { isPaused: boolean; isFollowing: boolean }) => void;
  onRegisterClearLocalState?: (clearCallback: () => void) => void;
}

export const DebugLogsList: React.FC<DebugLogsListProps> = ({
  logs,
  onClearLogs,
  onStateChange,
  onRegisterClearLocalState,
}) => {
  // Get debug state for filtering logs by enabled debug points
  const debug = useDebugsy();

  const [copyState, setCopyState] = useState<CopyState>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [pausedLogs, setPausedLogs] = useState<DebugLogEntry[]>([]);
  const [isFollowing, setIsFollowing] = useState(true);
  const [snapshotLogs, setSnapshotLogs] = useState<DebugLogEntry[]>([]);
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  const stateResetTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Filter logs by enabled debug points BEFORE applying paused/following logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      return debug.isEnabled(log.point);
    });
  }, [logs, debug.isEnabled]);

  // Memoize active logs to prevent unnecessary recalculations
  const activeLogs = useMemo(() => {
    if (isPaused)
      return pausedLogs.filter(
        (log) => log.point === "health" || debug.isEnabled(log.point)
      );
    if (!isFollowing)
      return snapshotLogs.filter(
        (log) => log.point === "health" || debug.isEnabled(log.point)
      );
    return filteredLogs;
  }, [
    isPaused,
    pausedLogs,
    isFollowing,
    snapshotLogs,
    filteredLogs,
    debug.isEnabled,
  ]);

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
        setSnapshotLogs([...filteredLogs]);
      } else if (isNearTop && !isFollowing) {
        // User scrolled back to top, resume following
        setIsFollowing(true);
        setSnapshotLogs([]);
      }
    },
    [isPaused, isFollowing, filteredLogs]
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
  }, [filteredLogs.length, isFollowing, isPaused]);

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

  // Communicate state changes to parent
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ isPaused, isFollowing });
    }
  }, [isPaused, isFollowing, onStateChange]);

  // Create and register local state clearing function
  const clearLocalState = useCallback(() => {
    setPausedLogs([]);
    setSnapshotLogs([]);
    setIsFollowing(true);
    setIsPaused(false);

    // Scroll to top when resuming
    setTimeout(() => {
      if (logsContainerRef.current) {
        logsContainerRef.current.scrollTop = 0;
      }
    }, 0);
  }, []);

  // Register the clear function with parent
  useEffect(() => {
    if (onRegisterClearLocalState) {
      onRegisterClearLocalState(clearLocalState);
    }
  }, [onRegisterClearLocalState, clearLocalState]);

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
      setPausedLogs([...filteredLogs]);
      setIsFollowing(false);
      setSnapshotLogs([]);

      // Show feedback
      setDebugDisplayContent({
        message: "Log rendering paused",
        type: "info",
        duration: 2000,
      });
    }
  }, [isPaused, filteredLogs]);

  // Function to copy all logs (enhanced version of existing functionality)
  const handleCopyAllLogs = useCallback(async () => {
    try {
      await copyLogsToClipboard(logs, depthSetting); // Copy ALL logs, not just active ones

      setDebugDisplayContent({
        message: `Copied all ${logs.length} logs to clipboard`,
        type: "success",
        duration: 3000,
      });

      console.log(`Copied all ${logs.length} logs to clipboard`);
    } catch (error) {
      console.error("Failed to copy logs:", error);

      // Show error on display panels
      setDebugDisplayContent({
        message: "Failed to copy logs",
        type: "error",
        duration: 3000,
      });
    }
  }, [logs, depthSetting]);

  // Function to clear all logs
  const handleClearAllLogs = useCallback(() => {
    if (!onClearLogs) {
      console.warn(
        "Clear logs functionality not available - onClearLogs prop not provided"
      );

      setDebugDisplayContent({
        message: "Clear logs not available",
        type: "error",
        duration: 2000,
      });
      return;
    }

    // Call the parent's clear function which handles double-action logic
    onClearLogs();
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
              truncationPanel={
                <TruncationInfoPanel
                  truncationInfo={truncationInfo}
                  totalLogs={logs.length}
                  renderedLogs={reversedLogs.length}
                  onClearLogs={handleClearAllLogs}
                  onCopyAllLogs={handleCopyAllLogs}
                />
              }
              hiddenLogsIndicator={
                truncationInfo.isLogsTruncated ? (
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
                      position: "relative",
                      backdropFilter: "blur(8px)",
                      borderTop: "1px solid #78350f44",
                      marginBottom: "8px",
                      zIndex: Z_INDEX.DEBUG_LOGS_LIST,
                    }}
                  >
                    <span style={{ color: "#fbbf24", fontSize: "12px" }}>
                      📁
                    </span>
                    <span style={{ color: "#fbbf24", fontWeight: "bold" }}>
                      ... and {truncationInfo.hiddenLogsCount.toLocaleString()}{" "}
                      more logs hidden for performance
                    </span>
                  </div>
                ) : null
              }
            />
          </>
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
