"use client";

import React, { useState } from "react";
import type { DependencyFilter } from "../../debugsy-shared/debug-constants";
import { useDependencySettings } from "../../debugsy-shared/debug-settings";

export interface DebugDependencyAdvancedControlsProps {
  className?: string;
  /** Whether to show the advanced toggle button */
  showToggle?: boolean;
  /** External control of advanced panel visibility */
  isVisible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * Advanced dependency debugging controls with dark theme styling
 * Provides comprehensive control over dependency tracking behavior
 */
export const DebugDependencyAdvancedControls: React.FC<
  DebugDependencyAdvancedControlsProps
> = ({ className = "", showToggle = true, isVisible, onVisibilityChange }) => {
  const dependencyState = useDependencySettings();
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);

  // Use external visibility control if provided, otherwise use internal state
  const showAdvanced =
    isVisible !== undefined ? isVisible : internalShowAdvanced;

  const toggleAdvanced = () => {
    const newValue = !showAdvanced;
    if (onVisibilityChange) {
      onVisibilityChange(newValue);
    } else {
      setInternalShowAdvanced(newValue);
    }
  };

  // Enhanced button handlers with better logging and state management
  const handleDependenciesToggle = () => {
    console.log(
      "🔵 [AdvancedControls] Dependencies toggle, current enabled:",
      dependencyState.enabled
    );
    if (dependencyState.enabled) {
      dependencyState.disable();
    } else {
      dependencyState.enable();
    }
  };

  const handleQuietMode = () => {
    console.log("🔇 [AdvancedControls] Setting dependencies to quiet mode");
    dependencyState.enable();
    dependencyState.setLogLevel("quiet");
  };

  const handleNormalMode = () => {
    console.log("📊 [AdvancedControls] Setting dependencies to normal mode");
    dependencyState.enable();
    dependencyState.setLogLevel("normal");
  };

  const handleVerboseMode = () => {
    console.log("📢 [AdvancedControls] Setting dependencies to verbose mode");
    dependencyState.enable();
    dependencyState.setLogLevel("verbose");
  };

  const handleFilterChange = (filter: DependencyFilter) => {
    console.log(
      `🔧 [AdvancedControls] Setting dependency filter to: ${filter}`
    );
    if (filter !== "all") {
      dependencyState.enable(); // Auto-enable when setting a specific filter
    }
    dependencyState.setFilter(filter);
  };

  const controlsStyle: React.CSSProperties = {
    padding: "12px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
    border: "1px solid #333",
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    minWidth: "240px",
    maxWidth: "100%",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "6px 10px",
    backgroundColor: "#2d2d2d",
    border: "1px solid #404040",
    borderRadius: "4px",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: "10px",
    fontFamily: "monospace",
    transition: "all 0.2s ease",
    whiteSpace: "nowrap",
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
    color: "white",
    boxShadow: "0 0 0 1px rgba(59, 130, 246, 0.3)",
  };

  const sectionStyle: React.CSSProperties = {
    borderTop: "1px solid #333",
    paddingTop: "10px",
    marginTop: "6px",
  };

