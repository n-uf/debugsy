"use client";

import {
  Banner,
  clearDisplayContent,
  ControlPanel,
  ControlPanelDisplaySection,
  ControlPanelSection,
  IndicatorButtonGroup,
  IndicatorButtonTheme,
  LogEntry,
  setDisplayContent,
  TerminalLayout,
  TerminalLayoutActions,
  TerminalLayoutBody,
  TerminalLayoutContent,
  TerminalLayoutControlPanel,
  TerminalLayoutHeader,
  TerminalLayoutLogsContainer,
  TerminalLayoutResizeHandle,
  TerminalLayoutResizePresets,
  TerminalLayoutSidebar,
  TruncationPanel,
  useClickOutside,
  useCopyState,
  useDisplay,
  useHoverMessage,
  useKeyboardSelection,
  useLogFiltering,
  usePauseState,
  useResizable,
  useScrollFollowing,
  VirtualizedList,
  Z_INDEX,
} from "@workspace/harbuz";
import React, { useCallback, useRef, useState } from "react";

import { useRenderTracker } from "../debugsy-deps";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import { type DebugsyLookProps } from "../debugsy-look-v1/debugsy-look";
import type { DebugLogEntry, DebugPoint } from "../debugsy-space";
import {
  DEBUG_POINT_CONFIG,
  getLookDebugPoints,
} from "../debugsy-space/debugsy-point";
import { DebugsyActions } from "./debugsy-actions";
import { DebugsyShortcutsDisplay } from "./debugsy-shortcuts";
import { DebugsyStats } from "./debugsy-stats";
import { DependencyControls } from "./dependency-controls";
import { useClear } from "./use-clear";
import { useDebugsyShortcuts } from "./use-debugsy-shortcuts";

// Re-export type for external consumers
export type { DebugsyLookProps };

/**
 * DebugsyLook - Harbuz-based implementation
 *
 * Full implementation using @workspace/harbuz UI components.
 * Modern TerminalLayout structure with comprehensive debugging features.
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = ({
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

  // State
  const [isVisible, setIsVisible] = useState(false);
  const [isCompact, setIsCompact] = useState(true); // Compact mode (controls only) vs Extended mode (full logs)
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );

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
    initialHeight: 0, // Start compact (controls only)
    minHeight: 0, // Allow compact mode (0 height)
    maxHeight: getMaxHeight(),
  });

  // 6. Keyboard Selection Hook - Cmd+A selects only logs (after isResizing is defined)
  useKeyboardSelection({
    containerRef: logsContainerRef as React.RefObject<HTMLElement | null>,
    enabled: isVisible && !isResizing,
  });

  // 7. Clear Hook - Double-action clear logic
  const { handleClear: handleSmartClear } = useClear({
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
  });

  const onClose = useCallback(() => {
    setIsVisible(false);
    setIsCompact(true); // Reset to compact for next activation
    setPanelHeight(0);
  }, [setPanelHeight]);

  // 8. Click Outside Hook - Close panel when clicking outside
  useClickOutside(
    containerRef,
    onClose,
    isVisible && !isResizing && closeOnClickOutside
  );

  // 9. Keyboard Shortcuts Hook - Always active (especially ⌘+D for global toggle)
  const { shortcuts } = useDebugsyShortcuts({
    onToggleCompactExtended: () => {
      // First activation: show compact (controls only)
      if (!isVisible) {
        setIsVisible(true);
        setIsCompact(true);
        setPanelHeight(0);
        return;
      }

      // Once visible, toggle between compact and extended
      // isCompact is the source of truth
      const nextIsCompact = !isCompact;
      const nextHeight = nextIsCompact ? 0 : 400;

      setIsCompact(nextIsCompact);
      setPanelHeight(nextHeight);
    },
    onClear: handleSmartClear,
    onClose,
    enabled: isVisible && !isResizing,
  });

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
  const controlButtonTheme: IndicatorButtonTheme = {
    fontSize: "10px",
    lineHeight: "12px",
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
      <TerminalLayout
        bodyHeight={panelHeight}
        isResizing={isResizing}
        isCompact={isCompact}
      >
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
                    show: pauseState.isPaused,
                    content: (
                      <Banner
                        emoji="⏸️"
                        message={`Log rendering paused - ${pauseState.pausedItems.length} logs frozen`}
                        variant="paused"
                        onClick={() => pauseState.resume()}
                        title="Click to resume log rendering"
                      />
                    ),
                  },
                  {
                    show: !scrollFollowing.isFollowing && !pauseState.isPaused,
                    content: (
                      <Banner
                        emoji="📌"
                        message={`Viewing snapshot at ${scrollFollowing.snapshotItems.length > 0 ? scrollFollowing.snapshotItems.length : activeLogs.length} logs - Click to return to live stream`}
                        variant="snapshot"
                        onClick={() => {
                          scrollFollowing.returnToFollowing();
                          setDisplayContent({
                            message: "Returned to following live logs",
                            type: "success",
                            duration: 2000,
                          });
                        }}
                        title="Click to return to following live logs"
                      />
                    ),
                  },
                ]}
                truncation={{
                  hiddenCount,
                  totalCount: totalLogs,
                  maxRendered: MAX_RENDERED,
                  renderedCount: activeLogs.length,
                  onCopyAll: handleCopyAllLogs,
                  onClearAll: handleClearAllLogs,
                }}
                TruncationPanel={TruncationPanel}
                VirtualizedList={VirtualizedList}
                itemHeight={24}
                virtualizationThreshold={50}
                overscan={5}
              />
            </TerminalLayoutContent>

            <TerminalLayoutActions>
              <DebugsyActions
                activeLogs={activeLogs}
                filteredLogs={filteredLogs}
                copyState={copyState}
                pauseState={pauseState}
                scrollFollowing={scrollFollowing}
                hoverMessage={hoverMessage}
              />
            </TerminalLayoutActions>

            <TerminalLayoutSidebar>
              <DebugsyStats
                totalLogs={totalLogs}
                filteredLogs={filteredCount}
                activeLogs={activeLogs.length}
                activePoints={activePoints}
                panelHeight={panelHeight}
              />

              <DebugsyShortcutsDisplay shortcuts={shortcuts} />

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
                  buttonSize: "xs" as const,
                }))}
                theme={controlButtonTheme}
                orientation="grid"
                gridRows={2}
                gap="2px"
              />
            </ControlPanelSection>

            {/* Dependency Controls */}
            <ControlPanelSection separator className="pl-4">
              <DependencyControls theme={controlButtonTheme} />
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
                  title: "Clear logs (Cmd+K)",
                  backgroundColor: "#ffffff",
                  hoverBackgroundColor: "#e5e7eb",
                  color: "#4b5563",
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
          </ControlPanel>
        </TerminalLayoutControlPanel>
      </TerminalLayout>
    </div>
  );
};

DebugsyLook.displayName = "DebugsyLook";
