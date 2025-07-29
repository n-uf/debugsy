"use client";

import React, { useMemo, useState } from "react";
import { useDebugsySubscription } from "../../debugsy-logs/hooks/debugsy-notifications";
import { useDebugsy } from "../../debugsy-logs/use-debugsy";
import { getLookDebugPoints } from "../../debugsy-space/debugsy-point";
import { DebugDependencyControls } from "../ui-dependency/dependency-controls";
import { DebugDisplayPanel } from "../ui-display/debug-display-panel";
import { DebugPointButtons, getDebugPointsForButtons } from "./control-buttons";

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
  // SUBSCRIBE to debug state changes so button indicators update
  useDebugsySubscription();

  const debug = useDebugsy();

  // Get debug points for control panel from centralized config
  const debugPoints = useMemo(
    () => getDebugPointsForButtons(getLookDebugPoints()),
    []
  );

  // PERFORMANCE FIX: Memoize expensive operations to prevent cascade re-renders
  const expensiveState = useMemo(
    () => ({
      enabledPoints: debug.state.enabled,
      logs: debug.getLogs(),
    }),
    [debug.state.enabled, debug.getLogs]
  );

  // Extract only the functions DebugPointButtons needs (stable references)
  const debugPointProps = useMemo(
    () => ({
      isEnabled: debug.isEnabled,
      onToggle: debug.toggle,
    }),
    [debug.isEnabled, debug.toggle]
  );

  // Don't render if not visible
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 ${className}`}>
      {/* Main control panel with embedded logs */}
      <div className="bg-white/90 backdrop-blur border-t border-gray-200 shadow-sm">
        <div className="flex items-start gap-4 px-4 py-1">
          {/* Debug Points - Optimized with stable props */}
          <DebugPointButtons
            debugPoints={debugPoints}
            isEnabled={debugPointProps.isEnabled}
            onToggle={debugPointProps.onToggle}
          />

          {/* Dependency Controls */}
          {showDependencyControls && <DebugDependencyControls />}

          {/* Display Panel */}
          <DebugDisplayPanel
            logs={expensiveState.logs}
            onClearLogs={debug.clearLogs}
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
