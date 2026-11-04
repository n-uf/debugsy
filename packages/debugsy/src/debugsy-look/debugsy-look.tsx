"use client";

import {
  DebugsyStyles,
  DisplayQueueProvider,
  LogEntry,
  LogsContainer,
  Notice,
  PauseState,
  safeSuperjsonStringify,
  ScrollFollowingState,
  SidebarSection,
  setProgressDisplay,
  Tray,
  TrayDisplay,
  TraySection,
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
  Window,
  WindowBody,
  WindowContent,
  WindowControl,
  WindowEdge,
  WindowRail,
  WindowSidebar,
  Word,
  Z_INDEX,
  type DisplayAction,
} from "../ui";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { getPointEmoji } from "../config";
import { useRenderTracker } from "../debugsy-deps";
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
import { TagFilter, useDiscoveredTags, type TagFilterMode } from "./tag-filter";
import { useClear } from "./use-clear";
import { useDebugsyShortcuts } from "./use-debugsy-shortcuts";

export interface DebugsyLookProps {
  closeOnClickOutside?: boolean;
  /**
   * Initial visibility state for the panel.
   * Default `false` (hidden until ⌘+D).
   * Pass `true` to render the panel mounted-and-visible (e.g. for a homepage
   * marketing demo where the panel is a permanent fixture).
   */
  initialVisible?: boolean;
  /**
   * Initial compact mode.
   * Default `true` (control-tray only).
   * Pass `false` together with `initialVisible` to start in extended mode
   * (full body + sidebar + tray).
   */
  initialIsCompact?: boolean;
}

/** Copy state 0 / 1 / 2 as a progress value */
const COPY_PROGRESS = [0, 50, 100] as const;

/**
 * DebugsyLookInternal - Core implementation
 * (Wrapped by DisplayQueueProvider in the exported component)
 */
