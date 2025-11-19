"use client";

import {
  ActionToolbar,
  clearDisplayContent,
  ControlPanel,
  ControlPanelDisplaySection,
  ControlPanelSection,
  DEFAULT_COPY_CONFIG,
  getLogsToCopy,
  LogEntry,
  safeSuperjsonStringify,
  setDisplayContent,
  StatusButtonGroup,
  StatusButtonTheme,
  TerminalLayout,
  TerminalLayoutActions,
  TerminalLayoutBody,
  TerminalLayoutContent,
  TerminalLayoutControlPanel,
  TerminalLayoutHeader,
  TerminalLayoutLogsContainer,
  TerminalLayoutResizeHandle,
  TerminalLayoutResizePresets,
  TerminalLayoutShortcut,
  TerminalLayoutShortcuts,
  TerminalLayoutSidebar,
  TerminalLayoutStatItem,
  TerminalLayoutStats,
  useCopyState,
  useDisplay,
  useHoverMessage,
  useKeyboardSelection,
  useLogFiltering,
  usePauseState,
  useResizable,
  useScrollFollowing,
  Z_INDEX,
  type ActionButton,
  type DepthControl,
  type DepthSetting,
} from "@workspace/harbuz";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useRenderTracker } from "../debugsy-deps";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import { type DebugsyLookProps } from "../debugsy-look-v1/debugsy-look";
import type { DebugLogEntry, DebugPoint } from "../debugsy-space";
import {
  DEBUG_POINT_CONFIG,
  getLookDebugPoints,
} from "../debugsy-space/debugsy-point";
import { DependencyControlsV2 } from "./dependency-controls";

// Re-export type for external consumers
export type { DebugsyLookProps };

