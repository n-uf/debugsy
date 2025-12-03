"use client";

import {
  Banner,
  DisplayQueueProvider,
  getProgressColor as getActionProgressColor,
  IndicatorButtonGroup,
  IndicatorButtonTheme,
  LogEntry,
  PauseState,
  ScrollFollowingState,
  setProgressDisplay,
  TerminalWindow,
  TerminalWindowActions,
  TerminalWindowBody,
  TerminalWindowContent,
  TerminalWindowControlPanel,
  TerminalWindowHeader,
  TerminalWindowLogsContainer,
  TerminalWindowResizeHandle,
  TerminalWindowResizePresets,
  TerminalWindowSettings,
  TerminalWindowSidebar,
  Tray,
  TrayDisplay,
  TraySection,
  TruncationPanel,
  useClickOutside,
  useCopyState,
  useDisplayQueueContext,
  useDisplayQueueFullScoped,
  useHoverMessage,
  useKeyboardSelection,
  useLegacyDisplayCompat,
  useLogEntryCopy,
  useLogFiltering,
  usePauseState,
  useResizable,
  useScrollFollowing,
  VirtualizedList,
  Z_INDEX,
} from "@workspace/harbuz";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useRenderTracker } from "../debugsy-deps";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import { type DebugsyLookProps } from "../debugsy-look-v1/debugsy-look";
import { safeSuperjsonStringify } from "../debugsy-look-v1/ui-logs/utils/json/json-core";
import type { DebugLogEntry, DebugPoint } from "../debugsy-space";
import {
  DEBUG_POINT_CONFIG,
  getLookDebugPoints,
} from "../debugsy-space/debugsy-point";
import {
  processObjectForDisplay,
  type DepthSetting,
} from "../shared/object-depth-utils";
import { DebugsyActions } from "./debugsy-actions";
import { DebugsyShortcutsDisplay } from "./debugsy-shortcuts";
import { DebugsyStats } from "./debugsy-stats";
import { DependencyControls } from "./dependency-controls";
import { useClear } from "./use-clear";
import { useDebugsyShortcuts } from "./use-debugsy-shortcuts";

// Re-export type for external consumers
export type { DebugsyLookProps };

/**
 * DebugsyLookInternal - Core implementation
 * (Wrapped by DisplayQueueProvider in the exported component)
 */