const DebugsyLookInternal: React.FC<DebugsyLookProps> = ({
  closeOnClickOutside = false,
  initialVisible = false,
  initialIsCompact = true,
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
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [isCompact, setIsCompact] = useState(initialIsCompact);
  const [activeModule, setActiveModule] = useState<string | null>(null);
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all"); // Depth setting for copy operations
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set(),
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [tagSearch, setTagSearch] = useState("");
  const [tagMode, setTagMode] = useState<TagFilterMode>("and");
  const [closeOnClickOutsideState, setCloseOnClickOutsideState] =
    useState(closeOnClickOutside);

  // Display system (context-based isolated queue)
  const { visible: displayQueue, memorized: memorizedItems } =
    useDisplayQueueFullScoped();
  const { configureQueue } = useDisplayQueueContext();
  const { setDisplayContent, clearDisplayContent } = useLegacyDisplayCompat(); // Scoped legacy compat

  // Configure display slots (3 rows max)
  useEffect(() => {
    configureQueue({ maxSlots: 3 });
  }, [configureQueue]);

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
  const { tags: knownTags, refresh: refreshTags } =
    useDiscoveredTags(pointFilteredLogs);

  // 3c. Tag Filtering — apply after point filtering (AND/OR mode)
  const filteredLogs = useMemo(() => {
    if (selectedTags.size === 0) return pointFilteredLogs;
    if (tagMode === "or") {
      return pointFilteredLogs.filter(
        (log) => log.tags?.some((t: string) => selectedTags.has(t)) ?? false,
      );
    }
    const required = [...selectedTags];
    return pointFilteredLogs.filter((log) =>
      required.every((t) => log.tags?.includes(t) ?? false),
    );
  }, [pointFilteredLogs, selectedTags, tagMode]);

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
        // Use progress display for copy messages
        setProgressDisplay(message, COPY_PROGRESS[copyState.state], {
          type,
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
  //
  // `bodyHeight` (= `panelHeight`) is the height of the LOG VIEWPORT inside
  // the window — the window adds its resize edge above the body and the
  // control tray below it, both with intrinsic heights summing to about
  // `SHELL_CHROME_PX`. To keep the WHOLE panel within the visible window
  // (so the resize edge stays reachable at the top), we cap `panelHeight` at
  // `window.innerHeight - SHELL_CHROME_PX`.
  //
  // Tracking `window.innerHeight` via a `resize` listener (rather than
  // calling it in render and capturing a stale snapshot) lets the cap follow
  // browser-window resizes.
  const SHELL_CHROME_PX = 80; // resize edge (~10) + control tray (~60)
  const [maxPanelHeight, setMaxPanelHeight] = useState<number>(() =>
    typeof window !== "undefined"
      ? Math.max(0, window.innerHeight - SHELL_CHROME_PX)
      : 800,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const update = (): void =>
      setMaxPanelHeight(Math.max(0, window.innerHeight - SHELL_CHROME_PX));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const {
    height: panelHeight,
    setHeight: setPanelHeight,
    isResizing,
    handleResizeStart,
  } = useResizable({
    initialHeight: 400, // Default height when expanded
    minHeight: 0,
    maxHeight: maxPanelHeight,
  });

  // Publish the panel's *rendered* height as `--debugsy-panel-h` on
  // `documentElement` so the host page can reserve the matching footprint:
  //
  //   .static-area { height: calc(100dvh - var(--debugsy-panel-h, 400px)); }
  //
  // We observe the window element, not `containerRef` (the wrapper): the
  // window is `position: absolute; bottom: 0` inside the wrapper, so it does
  // not contribute to the wrapper's own height. A `ResizeObserver` covers
  // compact mode, drag resizes and any programmatic height change.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const wrapper = containerRef.current;
    if (!wrapper) return;
    const shell = wrapper.querySelector<HTMLElement>(".dbg-window");
    if (!shell) return;
    const root = document.documentElement;
    const apply = (): void => {
      root.style.setProperty("--debugsy-panel-h", `${shell.offsetHeight}px`);
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(shell);
    return () => {
      ro.disconnect();
      root.style.removeProperty("--debugsy-panel-h");
    };
  }, [isVisible]);

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
    isVisible && !isResizing && closeOnClickOutsideState && !isCompact,
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

  // Truncation info
  const MAX_RENDERED = 1000;

  // Truncation handlers
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

  // Long-press copy handler (with the copy depth applied)
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
          (log) => log.point === entry.point && log.message === entry.message,
        );

        if (!originalLog?.data) {
          // No data, use simple format
          return `[${entry.timestamp}] ${entry.point}: ${entry.message}`;
        }

        // Apply depth setting and format with safeSuperjsonStringify
        const processedData = processObjectForDisplay(
          originalLog.data,
          depthSetting,
        );
        const dataStr = ` | ${safeSuperjsonStringify(processedData)}`;
        return `[${entry.timestamp}] ${entry.point}: ${entry.message}${dataStr}`;
      },
      [activeLogs, depthSetting],
    ),
  });

  if (!isVisible) {
    return null;
  }

  const globals = globalThis as Record<string, unknown>;
  const toggleCompact = (): void => {
    const nextIsCompact = !isCompact;
    setIsCompact(nextIsCompact);
    setDisplayContent({
      message: `Mode: ${nextIsCompact ? "Compact" : "Extended"}`,
      type: "info",
      duration: 1500,
    });
  };

  const trayActions: DisplayAction[] = [
    ...(typeof globals.__toggleRQDevtools === "function"
      ? [
          {
            label: "RQ",
            onClick: () => (globals.__toggleRQDevtools as () => void)(),
            title: "Toggle React Query DevTools",
            active: Boolean(globals.__isRQDevtoolsOpen),
          },
        ]
      : []),
    ...(typeof globals.__toggleNextDevIndicator === "function"
      ? [
          {
            label: "Next",
            onClick: () => (globals.__toggleNextDevIndicator as () => void)(),
            title: "Toggle Next.js Dev Indicator",
            active: Boolean(globals.__isNextDevIndicatorOpen),
          },
        ]
      : []),
    {
      label: isCompact ? "Expand" : "Compact",
      onClick: toggleCompact,
      title: isCompact
        ? "Switch to Extended mode (⌘+D)"
        : "Switch to Compact mode (⌘+D)",
      tone: "led",
    },
    {
      label: clearConfirmation ? "Clear 2" : "Clear",
      onClick: handleSmartClear,
      title: clearConfirmation
        ? "Click again to clear snapshot and resume"
        : "Clear logs (⌘+K)",
      tone: clearConfirmation ? "warn" : undefined,
    },
    {
      label: "Close",
      onClick: onClose,
      title: "Close panel (Esc)",
      tone: "caution",
    },
  ];

  const presets = [200, 400, 600, maxPanelHeight];

  return (
    <div
      ref={containerRef}
      className="dbg-root"
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        width: "100vw",
        // `height: auto` lets the wrapper hug the window's rendered size.
        height: "auto",
        zIndex: Z_INDEX.DEBUG_PANEL,
      }}
    >
      <DebugsyStyles />
      <Window bodyHeight={panelHeight} isResizing={isResizing} isCompact={isCompact}>
        {!isCompact && (
          <>
            <WindowEdge onResizeStart={handleResizeStart} isResizing={isResizing} />

            <WindowBody>
              <WindowContent>
                <LogsContainer<DebugLogEntry & { _uniqueId: string }>
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
                    index,
                  ) => {
                    const entry = {
                      id: index,
                      timestamp: new Date(log.timestamp).toLocaleTimeString(),
                      point: log.point,
                      message: log.message,
                      level: log.level as "info" | "warn" | "error" | undefined,
                      data: log.data,
                      tags: log.tags,
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
                        onTagClick={handleToggleTag}
                        activeTags={selectedTags}
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
                  truncationThreshold={1000}
                  maxRendered={MAX_RENDERED}
                  totalCount={totalLogs}
                  topBanners={[
                    {
                      show: clearConfirmation,
                      content: (
                        <Notice
                          tone="warn"
                          onClick={handleSmartClear}
                          title="Click to complete clear and resume"
                        >
                          Storage cleared. Press Clear again to clear the
                          snapshot and resume following.
                        </Notice>
                      ),
                    },
                  ]}
                  truncation={{
                    onCopyAll: handleCopyAllLogs,
                    onClearAll: handleClearAllLogs,
                  }}
                  itemHeight={24}
                  virtualizationThreshold={50}
                  overscan={5}
                  emptyMessage={`No debug logs yet.
Enable debug points and interact with the surface to see logs here.`}
                />
              </WindowContent>

              <WindowRail>
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
              </WindowRail>

              <WindowSidebar>
                {knownTags.length > 0 && (
                  <SidebarSection title="Tags">
                    <TagFilter
                      activeTags={selectedTags}
                      knownTags={knownTags}
                      onToggleTag={handleToggleTag}
                      onClearAll={handleClearTags}
                      searchQuery={tagSearch}
                      onSearchChange={setTagSearch}
                      mode={tagMode}
                      onModeChange={setTagMode}
                      onRefresh={refreshTags}
                    />
                  </SidebarSection>
                )}

                <DebugsyStats
                  totalLogs={totalLogs}
                  filteredLogs={filteredCount}
                  activeLogs={activeLogs.length}
                  activePoints={activePoints}
                  panelHeight={panelHeight}
                />

                <DebugsyShortcutsDisplay shortcuts={shortcuts} />

                <SidebarSection title="Height">
                  <div className="dbg-presets">
                    {presets.map((height, i) => {
                      const isMax = i === presets.length - 1;
                      return (
                        <Word
                          key={isMax ? "max" : height}
                          size="sm"
                          pill
                          active={panelHeight === height}
                          onClick={() => setPanelHeight(Math.min(height, maxPanelHeight))}
                          title={`Resize panel to ${height}px`}
                        >
                          {isMax ? "Max" : height}
                        </Word>
                      );
                    })}
                  </div>
                </SidebarSection>

                <SidebarSection title="Settings" noBorder>
                  <Word
                    size="sm"
                    lamp={closeOnClickOutsideState ? "on" : "off"}
                    active={closeOnClickOutsideState}
                    ariaPressed={closeOnClickOutsideState}
                    onClick={() => {
                      setCloseOnClickOutsideState(!closeOnClickOutsideState);
                      setDisplayContent({
                        message: `Click outside: ${!closeOnClickOutsideState ? "ON" : "OFF"}`,
                        type: "info",
                        duration: 1500,
                      });
                    }}
                    title="Toggle click outside to close"
                  >
                    Click outside closes
                  </Word>
                </SidebarSection>
              </WindowSidebar>
            </WindowBody>
          </>
        )}

        <WindowControl>
          <Tray>
            {/* Debug point words — module navigation */}
            <TraySection>
              <ModuleNav
                onDisplayMessage={(msg) =>
                  setDisplayContent({
                    message: msg,
                    type: "info",
                    duration: 1500,
                  })
                }
                onModuleSelect={setActiveModule}
              />
            </TraySection>

            {/* Dependency controls — at the root or inside the system module */}
            {(activeModule === null || activeModule === SYSTEM_MODULE_KEY) && (
              <TraySection separator>
                <DependencyControls />
              </TraySection>
            )}

            <TrayDisplay
              queueItems={displayQueue}
              memorizedItems={memorizedItems}
              entries={
                isCompact
                  ? // COMPACT MODE: recent logs (3 entries)
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
                          },
                        ),
                        emoji: getPointEmoji(log.point),
                        message: log.message,
                      }))
                  : // FULL MODE: status line
                    [
                      {
                        id: 0,
                        timestamp: "",
                        emoji: "",
                        message: `debugsy · ${activePoints} points · ${totalLogs} logs`,
                      },
                    ]
              }
              emptyMessage={
                isCompact
                  ? "No debug logs yet. Enable debug points and interact."
                  : "" // Full mode: empty message not used (status entry always present)
              }
              actions={trayActions}
            />
          </Tray>
        </WindowControl>
      </Window>
    </div>
  );
};

DebugsyLookInternal.displayName = "DebugsyLookInternal";

/**
 * DebugsyLook - the panel, with an isolated display queue.
 *
 * Styles itself (kavun's look as a scoped `dbg-` stylesheet), so the app
 * needs no CSS import and no Tailwind.
 *
 * Wrapped with DisplayQueueProvider to ensure display messages are isolated
 * from other components.
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = (props) => {
  return (
    <DisplayQueueProvider>
      <DebugsyLookInternal {...props} />
    </DisplayQueueProvider>
  );
};

DebugsyLook.displayName = "DebugsyLook";
