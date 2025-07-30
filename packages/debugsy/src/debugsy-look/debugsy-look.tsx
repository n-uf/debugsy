"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRenderTracker } from "../debugsy-deps";
import { useDebugsySubscription } from "../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../debugsy-logs/use-debugsy";
import { DebugControlPanel } from "./ui-control-center/control-panel";
import { DebugPanelHeader } from "./ui-control-center/header";
import { DebugPanelResizeHandle } from "./ui-control-center/resize-handle";
import { DebugResizePresets } from "./ui-control-center/resize-presets";
import { DebugLogsList } from "./ui-logs/logs-list";
import { DebugStatsPanel } from "./ui-stats-center/stats-panel";

export interface DebugsyLookProps {
  closeOnClickOutside?: boolean;
}

/**
 * Debugsy Panel - Full-screen resizable debug console
 * SELF-CONTAINED: Manages its own debug state, logs, and clearing internally
 */
export const DebugsyLook: React.FC<DebugsyLookProps> = ({
  closeOnClickOutside = false,
}) => {
  // Enhanced tracking with both render and mount detection
  const lifecycleInfo = useRenderTracker("DebugsyLook", {
    renderThreshold: 15, // Higher threshold for debug panel
    mountThreshold: 5, // Track frequent mount/unmount cycles
    trackRenders: true,
    trackMounts: true,
    onExcessiveRenders: (info) =>
      console.warn("DebugsyLook excessive renders:", info),
    onExcessiveMounts: (info) =>
      console.warn("DebugsyLook excessive mounts:", info),
  });
  // SELF-CONTAINED: Handle debug state internally
  useDebugsySubscription(); // Subscribe to debug state changes
  const debug = useDebugsy();

  // Get logs and clear function from debug system
  const logs = debug.getLogs();
  const onClearLogs = debug.clearLogs;

  const [isVisible, setIsVisible] = useState(false);
  const [panelHeight, setPanelHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [clearConfirmation, setClearConfirmation] = useState(false);
  const [debugLogsState, setDebugLogsState] = useState({
    isPaused: false,
    isFollowing: true,
  });
  const [clearLocalStateCallback, setClearLocalStateCallback] = useState<
    (() => void) | null
  >(null);
  const externalPanelRef = useRef<HTMLDivElement>(null);
  const resizeStartY = useRef<number>(0);
  const resizeStartHeight = useRef<number>(0);
  const clearConfirmationTimeoutRef = useRef<NodeJS.Timeout | undefined>(
    undefined
  );

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
      // Note: Storage was already cleared on first action
      setClearConfirmation(false);

      // Clear the confirmation timeout
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }

      // Clear local state in DebugLogsList
      if (clearLocalStateCallback) {
        clearLocalStateCallback();
      }
    }
  }, [debugLogsState, clearConfirmation, onClearLogs, clearLocalStateCallback]);

  const onClose = () => {
    setIsVisible(false);
  };

  // Constraints for panel height
  const MIN_HEIGHT = 200;
  const MAX_HEIGHT = typeof window !== "undefined" ? window.innerHeight : 800;

  // Close external panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        externalPanelRef.current &&
        !externalPanelRef.current.contains(event.target as Node)
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
    onClearLogs,
    handleSmartClear,
    onClose,
  ]);

  // Cleanup clearConfirmationTimeoutRef on unmount
  useEffect(() => {
    return () => {
      if (clearConfirmationTimeoutRef.current) {
        clearTimeout(clearConfirmationTimeoutRef.current);
      }
    };
  }, []);

  // Handle resize drag
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;

      const deltaY = event.clientY - resizeStartY.current;
      const newHeight = Math.max(
        MIN_HEIGHT,
        Math.min(MAX_HEIGHT, resizeStartHeight.current - deltaY)
      );
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "ns-resize";
      document.body.style.userSelect = "none";

      return () => {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };
    }
  }, [isResizing, MIN_HEIGHT, MAX_HEIGHT]);

  const handleResizeStart = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsResizing(true);
    resizeStartY.current = event.clientY;
    resizeStartHeight.current = panelHeight;
  };

  const handleClearClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSmartClear();
  };

  const handleDisplayClick = () => {
    setPanelHeight(panelHeight === 0 ? 400 : 0);
  };

  // Calculate stats
  const activePoints = [...new Set(logs.map((log) => log.point))].length;
  const totalLogs = logs.length;
  // Derive enabled points from logs instead of using debug state to prevent circular deps
  const enabledPoints = [...new Set(logs.map((log) => log.point))];

  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: `${(typeof window !== "undefined" ? window.innerHeight : 800) - panelHeight}px`,
        left: "0",
        width: "100vw",
        height: `${panelHeight}px`,
        backgroundColor: "#000000f0",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch", // Stretch children to full width
        animation: "slideUp 0.2s ease-out",
        boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.5)",
      }}
      ref={externalPanelRef}
    >
      {/* Resize Handle */}
      <DebugPanelResizeHandle
        onResizeStart={handleResizeStart}
        isResizing={isResizing}
      />

      {/* Main Content Area */}
      {panelHeight > 0 && (
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "stretch", // Stretch children to full height
            overflow: "hidden",
          }}
        >
          {/* Logs Section - Main Content */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "stretch", // Stretch to use full width for logs
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <DebugPanelHeader onClear={handleClearClick} onClose={onClose} />

            {/* Logs Content */}
            <DebugLogsList
              logs={logs}
              onClearLogs={handleSmartClear}
              onStateChange={setDebugLogsState}
              onRegisterClearLocalState={(callback) =>
                setClearLocalStateCallback(() => callback)
              }
            />
          </div>

          {/* Right Panel - Stats & Controls */}
          <div
            style={{
              width: "220px",
              borderLeft: "1px solid #374151",
              backgroundColor: "#00000080",
              display: "flex",
              flexDirection: "column",
              alignItems: "center", // Center items horizontally
              flexShrink: 0,
            }}
            className="flex flex-col h-full"
          >
            {/* Statistics */}
            <DebugStatsPanel
              totalLogs={totalLogs}
              activePoints={activePoints}
              panelHeight={panelHeight}
            />

            {/* Keyboard Shortcuts */}
            <div
              style={{
                padding: "8px",
                borderBottom: "1px solid #374151",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center", // Center content horizontally
              }}
            >
              <div
                style={{
                  fontSize: "10px",
                  fontFamily: "monospace",
                  color: "#d1d5db",
                  marginBottom: "4px",
                  fontWeight: "bold",
                  textAlign: "center", // Center text
                }}
              >
                Shortcuts:
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center", // Center shortcut items
                  gap: "2px",
                  fontSize: "9px",
                  fontFamily: "monospace",
                }}
              >
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                  <span style={{ color: "#10b981" }}>⌘+D</span> Compact/Extended
                </div>
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                  <span style={{ color: "#10b981" }}>Esc</span> Close panel
                </div>
                <div style={{ color: "#6b7280", textAlign: "center" }}>
                  <span style={{ color: "#10b981" }}>⌘+K</span> Clear logs
                </div>
              </div>
            </div>

            <div className="flex-grow"></div>
            {/* Resize Presets */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                width: "100%",
              }}
            >
              <DebugResizePresets
                currentHeight={panelHeight}
                maxHeight={MAX_HEIGHT}
                onHeightChange={setPanelHeight}
                className="mb-14"
              />
            </div>
          </div>
        </div>
      )}

      {/* Debug Control Panel at Bottom */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
        <DebugControlPanel
          className=""
          showExternalPanel={true}
          onExternalPanelToggle={onClose}
          onClose={onClose}
          displayInlineLogs={!isVisible || panelHeight === 0}
          onDisplayInlineLogsChange={(display) =>
            setPanelHeight(display ? 0 : 400)
          }
          onDisplayClick={handleDisplayClick}
        />
      </div>

      {/* Global styles for animations */}
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

DebugsyLook.displayName = "DebugsyPanel";
