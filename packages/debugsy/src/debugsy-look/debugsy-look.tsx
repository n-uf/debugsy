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
  safeSuperjsonStringify,
  VirtualizedList,
  Z_INDEX,
} from "@workspace/harbuz";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useRenderTracker } from "../debugsy-deps";
import { getPointEmoji } from "../config";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import type { DebugLogEntry, DebugPoint } from "../debugsy-space";
import {
  processObjectForDisplay,
  type DepthSetting,
} from "../shared/object-depth-utils";
import { DebugsyActions } from "./debugsy-actions";
import { DebugsyShortcutsDisplay } from "./debugsy-shortcuts";
import { DebugsyStats } from "./debugsy-stats";
import { DependencyControls } from "./dependency-controls";
import { ModuleNav, SYSTEM_MODULE_KEY } from "./module-nav";
import { TagFilter, useDiscoveredTags } from "./tag-filter";
import { useClear } from "./use-clear";
import { useDebugsyShortcuts } from "./use-debugsy-shortcuts";

export interface DebugsyLookProps {
  closeOnClickOutside?: boolean;
}

/**
 * DebugsyLookInternal - Core implementation
 * (Wrapped by DisplayQueueProvider in the exported component)
 */
const DebugsyLookInternal: React.FC<DebugsyLookProps> = ({
  closeOnClickOutside = false,
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
  const [isCompact, setIsCompact] = useState(true);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all"); // Depth setting for copy operations
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagSearch, setTagSearch] = useState("");
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
  const pointFilteredLogs = useLogFiltering({
    items: logs,
    getPoint: (log) => log.point,
    isEnabled: (point) => debug.isEnabled(point as DebugPoint),
    alwaysInclude: [],
  });

  // 3b. Discover tags from actual log records (arrival order)
  const knownTags = useDiscoveredTags(pointFilteredLogs);

  // 3c. Tag Filtering — apply after point filtering
  const filteredLogs = useMemo(() => {
    if (selectedTags.size === 0) return pointFilteredLogs;
    return pointFilteredLogs.filter(
      (log) => log.tags?.some((t: string) => selectedTags.has(t)) ?? false
    );
  }, [pointFilteredLogs, selectedTags]);

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

  const handleToggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const handleClearTags = useCallback(() => {
    setSelectedTags(new Set());
  }, []);

  const onClose = useCallback(() => {
    setIsVisible(false);
    setIsCompact(true);
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
                <TagFilter
                  activeTags={selectedTags}
                  knownTags={knownTags}
                  onToggleTag={handleToggleTag}
                  onClearAll={handleClearTags}
                  searchQuery={tagSearch}
                  onSearchChange={setTagSearch}
                />

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
            {/* Debug Point Buttons — Module Navigation */}
            <TraySection>
              <ModuleNav
                theme={controlButtonTheme}
                onDisplayMessage={(msg) =>
                  setDisplayContent({ message: msg, type: "info", duration: 1500 })
                }
                onModuleSelect={setActiveModule}
              />
            </TraySection>

            {/* Dependency Controls — visible at root or inside the system module */}
            {(activeModule === null || activeModule === SYSTEM_MODULE_KEY) && (
              <TraySection separator className="pl-4">
                <DependencyControls theme={controlButtonTheme} />
              </TraySection>
            )}

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
                        emoji: getPointEmoji(log.point),
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
                ...(typeof globalThis !== "undefined" &&
                typeof (globalThis as Record<string, unknown>)
                  .__toggleRQDevtools === "function"
                  ? [
                      {
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path fill="#FF4154" d="M6.93 13.688a.343.343 0 0 1 .468.132l.063.106q.72 1.277 1.5 2.426a36 36 0 0 0 2.074 2.742a.346.346 0 0 1-.039.484l-.074.066c-2.543 2.223-4.191 2.665-4.953 1.333c-.746-1.305-.477-3.672.808-7.11a.34.34 0 0 1 .153-.18M17.75 16.3a.34.34 0 0 1 .395.27l.02.1q.942 4.93-1.325 4.93c-1.48 0-3.36-1.402-5.649-4.203a.33.33 0 0 1-.074-.222c0-.188.156-.34.344-.34h.121a33 33 0 0 0 2.809-.098q1.606-.128 3.359-.437m.871-6.977a.353.353 0 0 1 .445-.21l.102.034q4.895 1.665 3.719 3.664q-1.148 1.957-6.684 2.848a.36.36 0 0 1-.238-.047a.343.343 0 0 1-.125-.476l.062-.106a34 34 0 0 0 1.367-2.523q.717-1.484 1.352-3.184M7.797 8.34a.36.36 0 0 1 .238.047a.343.343 0 0 1 .125.476l-.062.106a34 34 0 0 0-1.367 2.523q-.717 1.483-1.352 3.184a.353.353 0 0 1-.445.21l-.102-.034q-4.895-1.666-3.719-3.664Q2.261 9.23 7.797 8.34m5.281-3.984c2.543-2.223 4.192-2.664 4.953-1.332q1.12 1.954-.808 7.109a.34.34 0 0 1-.153.18a.343.343 0 0 1-.468-.133l-.063-.106a35 35 0 0 0-1.5-2.426a36 36 0 0 0-2.074-2.742a.346.346 0 0 1 .039-.484ZM7.285 2.274q2.22 0 5.649 4.203a.35.35 0 0 1 .078.218a.35.35 0 0 1-.348.344l-.117-.004a35 35 0 0 0-2.809.102a36 36 0 0 0-3.363.437a.343.343 0 0 1-.394-.273l-.02-.098q-.944-4.929 1.324-4.93"/>
                            <path fill="#002C4B" d="m10.156 8.086h3.688a.64.64 0 0 1 .55.316l1.848 3.22a.64.64 0 0 1 0 .628l-1.847 3.223a.64.64 0 0 1-.551.316h-3.688a.63.63 0 0 1-.547-.316L7.758 12.25a.64.64 0 0 1 0-.629L9.61 8.402a.63.63 0 0 1 .546-.316m3.23.793a.64.64 0 0 1 .552.316l1.39 2.426a.64.64 0 0 1 0 .629l-1.39 2.43a.64.64 0 0 1-.551.316h-2.774a.63.63 0 0 1-.546-.316l-1.395-2.43a.64.64 0 0 1 0-.629l1.395-2.426a.63.63 0 0 1 .546-.316Zm-.491.867h-1.79a.62.62 0 0 0-.546.316l-.899 1.56a.64.64 0 0 0 0 .628l.899 1.563a.63.63 0 0 0 .547.316h1.789a.63.63 0 0 0 .547-.316l.898-1.563a.64.64 0 0 0 0-.629l-.898-1.558a.62.62 0 0 0-.547-.317m-.477.828c.227 0 .438.121.547.317l.422.73a.63.63 0 0 1 0 .629l-.422.734a.63.63 0 0 1-.547.317h-.836a.63.63 0 0 1-.547-.317l-.422-.734a.63.63 0 0 1 0-.629l.422-.73a.63.63 0 0 1 .547-.317zm-.418.817a.55.55 0 0 0-.473.273a.55.55 0 0 0 0 .547a.54.54 0 0 0 .473.27a.54.54 0 0 0 .473-.27a.55.55 0 0 0 0-.547a.55.55 0 0 0-.473-.273"/>
                            <path fill="#FF4154" d="M18.982 7.75c.39-1.894.476-3.344.222-4.398c-.148-.63-.422-1.137-.84-1.508c-.441-.39-1-.582-1.625-.582c-1.035 0-2.12.472-3.281 1.367a15 15 0 0 0-1.473 1.316a1 1 0 0 0-.136-.144c-1.446-1.285-2.66-2.082-3.7-2.39c-.617-.184-1.195-.2-1.722-.024c-.559.187-1.004.574-1.317 1.117c-.515.894-.652 2.074-.46 3.527q.119.885.402 1.934a1 1 0 0 0-.215.047C3.008 8.62 1.71 9.269.926 10.015c-.465.442-.77.938-.883 1.481c-.113.578 0 1.156.312 1.7c.516.894 1.465 1.597 2.817 2.155q.813.334 1.844.61a1 1 0 0 0-.07.226c-.391 1.891-.477 3.344-.223 4.395c.148.629.425 1.14.84 1.508c.44.39 1 .582 1.625.582c1.035 0 2.12-.473 3.28-1.364q.715-.556 1.489-1.336a1.2 1.2 0 0 0 .195.227c1.446 1.285 2.66 2.082 3.7 2.39c.617.184 1.195.2 1.722.024c.559-.187 1.004-.574 1.317-1.117c.515-.894.652-2.074.46-3.527a15 15 0 0 0-.425-2.012a1.2 1.2 0 0 0 .238-.047c1.828-.61 3.125-1.258 3.91-2.004c.465-.441.77-.937.883-1.48c.113-.578 0-1.157-.312-1.7c-.516-.894-1.465-1.597-2.817-2.156a15 15 0 0 0-1.906-.625a1 1 0 0 0 .059-.195"/>
                          </svg>
                        ),
                        onClick: () => {
                          const fn = (globalThis as Record<string, unknown>)
                            .__toggleRQDevtools as (() => void) | undefined;
                          fn?.();
                        },
                        title: "Toggle React Query DevTools",
                        backgroundColor: (globalThis as Record<string, unknown>)
                          .__isRQDevtoolsOpen
                          ? "#e8590c"
                          : "#374151",
                        hoverBackgroundColor: "#e8590c",
                        color: "#ffffff",
                      },
                    ]
                  : []),
                ...(typeof globalThis !== "undefined" &&
                typeof (globalThis as Record<string, unknown>)
                  .__toggleNextDevIndicator === "function"
                  ? [
                      {
                        icon: (
                          <svg width="14" height="14" viewBox="0 0 180 180" fill="none">
                            <circle cx="90" cy="90" r="90" fill="black"/>
                            <path d="M149.508 157.52L69.142 54H54v71.97h12.114V69.384l73.885 95.461A90.09 90.09 0 01149.508 157.52z" fill="url(#dbg-nGrad)"/>
                            <rect x="115" y="54" width="12" height="72" fill="url(#dbg-nGrad2)"/>
                            <defs>
                              <linearGradient id="dbg-nGrad" x1="109" y1="116.5" x2="144.5" y2="160.5" gradientUnits="userSpaceOnUse">
                                <stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/>
                              </linearGradient>
                              <linearGradient id="dbg-nGrad2" x1="121" y1="54" x2="120.799" y2="106.875" gradientUnits="userSpaceOnUse">
                                <stop stopColor="white"/><stop offset="1" stopColor="white" stopOpacity="0"/>
                              </linearGradient>
                            </defs>
                          </svg>
                        ),
                        onClick: () => {
                          const fn = (globalThis as Record<string, unknown>)
                            .__toggleNextDevIndicator as (() => void) | undefined;
                          fn?.();
                        },
                        title: "Toggle Next.js Dev Indicator",
                        backgroundColor: (globalThis as Record<string, unknown>)
                          .__isNextDevIndicatorOpen
                          ? "#ffffff"
                          : "#d1d5db",
                        hoverBackgroundColor: "#ffffff",
                        color: "#000000",
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