const DebugsyLookInternal: React.FC<DebugsyLookProps> = ({
  closeOnClickOutside = false,
  _uiVersion,
  _onToggleVersion,
}) => {
  // Enhanced tracking
  useRenderTracker("DebugsyLook", {
    renderThreshold: 15,
    mountThreshold: 5,
    trackRenders: true,
    trackMounts: true,
    onExcessiveRenders: (info) =>
      console.warn("DebugsyLook excessive renders:", info),
    onExcessiveMounts: (info) =>
      console.warn("DebugsyLook excessive mounts:", info),
  });

  // Debug system integration
  useDebugsySubscription();
  const debug = useDebugsy();
  const logs = debug.getLogs();
  const onClearLogs = debug.clearLogs;

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const logsContainerRef = useRef<HTMLDivElement>(null);
  const logsOnlyRef = useRef<HTMLDivElement>(null); // For Cmd+A selection (logs only, no banners)

  // State
  const [isVisible, setIsVisible] = useState(false);
  const [isCompact, setIsCompact] = useState(true); // Compact mode (controls only) vs Extended mode (full logs)
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all"); // Depth setting for copy operations
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );
  // Local setting states (demo placeholders for now, consistent with Showcase)
  const [closeOnClickOutsideState, setCloseOnClickOutsideState] =
    useState(closeOnClickOutside);

  // Display system (NEW: context-based isolated queue)
  const { visible: displayQueue, memorized: memorizedItems } = useDisplayQueueFullScoped();
  const { configureQueue } = useDisplayQueueContext();
  // REMOVED: useDisplay() uses global state - we use scoped queue only
  const { setDisplayContent, clearDisplayContent } = useLegacyDisplayCompat(); // Scoped legacy compat

  // Configure display slots (3 rows max)
  useEffect(() => {
    configureQueue({ maxSlots: 3 });
  }, [configureQueue]);

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
      logOrder: "desc", // Logs are reversed (newest at top)
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
      // Show progress on hover for copy button
      const isCopyMessage = message.toLowerCase().includes("copy");

      if (isCopyMessage) {
        const progressValue =
          copyState.state === 0 ? 0 : copyState.state === 1 ? 50 : 100;

        // Use progress display for copy messages
        setProgressDisplay(message, progressValue, {
          type,
          color: getActionProgressColor(copyState.state),
          height: 2,
          duration: 0, // Manual clear on hover
        });
      } else {
        // Regular display for non-copy messages
        setDisplayContent({
          message,
          type,
          duration: 0,
        });
      }
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
    initialHeight: 400, // Default height when expanded
    minHeight: 0,
    maxHeight: getMaxHeight(),
  });

  // 6. Keyboard Selection Hook - Cmd+A selects only logs (after isResizing is defined)
  useKeyboardSelection({
    containerRef: logsOnlyRef as React.RefObject<HTMLElement | null>,
    enabled: isVisible && !isResizing && !isCompact,
  });

  // 7. Clear Hook - Double-action clear logic
  const { handleClear: handleSmartClear, clearConfirmation } = useClear({
    isPaused: pauseState.isPaused,
    isFollowing: scrollFollowing.isFollowing,
    onClearStorage: onClearLogs,
    onResume: () => {
      if (pauseState.isPaused) {
        pauseState.resume();
      }
      scrollFollowing.returnToFollowing();
    },
    onClearLocalState: clearLocalStateCallback ?? undefined,
    setDisplayContent, // Use scoped display from compat hook
  });

  const onClose = useCallback(() => {
    setIsVisible(false);
    setIsCompact(true); // Reset to compact for next activation
  }, []);

  // 8. Click Outside Hook - Close panel when clicking outside
  useClickOutside(
    containerRef,
    onClose,
    isVisible && !isResizing && closeOnClickOutsideState && !isCompact
  );

  // 9. Keyboard Shortcuts Hook - Always active (especially ⌘+D for global toggle)
  const { shortcuts } = useDebugsyShortcuts({
    onToggleCompactExtended: () => {
      // First activation: show compact (controls only)
      if (!isVisible) {
        setIsVisible(true);
        setIsCompact(true);
        return;
      }

      // Once visible, toggle between compact and extended
      const nextIsCompact = !isCompact;
      setIsCompact(nextIsCompact);

      setDisplayContent({
        message: `Mode: ${nextIsCompact ? "Compact" : "Extended"}`,
        type: "info",
        duration: 1500,
      });
    },
    onClear: handleSmartClear,
    onClose,
    enabled: isVisible && !isResizing,
  });

  // Calculate stats
  const debugState = debug.getDebugState();
  const enabledPointsSet = debugState?.enabled; // This is a Set<DebugPoint>
  const activePoints =
    enabledPointsSet instanceof Set ? enabledPointsSet.size : 0; // Count of enabled debug points
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
  const controlButtonTheme: IndicatorButtonTheme = {
    style: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  };

  // Truncation info
  const MAX_RENDERED = 1000;
  const shouldShowTruncation = totalLogs > MAX_RENDERED;
  const hiddenCount = totalLogs - MAX_RENDERED;

  // Truncation handlers (matching Showcase pattern)
  const handleCopyAllLogs = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setDisplayContent({
      message: `Copied all ${totalLogs} logs to clipboard`,
      type: "success",
      duration: 2000,
    });
  }, [logs, totalLogs]);

  const handleClearAllLogs = useCallback(() => {
    onClearLogs();
    setDisplayContent({
      message: "All logs cleared",
      type: "success",
      duration: 2000,
    });
  }, [onClearLogs]);

  // Long-press copy handler (generic hook from Harbuz UI with custom formatter)
  const handleLongPressCopyLog = useLogEntryCopy({
    onSuccess: (message) =>
      setDisplayContent({ message, type: "success", duration: 2000 }),
    onError: (message) =>
      setDisplayContent({ message, type: "error", duration: 2000 }),
    formatter: useCallback(
      (entry: {
        id: number;
        timestamp: string;
        point: string;
        message: string;
        data?: unknown;
      }) => {
        // Find the original log entry for depth processing
        const originalLog = activeLogs.find(
          (log) => log.point === entry.point && log.message === entry.message
        );

        if (!originalLog?.data) {
          // No data, use simple format
          return `[${entry.timestamp}] ${entry.point}: ${entry.message}`;
        }

        // Apply depth setting and format with safeSuperjsonStringify
        const processedData = processObjectForDisplay(
          originalLog.data,
          depthSetting
        );
        const dataStr = ` | ${safeSuperjsonStringify(processedData)}`;
        return `[${entry.timestamp}] ${entry.point}: ${entry.message}${dataStr}`;
      },
      [activeLogs, depthSetting]
    ),
  });

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
        height: isCompact ? "auto" : `${panelHeight}px`,
        zIndex: Z_INDEX.DEBUG_PANEL,
      }}
    >
      <TerminalWindow
        bodyHeight={panelHeight}
        isResizing={isResizing}
        isCompact={isCompact}
      >
        {!isCompact && (
          <>
            <TerminalWindowHeader>
              <TerminalWindowResizeHandle
                onResizeStart={handleResizeStart}
                isResizing={isResizing}
              />
            </TerminalWindowHeader>

            <TerminalWindowBody>
              <TerminalWindowContent>
                <TerminalWindowLogsContainer<
                  DebugLogEntry & { _uniqueId: string }
                >
                  containerRef={logsContainerRef}
                  logsOnlyRef={logsOnlyRef}
                  items={[...activeLogs]
                    .slice(-MAX_RENDERED)
                    .reverse()
                    .map((log, idx) => ({
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
                        onLongPress={handleLongPressCopyLog}
                      />
                    );
                  }}
                  keyExtractor={(log: DebugLogEntry & { _uniqueId: string }) =>
                    log._uniqueId
                  }
                  scrollFollowingState={
                    scrollFollowing as unknown as ScrollFollowingState<
                      DebugLogEntry & { _uniqueId: string }
                    >
                  }
                  pauseState={
                    pauseState as unknown as PauseState<
                      DebugLogEntry & { _uniqueId: string }
                    >
                  }
                  onDisplayMessage={(message, type) => {
                    setDisplayContent({
                      message,
                      type: type ?? "info",
                      duration: 2000,
                    });
                  }}
                  BannerComponent={Banner}
                  truncationThreshold={1000}
                  maxRendered={MAX_RENDERED}
                  totalCount={totalLogs}
                  topBanners={[
                    {
                      show: clearConfirmation,
                      content: (
                        <Banner
                          emoji="🔄"
                          message="Storage cleared. Press Clear again to clear snapshot and resume following."
                          variant="warning"
                          onClick={handleSmartClear}
                          title="Click to complete clear and resume"
                        />
                      ),
                    },
                  ]}
                  truncation={{
                    onCopyAll: handleCopyAllLogs,
                    onClearAll: handleClearAllLogs,
                  }}
                  TruncationPanel={TruncationPanel}
                  VirtualizedList={VirtualizedList}
                  itemHeight={24}
                  virtualizationThreshold={50}
                  overscan={5}
                  emptyMessage={`No debug logs yet.
Enable debug points and interact with the surface to see logs here.`}
                />
              </TerminalWindowContent>

              <TerminalWindowActions>
                <DebugsyActions
                  activeLogs={activeLogs}
                  filteredLogs={filteredLogs}
                  copyState={copyState}
                  pauseState={pauseState}
                  scrollFollowing={scrollFollowing}
                  hoverMessage={hoverMessage}
                  depthSetting={depthSetting}
                  onDepthChange={setDepthSetting}
                />
              </TerminalWindowActions>

              <TerminalWindowSidebar>
                <DebugsyStats
                  totalLogs={totalLogs}
                  filteredLogs={filteredCount}
                  activeLogs={activeLogs.length}
                  activePoints={activePoints}
                  panelHeight={panelHeight}
                />

                <DebugsyShortcutsDisplay shortcuts={shortcuts} />

                <TerminalWindowResizePresets
                  presets={[200, 400, 600, getMaxHeight()]}
                  currentHeight={panelHeight}
                  maxHeight={getMaxHeight()}
                  onResize={setPanelHeight}
                />

                {/* Settings Section */}
                <TerminalWindowSettings noBorder={true}>
                  <IndicatorButtonGroup
                    orientation="horizontal"
                    wrap={true}
                    justify="flex-start"
                    align="center"
                    buttons={[
                      {
                        label: "Click Outside",
                        indicatorType: "toggle" as const,
                        active: closeOnClickOutsideState,
                        onClick: () => {
                          setCloseOnClickOutsideState(
                            !closeOnClickOutsideState
                          );
                          setDisplayContent({
                            message: `Click outside: ${!closeOnClickOutsideState ? "ON" : "OFF"}`,
                            type: "info",
                            duration: 1500,
                          });
                        },
                        buttonVariant: "ghost" as const,
                        buttonSize: "xxs" as const,
                        title: "Toggle click outside to close",
                      },
                    ]}
                    theme={{
                      color: "#d1d5db",
                      style: {
                        fontFamily: "monospace",
                        fontWeight: "bold",
                        borderRadius: "3px",
                        padding: "3px 6px",
                      },
                    }}
                    gap="3px"
                  />
                </TerminalWindowSettings>

                <div style={{ flexGrow: 1 }} />
              </TerminalWindowSidebar>
            </TerminalWindowBody>
          </>
        )}

        <TerminalWindowControlPanel>
          <Tray>
            {/* Debug Point Buttons - 2 rows */}
            <TraySection>
              <IndicatorButtonGroup
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
                  buttonSize: "xxs" as const,
                }))}
                theme={controlButtonTheme}
                orientation="grid"
                gridRows={2}
                gap="2px"
              />
            </TraySection>

            {/* Dependency Controls */}
            <TraySection separator className="pl-4">
              <DependencyControls theme={controlButtonTheme} />
            </TraySection>

            <TrayDisplay
              queueItems={displayQueue}
              memorizedItems={memorizedItems}
              entries={
                isCompact
                  ? // COMPACT MODE: Show recent logs (3 entries)
                    [...filteredLogs]
                      .reverse()
                      .slice(0, 3)
                      .map((log, idx) => ({
                        id: idx,
                        timestamp: new Date(log.timestamp).toLocaleTimeString(
                          "en-US",
                          {
                            hour12: false,
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit",
                          }
                        ),
                        emoji:
                          DEBUG_POINT_CONFIG[log.point as DebugPoint]?.emoji ??
                          "📝",
                        message: log.message,
                      }))
                  : // FULL MODE: Show status info (matching V1 behavior)
                    [
                      {
                        id: 0,
                        timestamp: "",
                        emoji: "🚧",
                        message: `Debugsy  ${activePoints} points • ${totalLogs} logs`,
                      },
                    ]
              }
              emptyMessage={
                isCompact
                  ? "No debug logs yet. Enable debug points and interact."
                  : "" // Full mode: empty message not used (status entry always present)
              }
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
                  icon: isCompact ? "⬇️" : "⬆️",
                  onClick: () => {
                    const nextIsCompact = !isCompact;
                    setIsCompact(nextIsCompact);
                    setDisplayContent({
                      message: `Mode: ${nextIsCompact ? "Compact" : "Extended"}`,
                      type: "info",
                      duration: 1500,
                    });
                  },
                  title: isCompact
                    ? "Switch to Extended mode (⌘+D)"
                    : "Switch to Compact mode (⌘+D)",
                  backgroundColor: "#64748b",
                  hoverBackgroundColor: "#475569",
                  color: "#ffffff",
                },
                {
                  icon: clearConfirmation ? "🔄" : "🗑️",
                  onClick: handleSmartClear,
                  title: clearConfirmation
                    ? "Click again to clear snapshot and resume"
                    : "Clear logs (Cmd+K)",
                  backgroundColor: clearConfirmation ? "#f59e0b" : "#ffffff",
                  hoverBackgroundColor: clearConfirmation
                    ? "#d97706"
                    : "#e5e7eb",
                  color: clearConfirmation ? "#ffffff" : "#4b5563",
                },
                {
                  icon: "✕",
                  onClick: onClose,
                  title: "Close panel (Esc)",
                  backgroundColor: "#dc2626",
                  hoverBackgroundColor: "#b91c1c",
                  color: "#ffffff",
                },
              ]}
            />
          </Tray>
        </TerminalWindowControlPanel>
      </TerminalWindow>
    </div>
  );
};

DebugsyLookInternal.displayName = "DebugsyLookInternal";

/**
 * DebugsyLook - Harbuz-based implementation with isolated display queue
 *
 * Full implementation using @workspace/harbuz UI components.
 * Modern TerminalLayout structure with comprehensive debugging features.
 *
 * Wrapped with DisplayQueueProvider to ensure display messages are isolated
 * from other components (e.g., Showcase).
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = (props) => {
  return (
    <DisplayQueueProvider>
      <DebugsyLookInternal {...props} />
    </DisplayQueueProvider>
  );
};

DebugsyLook.displayName = "DebugsyLook";
