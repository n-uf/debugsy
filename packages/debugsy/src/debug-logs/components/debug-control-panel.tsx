"use client";

import React, { useState } from "react";
import { useDebug } from "../hooks/use-debug";
import { DebugDependencyControls } from "./debug-dependency-controls";
import { DebugDisplayPanel } from "./debug-display-panel";
import {
  DebugPointButtons,
  type DebugPointConfig,
} from "./debug-point-buttons";

export interface DebugControlPanelProps {
  className?: string;
  showExternalPanel?: boolean;
  onExternalPanelToggle?: () => void;
  isVisible?: boolean;
  onClose?: () => void;
  displayInlineLogs?: boolean;
  onDisplayInlineLogsChange?: (display: boolean) => void;
  onDisplayClick?: () => void;
  showDependencyControls?: boolean;
}

// Event Dispatcher Architecture debug points
const DEBUG_POINTS: DebugPointConfig[] = [
  { key: "dispatcher", emoji: "🎯", label: "Dispatcher" },
  { key: "hit-testing", emoji: "🔍", label: "Hit Test" },
  { key: "routing", emoji: "🔗", label: "Routing" },
  { key: "surface", emoji: "🌍", label: "Surface" },
  { key: "surface-interactions", emoji: "🌍", label: "Surface.io" },
  { key: "frame-interaction", emoji: "📦", label: "Frame" },
  { key: "selection-interaction", emoji: "📋", label: "Selection" },
  { key: "handler-registry", emoji: "📝", label: "Registry" },
  { key: "performance", emoji: "⚡", label: "Perf" },
  { key: "visual-debug", emoji: "👁️", label: "Visual" },
  { key: "dependencies", emoji: "🧠", label: "Deps" },
  { key: "surface-dock", emoji: "🚢", label: "Dock" },
];

/**
 * Debug Control Panel - Clean, minimal toolbar with modular components
 */
export const DebugControlPanel: React.FC<DebugControlPanelProps> = ({
  className = "",
  showExternalPanel = false,
  onExternalPanelToggle,
  isVisible = true,
  onClose,
  displayInlineLogs,
  onDisplayInlineLogsChange,
  onDisplayClick,
  showDependencyControls = true,
}) => {
  const debug = useDebug();
  const enabledPoints = debug.state.enabled;
  const logs = debug.getLogs();
  const clearLogs = debug.clearLogs;

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {/* Main control panel with embedded logs */}
      <div className="bg-white/90 backdrop-blur border-t border-gray-200 shadow-sm">
        <div className="flex items-start gap-4 px-4 py-1">
          {/* Debug Points */}
          <DebugPointButtons
            debugPoints={DEBUG_POINTS}
            isEnabled={debug.isEnabled}
            onToggle={debug.toggle}
          />

          {/* Dependency Controls */}
          {showDependencyControls && <DebugDependencyControls />}

          {/* Display Panel */}
          <DebugDisplayPanel
            logs={logs}
            onClearLogs={clearLogs}
            onClose={onClose}
            showExternalPanel={showExternalPanel}
            onExternalPanelToggle={onExternalPanelToggle}
            displayInlineLogs={displayInlineLogs}
            onDisplayInlineLogsChange={onDisplayInlineLogsChange}
            onDisplayClick={onDisplayClick}
          />
        </div>
      </div>
    </div>
  );
};

DebugControlPanel.displayName = "DebugControlPanel";

/**
 * Standalone Debug Control Panel - Manages its own visibility state
 * Use this when you want a self-contained debug panel that can be closed/reopened
 */
export const StandaloneDebugControlPanel: React.FC<
  Omit<DebugControlPanelProps, "isVisible" | "onClose">
> = (props) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleToggle = () => {
    setIsVisible(!isVisible);
  };

  return (
    <>
      {/* Control panel */}
      <DebugControlPanel
        {...props}
        isVisible={isVisible}
        onClose={handleClose}
      />

      {/* Floating toggle button when panel is hidden */}
      {!isVisible && (
        <button
          onClick={handleToggle}
          className="fixed bottom-4 left-4 z-50"
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            backgroundColor: "#374151",
            color: "#ffffff",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.backgroundColor = "#4b5563";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1)";
            e.currentTarget.style.backgroundColor = "#374151";
          }}
          title="Show Debug Panel"
        >
          🔧
        </button>
      )}
    </>
  );
};

StandaloneDebugControlPanel.displayName = "StandaloneDebugControlPanel";
