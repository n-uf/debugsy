"use client";

import {
  ActionToolbar,
  ControlPanel,
  ControlPanelDisplaySection,
  ControlPanelSection,
  LogEntry,
  safeSuperjsonStringify,
  setDisplayContent,
  StatusButtonGroup,
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
  useDisplay,
  useResizable,
  Z_INDEX,
  type ActionButton,
  type CopyState,
  type DepthControl,
} from "@workspace/harbuz";
import React, { useCallback, useEffect, useRef, useState } from "react";

import { useRenderTracker } from "../debugsy-deps";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import type { DebugLogEntry } from "../debugsy-space";
import type { DebugsyLookProps } from "./debugsy-look-v1";

/**
 * DebugsyLookV2 - Harbuz-based implementation
 *
 * Full implementation using @workspace/harbuz UI components.
 * Maintains feature parity with V1 while using modern TerminalLayout structure.
 */
export const DebugsyLookV2: React.FC<DebugsyLookProps> = ({
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
  const clearConfirmationTimeoutRef = useRef<NodeJS.Timeout | undefined>(
    undefined
  );

  // State
  const [isVisible, setIsVisible] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [debugLogsState, setDebugLogsState] = useState({
    isPaused: false,
    isFollowing: true,
  });
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const [expandedEntries, setExpandedEntries] = useState<Set<number>>(
    new Set()
  );
  const [copyState, setCopyState] = useState<CopyState>(0);
  const [depthSetting, setDepthSetting] = useState<
    "str" | "1" | "3" | "5" | "10" | "all"
  >("all");

  // Display system
  const displayContent = useDisplay();

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

  // Smart clear function with double-action logic
  const handleSmartClear = useCallback(() => {
    const { isPaused, isFollowing } = debugLogsState;

    // If following live logs, clear immediately
    if (isFollowing && !isPaused) {
      onClearLogs();
      return;
    }

    // If paused or scrolled (not following), use two-step process
    if (!clearConfirmation) {
      // First action: Clear storage immediately but keep local state
      onClearLogs();
      setClearConfirmation(true);

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

      // Clear local state
      if (clearLocalStateCallback) {
        clearLocalStateCallback();
      }
    }
  }, [debugLogsState, clearConfirmation, onClearLogs, clearLocalStateCallback]);

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
  const activePoints = [...new Set(logs.map((log) => log.point))].length;
  const totalLogs = logs.length;
  const enabledPoints = [...new Set(logs.map((log) => log.point))];

  // Actions for action toolbar
  const depthControl: DepthControl<typeof depthSetting> = {
    value: depthSetting,
    options: ["str", "1", "3", "5", "10", "all"],
    onChange: setDepthSetting,
    getDescription: (v) => `Depth: ${v}`,
    getColor: () => "#10b981",
    getWidth: () => "100%",
  };

  const actionButtons: ActionButton[] = [
    {
      icon: ["📋", "📋", "✅"][copyState] ?? "📋",
      title: "Copy logs",
      variant: copyState === 2 ? "success" : "default",
      onClick: () => {
        const nextState = ((copyState + 1) % 3) as CopyState;
        setCopyState(nextState);

        if (nextState === 1) {
          const logsToCopy = safeSuperjsonStringify(logs, 2);
          navigator.clipboard.writeText(logsToCopy);
          setDisplayContent({
            message: "Logs copied!",
            type: "success",
            duration: 1500,
          });
        }
      },
    },
    {
      icon: debugLogsState.isPaused ? "▶️" : "⏸",
      title: debugLogsState.isPaused ? "Resume" : "Pause",
      variant: debugLogsState.isPaused ? "paused" : "default",
      onClick: () => {
        setDebugLogsState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
      },
    },
    {
      icon: "💊",
      title: "Health snapshot",
      onClick: () => {
        setDisplayContent({
          message: "Health snapshot captured",
          type: "info",
          duration: 1500,
        });
      },
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
                items={logs.slice(0, MAX_RENDERED).map((log, idx) => ({
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
                        ⏸ Paused - New logs won't appear.{" "}
                        <button
                          onClick={() =>
                            setDebugLogsState((prev) => ({
                              ...prev,
                              isPaused: false,
                            }))
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            textDecoration: "underline",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                          }}
                        >
                          Resume
                        </button>
                      </>
                    ),
                    show: debugLogsState.isPaused,
                  },
                  {
                    content: (
                      <>
                        📸 Viewing snapshot.{" "}
                        <button
                          onClick={() =>
                            setDebugLogsState((prev) => ({
                              ...prev,
                              isFollowing: true,
                            }))
                          }
                          style={{
                            background: "none",
                            border: "none",
                            color: "inherit",
                            textDecoration: "underline",
                            cursor: "pointer",
                            padding: 0,
                            font: "inherit",
                          }}
                        >
                          Follow live
                        </button>
                      </>
                    ),
                    show: !debugLogsState.isFollowing,
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
                  label="Logs"
                  value={totalLogs}
                  color="#10b981"
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
                <TerminalLayoutShortcut keys="Esc" description="Close panel" />
                <TerminalLayoutShortcut keys="⌘+K" description="Clear logs" />
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
            <ControlPanelSection>
              <StatusButtonGroup
                buttons={enabledPoints.map((point) => ({
                  label: point,
                  active: true,
                  onClick: () => {
                    setDisplayContent({
                      message: `Toggle ${point}`,
                      type: "info",
                      duration: 1000,
                    });
                  },
                  indicators: [{ active: true, tooltip: "Active" }],
                }))}
                orientation="grid"
                gridRows={2}
              />
            </ControlPanelSection>

            <ControlPanelDisplaySection
              entries={[]}
              content={displayContent}
              actions={[
                ..._uiVersion ? [{
                  icon: _uiVersion.toUpperCase(),
                  onClick: () => _onToggleVersion?.(),
                  backgroundColor: _uiVersion === "v2" ? "#10b981" : "#3b82f6",
                  hoverBackgroundColor: _uiVersion === "v2" ? "#059669" : "#2563eb",
                  color: "#ffffff",
                  title: "Toggle UI version (Cmd+Shift+D)",
                }] : [],
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

DebugsyLookV2.displayName = "DebugsyLookV2";