/**
 * DebugsyLook - Harbuz-based implementation (V2)
 *
 * Full implementation using @workspace/harbuz UI components.
 * Maintains feature parity with V1 while using modern TerminalLayout structure.
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = ({
  closeOnClickOutside = false,
  _uiVersion,
  _onToggleVersion,
}) => {
  // Enhanced tracking
  useRenderTracker("DebugsyLookV2", {
    renderThreshold: 15,
    mountThreshold: 5,
    trackRenders: true,
    trackMounts: true,
    onExcessiveRenders: (info) =>
      console.warn("DebugsyLookV2 excessive renders:", info),
    onExcessiveMounts: (info) =>
      console.warn("DebugsyLookV2 excessive mounts:", info),
  });

  // Debug system integration
  useDebugsySubscription();
  const debug = useDebugsy();
  const logs = debug.getLogs();
  const onClearLogs = debug.clearLogs;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const clearConfirmationTimeoutRef = useRef<
    ReturnType<typeof setTimeout> | undefined
  >(undefined);

  // State
  const [isVisible, setIsVisible] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all");

  // Display system
  const displayContent = useDisplay();

  // 🔥 HARBUZ HOOKS INTEGRATION 🔥

  // 1. Pause State Hook - Preserves logs when paused
  const pauseState = usePauseState<DebugLogEntry>({
    onPauseChange: (paused) => {
      setDisplayContent({
        message: paused ? "Log rendering paused" : "Log rendering resumed",
        type: paused ? "info" : "success",
        duration: 2000,
      });
    },
  });

  // 2. Scroll Following Hook - Smart scroll with snapshots
  const scrollFollowing = useScrollFollowing<DebugLogEntry>({
    items: logs,
    containerRef: logsContainerRef as React.RefObject<HTMLElement | null>,
    config: {
      itemHeight: 24,
      thresholdItems: 3,
      isPaused: pauseState.isPaused,
      onFollowingChange: (following) => {
        if (!following) {
          setDisplayContent({
            message: "Viewing snapshot - scroll to top to resume following",
            type: "info",
            duration: 2000,
          });
        }
      },
    },
  });

  // 3. Log Filtering Hook - Filter by debug point state
  const filteredLogs = useLogFiltering({
    items: logs,
    getPoint: (log) => log.point,
    isEnabled: (point) => debug.isEnabled(point as DebugPoint),
    alwaysInclude: ["health"], // Always show health logs
  });

  // 4. Copy State Hook - 3-state copy indicator with auto-reset
  const copyState = useCopyState({
    autoResetDelay: 3000,
    onStateChange: (state) => {
      if (state === 2) {
        setDisplayContent({
          message: "Logs copied to clipboard!",
          type: "success",
          duration: 2000,
        });
      }
    },
  });

  // 5. Hover Message Hook - Display messages on button hover
  const hoverMessage = useHoverMessage({
    setMessage: (message, type = "info") => {
      setDisplayContent({ message, type, duration: 0 }); // duration: 0 = don't auto-clear
    },
    clearMessage: clearDisplayContent,
  });

  // Determine which logs to display (paused, snapshot, or live)
  const activeLogs = pauseState.isPaused
    ? pauseState.pausedItems
    : scrollFollowing.isFollowing
      ? filteredLogs
      : scrollFollowing.snapshotItems.length > 0
        ? scrollFollowing.snapshotItems
        : filteredLogs;

  // Resizable panel
  const getMaxHeight = () =>
    typeof window !== "undefined" ? window.innerHeight : 800;
  const {
    height: panelHeight,
    setHeight: setPanelHeight,
    isResizing,
    handleResizeStart,
  } = useResizable({
    initialHeight: 400,
    minHeight: 200,
    maxHeight: getMaxHeight(),
  });

  // 6. Keyboard Selection Hook - Cmd+A selects only logs (after isResizing is defined)
  useKeyboardSelection({
    containerRef: logsContainerRef as React.RefObject<HTMLElement | null>,
    enabled: isVisible && !isResizing,
  });

  // Smart clear function with double-action logic
  const handleSmartClear = useCallback(() => {
    const { isPaused } = pauseState;
    const { isFollowing } = scrollFollowing;

    // If following live logs, clear immediately
    if (isFollowing && !isPaused) {
      onClearLogs();
      setDisplayContent({
        message: "Logs cleared",
        type: "success",
        duration: 1500,
      });
      return;
    }

    // If paused or scrolled (not following), use two-step process
    if (!clearConfirmation) {
      // First action: Clear storage immediately but keep local state
      onClearLogs();
      setClearConfirmation(true);

      setDisplayContent({
        message:
          "Logs cleared. Press again to clear snapshot and resume following.",
        type: "info",
        duration: 3000,
      });

      // Clear any existing timeout
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }

      // Auto-reset confirmation after 3 seconds
      clearConfirmationTimeoutRef.current = setTimeout(() => {
        setClearConfirmation(false);
      }, 3000);
    } else {
      // Second action: Clear local state and resume following
      setClearConfirmation(false);

      // Clear the confirmation timeout
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }

      // Resume following
      if (isPaused) {
        pauseState.resume();
      }
      scrollFollowing.returnToFollowing();

      // Clear local state
      if (clearLocalStateCallback) {
        clearLocalStateCallback();
      }

      setDisplayContent({
        message: "Snapshot cleared, now following live logs",
        type: "success",
        duration: 2000,
      });
    }
  }, [
    pauseState,
    scrollFollowing,
    clearConfirmation,
    onClearLogs,
    clearLocalStateCallback,
  ]);

  const onClose = useCallback(() => {
    setIsVisible(false);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isVisible && !isResizing && closeOnClickOutside) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isVisible, isResizing, closeOnClickOutside, onClose]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeydown = (event: KeyboardEvent) => {
      // Cmd+D or Ctrl+D to cycle between compact and extended modes
      if (event.key === "d" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();

        if (!isVisible) {
          // First time: show in compact mode
          setIsVisible(true);
          setPanelHeight(0);
        } else {
          // Toggle between compact (0) and extended (400) modes
          const newHeight = panelHeight === 0 ? 400 : 0;
          setPanelHeight(newHeight);
        }
        return;
      }

      // Only handle other shortcuts when panel is visible and not resizing
      if (!isVisible || isResizing) return;

      // Escape to close
      if (event.key === "Escape") {
        onClose();
        return;
      }

      // Cmd+K or Ctrl+K to clear logs
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleSmartClear();
        return;
      }
    };

    document.addEventListener("keydown", handleKeydown);
    return () => document.removeEventListener("keydown", handleKeydown);
  }, [
    isVisible,
    isResizing,
    panelHeight,
    handleSmartClear,
    onClose,
    setPanelHeight,
  ]);

  // Cleanup confirmation timeout
  useEffect(() => {
    return () => {
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }
    };
  }, []);

  // Calculate stats
  const activePoints = [...new Set(filteredLogs.map((log) => log.point))]
    .length;
  const totalLogs = logs.length;
  const filteredCount = filteredLogs.length;

  // 🔥 Get debug points from centralized config (matching Showcase)
  const debugPoints = React.useMemo(
    () =>
      getLookDebugPoints().map((key) => ({
        key,
        emoji: DEBUG_POINT_CONFIG[key].emoji,
        label: DEBUG_POINT_CONFIG[key].label,
      })),
    []
  );

  // 🔥 Button theme for control panel buttons (matching Showcase)
  const controlButtonTheme: StatusButtonTheme = {
    fontSize: "10px",
    lineHeight: "12px",
    style: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  };

  // 🔥 Health Snapshot Handler (from Showcase)
  const handleHealthSnapshot = useCallback(() => {
    const globalDebug = (globalThis as any).surfaceDebug;
    if (globalDebug?.captureHealthSnapshot) {
      globalDebug.captureHealthSnapshot();
      // Capture snapshot when taking health snapshot (stops following)
      scrollFollowing.setIsFollowing(false);
      scrollFollowing.setSnapshotItems([...filteredLogs]);
      setDisplayContent({
        message: "Health snapshot captured and saved to logs",
        type: "success",
        duration: 2000,
      });
    } else {
      setDisplayContent({
        message: "Health snapshot captured (surfaceDebug not available)",
        type: "info",
        duration: 2000,
      });
    }
  }, [filteredLogs, scrollFollowing]);

  // 🔥 Copy Logs Handler with Depth Setting (from Showcase)
  const handleCopyLogs = useCallback(() => {
    const {
      logs: logsToCopy,
      nextState,
      message,
    } = getLogsToCopy(activeLogs, copyState.state, DEFAULT_COPY_CONFIG);

    // Get depth as number for safeSuperjsonStringify
    const depthMap: Record<DepthSetting, number | undefined> = {
      str: 0,
      "1": 1,
      "3": 3,
      "5": 5,
      "10": 10,
      all: undefined,
    };
    const depth = depthMap[depthSetting];

    // Copy with depth setting
    const serialized = safeSuperjsonStringify(logsToCopy, depth);
    navigator.clipboard.writeText(serialized);

    // Advance copy state
    copyState.setState(nextState);

    setDisplayContent({
      message: `${message} (depth: ${depthSetting})`,
      type: "success",
      duration: 2000,
    });
  }, [activeLogs, copyState, depthSetting]);

  // Actions for action toolbar
  const depthControl: DepthControl<DepthSetting> = {
    value: depthSetting,
    options: ["str", "1", "3", "5", "10", "all"],
    onChange: (newDepth) => {
      setDepthSetting(newDepth);
      setDisplayContent({
        message: `Copy depth: ${newDepth === "str" ? "String only" : newDepth === "all" ? "Full depth" : `Max ${newDepth} levels`}`,
        type: "info",
        duration: 2000,
      });
    },
    getDescription: (v) => `Depth: ${v}`,
    getColor: () => "#10b981",
    getWidth: () => "100%",
  };

  const actionButtons: ActionButton[] = [
    {
      icon: copyState.getIcon(),
      title:
        copyState.state === 0
          ? `Copy ${activeLogs.length} logs to clipboard`
          : copyState.state === 1
            ? "Click again to copy all"
            : "Copy complete",
      variant: copyState.getVariant(),
      onClick: handleCopyLogs,
      disabled: activeLogs.length === 0,
      ...hoverMessage.getHandlers(
        `Copy ${activeLogs.length} logs (depth: ${depthSetting})`,
        "info"
      ),
    },
    {
      icon: pauseState.isPaused ? "▶️" : "⏸",
      title: pauseState.isPaused
        ? "Resume log rendering"
        : "Pause log rendering",
      variant: pauseState.isPaused ? "paused" : "default",
      onClick: () => pauseState.toggle(filteredLogs),
      ...hoverMessage.getHandlers(
        pauseState.isPaused
          ? "Resume live log updates"
          : "Pause live log updates",
        "info"
      ),
    },
    {
      icon: "🏥",
      title: "Capture health snapshot to debug logs",
      variant: "success",
      onClick: handleHealthSnapshot,
      ...hoverMessage.getHandlers(
        "Capture health snapshot and save to debug logs",
        "info"
      ),
    },
  ];

  // Truncation info
  const MAX_RENDERED = 1000;
  const shouldShowTruncation = totalLogs > MAX_RENDERED;
  const hiddenCount = totalLogs - MAX_RENDERED;

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100vw",
        height: `${panelHeight}px`,
        zIndex: Z_INDEX.DEBUG_PANEL,
      }}
    >
      <TerminalLayout height={panelHeight} isResizing={isResizing}>
        <TerminalLayoutHeader>
          <TerminalLayoutResizeHandle
            onResizeStart={handleResizeStart}
            isResizing={isResizing}
          />
        </TerminalLayoutHeader>

        {panelHeight > 0 && (
          <TerminalLayoutBody>
            <TerminalLayoutContent>
              <TerminalLayoutLogsContainer<
                DebugLogEntry & { _uniqueId: string }
              >
                containerRef={logsContainerRef}
                items={activeLogs.slice(0, MAX_RENDERED).map((log, idx) => ({
                  ...log,
                  _uniqueId: `${log.timestamp}-${log.point}-${log.sessionId}-${idx}`,
                }))}
                renderItem={(
                  log: DebugLogEntry & { _uniqueId: string },
                  index
                ) => {
                  const entry = {
                    id: index,
                    timestamp: new Date(log.timestamp).toLocaleTimeString(),
                    point: log.point,
                    message: log.message,
                    level: log.level as "info" | "warn" | "error" | undefined,
                    data: log.data,
                  };
                  return (
                    <LogEntry
                      entry={entry}
                      index={index}
                      isExpanded={expandedEntries.has(index)}
                      onToggleExpand={() => {
                        setExpandedEntries((prev) => {
                          const next = new Set(prev);
                          if (next.has(index)) {
                            next.delete(index);
                          } else {
                            next.add(index);
                          }
                          return next;
                        });
                      }}
                    />
                  );
                }}
                keyExtractor={(log: DebugLogEntry & { _uniqueId: string }) =>
                  log._uniqueId
                }
                topBanners={[
                  {
                    content: (
                      <>
                        ⏸ Paused - {pauseState.pausedItems.length} logs frozen.{" "}
                        <button
                          onClick={() => pauseState.resume()}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            textDecoration: "underline",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                          }}
                          title="Resume log rendering"
                        >
                          Click to resume
                        </button>
                      </>
                    ),
                    show: pauseState.isPaused,
                  },
                  {
                    content: (
                      <>
                        📌 Viewing snapshot at{" "}
                        {scrollFollowing.snapshotItems.length > 0
                          ? scrollFollowing.snapshotItems.length
                          : activeLogs.length}{" "}
                        logs.{" "}
                        <button
                          onClick={() => {
                            scrollFollowing.returnToFollowing();
                            setDisplayContent({
                              message: "Returned to following live logs",
                              type: "success",
                              duration: 2000,
                            });
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            textDecoration: "underline",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                          }}
                          title="Return to following live logs"
                        >
                          Return to live stream
                        </button>
                      </>
                    ),
                    show: !scrollFollowing.isFollowing && !pauseState.isPaused,
                  },
                ]}
                truncation={
                  shouldShowTruncation
                    ? {
                        hiddenCount,
                        maxRendered: MAX_RENDERED,
                        totalCount: totalLogs,
                      }
                    : undefined
                }
                virtualized={true}
                itemHeight={24}
              />
            </TerminalLayoutContent>

            <TerminalLayoutActions>
              <ActionToolbar
                depthControl={depthControl}
                actions={actionButtons}
              />
            </TerminalLayoutActions>

            <TerminalLayoutSidebar>
              <TerminalLayoutStats title="Info">
                <TerminalLayoutStatItem
                  label="Total"
                  value={totalLogs}
                  color="#10b981"
                />
                <TerminalLayoutStatItem
                  label="Filtered"
                  value={filteredCount}
                  color="#3b82f6"
                />
                <TerminalLayoutStatItem
                  label="Active"
                  value={activeLogs.length}
                  color="#f59e0b"
                />
                <TerminalLayoutStatItem
                  label="Points"
                  value={activePoints}
                  color="#60a5fa"
                />
                <TerminalLayoutStatItem
                  label="Height"
                  value={`${panelHeight}px`}
                  color="#fbbf24"
                />
              </TerminalLayoutStats>

              <TerminalLayoutShortcuts title="Shortcuts">
                <TerminalLayoutShortcut
                  keys="⌘+D"
                  description="Compact/Extended"
                />
                <TerminalLayoutShortcut keys="⌘+A" description="Select logs" />
                <TerminalLayoutShortcut keys="⌘+K" description="Clear logs" />
                <TerminalLayoutShortcut keys="Esc" description="Close panel" />
              </TerminalLayoutShortcuts>

              <div style={{ flexGrow: 1 }} />

              <TerminalLayoutResizePresets
                presets={[200, 400, 600, getMaxHeight()]}
                currentHeight={panelHeight}
                maxHeight={getMaxHeight()}
                onResize={setPanelHeight}
              />
            </TerminalLayoutSidebar>
          </TerminalLayoutBody>
        )}

        <TerminalLayoutControlPanel>
          <ControlPanel>
            {/* Debug Point Buttons - 2 rows */}
            <ControlPanelSection>
              <StatusButtonGroup
                buttons={debugPoints.map((point) => ({
                  label: point.label,
                  active: debug.isEnabled(point.key),
                  onClick: () => {
                    debug.toggle(point.key);
                    setDisplayContent({
                      message: `${debug.isEnabled(point.key) ? "Disabled" : "Enabled"} ${point.label}`,
                      type: "info",
                      duration: 1500,
                    });
                  },
                  buttonVariant: "ghost" as const,
                  buttonSize: "xs" as const,
                }))}
                theme={controlButtonTheme}
                orientation="grid"
                gridRows={2}
                gap="2px"
              />
            </ControlPanelSection>

            {/* Dependency Controls - V2 with theme */}
            <ControlPanelSection separator className="pl-4">
              <DependencyControlsV2 theme={controlButtonTheme} />
            </ControlPanelSection>

            <ControlPanelDisplaySection
              entries={[]}
              content={displayContent}
              actions={[
                ...(_uiVersion
                  ? [
                      {
                        icon: _uiVersion.toUpperCase(),
                        onClick: () => _onToggleVersion?.(),
                        backgroundColor:
                          _uiVersion === "v2" ? "#10b981" : "#3b82f6",
                        hoverBackgroundColor:
                          _uiVersion === "v2" ? "#059669" : "#2563eb",
                        color: "#ffffff",
                        title: "Toggle UI version (Cmd+Shift+D)",
                      },
                    ]
                  : []),
                {
                  icon: "🗑",
                  onClick: handleSmartClear,
                },
                {
                  icon: "✕",
                  onClick: onClose,
                  backgroundColor: "#dc2626",
                  hoverBackgroundColor: "#b91c1c",
                  color: "#ffffff",
                },
              ]}
            />
          </ControlPanel>
        </TerminalLayoutControlPanel>
      </TerminalLayout>
    </div>
  );
};

DebugsyLook.displayName = "DebugsyLook";