  const headerStyle: React.CSSProperties = {
    fontWeight: "bold",
    color: "#fbbf24",
    fontSize: "12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  };

  return (
    <div className={className}>
      {/* Toggle Button */}
      {showToggle && (
        <button
          onClick={toggleAdvanced}
          className="px-1.5 py-0.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50 mb-2"
          style={{ fontSize: "10px", lineHeight: "12px" }}
        >
          {showAdvanced ? "🔼" : "🔽"} Advanced
        </button>
      )}

      {/* Advanced Controls Panel */}
      {showAdvanced && (
        <div style={controlsStyle}>
          {/* Header */}
          <div style={headerStyle}>🔍 Advanced Dependency Controls</div>

          {/* Status Overview */}
          <div
            style={{ fontSize: "10px", color: "#9ca3af", lineHeight: "1.4" }}
          >
            <div>
              <strong>Status:</strong>{" "}
              {dependencyState.enabled ? "🟢 Enabled" : "🔴 Disabled"}
            </div>
            {dependencyState.enabled && (
              <>
                <div>
                  <strong>Level:</strong> {dependencyState.logLevel}
                </div>
                <div>
                  <strong>Filter:</strong> {dependencyState.filter}
                </div>
                <div>
                  <strong>Log Count:</strong> {dependencyState.logs.length}
                </div>
              </>
            )}
          </div>

          {/* Main Toggle */}
          <button
            style={dependencyState.enabled ? activeButtonStyle : buttonStyle}
            onClick={handleDependenciesToggle}
          >
            {dependencyState.enabled ? "🔴 Disable All" : "🟢 Enable"}{" "}
            Dependencies
          </button>

          {/* Level Controls - Enhanced with better UX */}
          {dependencyState.enabled && (
            <div style={sectionStyle}>
              <div
                style={{
                  marginBottom: "6px",
                  fontSize: "10px",
                  color: "#9ca3af",
                  fontWeight: "bold",
                }}
              >
                📊 Tracking Level:
              </div>

              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  style={
                    dependencyState.logLevel === "quiet"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={handleQuietMode}
                  title="Minimal logging - only critical changes"
                >
                  🔇 Quiet
                </button>
                <button
                  style={
                    dependencyState.logLevel === "normal"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={handleNormalMode}
                  title="Standard logging - balanced detail"
                >
                  📊 Normal
                </button>
                <button
                  style={
                    dependencyState.logLevel === "verbose"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={handleVerboseMode}
                  title="Detailed logging - all changes"
                >
                  📢 Verbose
                </button>
              </div>
            </div>
          )}

          {/* Filter Controls - Enhanced with better organization */}
          {dependencyState.enabled && (
            <div style={sectionStyle}>
              <div
                style={{
                  marginBottom: "6px",
                  fontSize: "10px",
                  color: "#9ca3af",
                  fontWeight: "bold",
                }}
              >
                🔧 Content Filter:
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "6px",
                }}
              >
                <button
                  style={
                    dependencyState.filter === "all"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={() => handleFilterChange("all")}
                  title="Show all dependencies"
                >
                  📋 All
                </button>
                <button
                  style={
                    dependencyState.filter === "functions-only"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={() => handleFilterChange("functions-only")}
                  title="Only function dependencies"
                >
                  📝 Functions
                </button>
                <button
                  style={
                    dependencyState.filter === "objects-only"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={() => handleFilterChange("objects-only")}
                  title="Only object dependencies"
                >
                  📦 Objects
                </button>
                <button
                  style={
                    dependencyState.filter === "unstable-only"
                      ? activeButtonStyle
                      : buttonStyle
                  }
                  onClick={() => handleFilterChange("unstable-only")}
                  title="Only unstable/changing dependencies"
                >
                  ⚠️ Unstable
                </button>
              </div>
            </div>
          )}

          {/* Performance & Stats */}
          {dependencyState.enabled && (
            <div style={sectionStyle}>
              <div
                style={{
                  marginBottom: "6px",
                  fontSize: "10px",
                  color: "#9ca3af",
                  fontWeight: "bold",
                }}
              >
                📈 Performance:
              </div>

              <div
                style={{ fontSize: "9px", color: "#6b7280", lineHeight: "1.4" }}
              >
                <div>
                  Total Logs:{" "}
                  <span style={{ color: "#10b981" }}>
                    {dependencyState.logs.length}
                  </span>
                </div>
                {dependencyState.logs.length > 0 && (
                  <div>
                    Latest:{" "}
                    <span style={{ color: "#8b5cf6" }}>
                      {new Date(
                        dependencyState.logs[dependencyState.logs.length - 1]
                          ?.timestamp || Date.now()
                      ).toLocaleTimeString()}
                    </span>
                  </div>
                )}
                {dependencyState.logs.length === 0 && (
                  <div style={{ color: "#f59e0b", marginTop: "4px" }}>
                    💡 Interact with components to see dependency tracking
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Console Commands Quick Reference */}
          <div style={sectionStyle}>
            <div
              style={{
                marginBottom: "6px",
                fontSize: "10px",
                color: "#9ca3af",
                fontWeight: "bold",
              }}
            >
              📟 Console Commands:
            </div>
            <div
              style={{ fontSize: "8px", color: "#6b7280", lineHeight: "1.3" }}
            >
              <div>surfaceDebug.deps.off()</div>
              <div>surfaceDebug.deps.{dependencyState.logLevel}()</div>
              <div>
                surfaceDebug.deps.{dependencyState.filter.replace("-", "")}()
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
