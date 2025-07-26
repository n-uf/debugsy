"use client";

import React, { useState } from "react";
import type { DependencyFilter } from "../hooks/debug-constants";
import { useDependencyState } from "../hooks/use-debug";

export interface DebugDependencyAdvancedControlsProps {
  className?: string;
}

/**
 * UI controls for dependency debugging configuration
 * Provides buttons to control dependency tracking behavior
 */
export const DebugDependencyAdvancedControls: React.FC<
  DebugDependencyAdvancedControlsProps
> = ({ className = "" }) => {
  const dependencyState = useDependencyState();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Button handlers using direct dependency state methods
  const handleDependenciesToggle = () => {
    console.log(
      "🔵 Dependencies toggle, current enabled:",
      dependencyState.enabled
    );
    if (dependencyState.enabled) {
      dependencyState.disable();
    } else {
      dependencyState.enable();
    }
  };

  const handleQuietMode = () => {
    console.log("🔇 Setting dependencies to quiet mode");
    dependencyState.enable();
    dependencyState.setLogLevel("quiet");
  };

  const handleNormalMode = () => {
    console.log("📊 Setting dependencies to normal mode");
    dependencyState.enable();
    dependencyState.setLogLevel("normal");
  };

  const handleVerboseMode = () => {
    console.log("📢 Setting dependencies to verbose mode");
    dependencyState.enable();
    dependencyState.setLogLevel("verbose");
  };

  const handleFilterChange = (filter: DependencyFilter) => {
    console.log(`🔧 Setting dependency filter to: ${filter}`);
    dependencyState.setFilter(filter);
  };

  const controlsStyle: React.CSSProperties = {
    padding: "8px",
    backgroundColor: "#1a1a1a",
    borderRadius: "4px",
    border: "1px solid #333",
    fontFamily: "monospace",
    fontSize: "11px",
    color: "#e5e7eb",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    minWidth: "200px",
  };

  const buttonStyle: React.CSSProperties = {
    padding: "4px 8px",
    backgroundColor: "#2d2d2d",
    border: "1px solid #404040",
    borderRadius: "3px",
    color: "#e5e7eb",
    cursor: "pointer",
    fontSize: "10px",
    fontFamily: "monospace",
    transition: "all 0.2s ease",
  };

  const activeButtonStyle: React.CSSProperties = {
    ...buttonStyle,
    backgroundColor: "#3b82f6",
    borderColor: "#2563eb",
    color: "white",
  };

  const sectionStyle: React.CSSProperties = {
    borderTop: "1px solid #333",
    paddingTop: "8px",
    marginTop: "4px",
  };

  return (
    <div className={className} style={controlsStyle}>
      {/* Header */}
      <div style={{ fontWeight: "bold", color: "#fbbf24" }}>
        🔍 Dependencies Debug
      </div>

      {/* Status */}
      <div style={{ fontSize: "10px", color: "#9ca3af" }}>
        Status: {dependencyState.enabled ? "🟢 Enabled" : "🔴 Disabled"}
        {dependencyState.enabled && (
          <>
            <br />
            Level: {dependencyState.logLevel}
            <br />
            Filter: {dependencyState.filter}
          </>
        )}
      </div>

      {/* Main Toggle */}
      <button
        style={dependencyState.enabled ? activeButtonStyle : buttonStyle}
        onClick={handleDependenciesToggle}
      >
        {dependencyState.enabled ? "🔴 Disable" : "🟢 Enable"} Dependencies
      </button>

      {/* Level Controls - Only show when enabled */}
      {dependencyState.enabled && (
        <div style={sectionStyle}>
          <div
            style={{ marginBottom: "4px", fontSize: "10px", color: "#9ca3af" }}
          >
            Tracking Level:
          </div>

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            <button
              style={
                dependencyState.logLevel === "quiet"
                  ? activeButtonStyle
                  : buttonStyle
              }
              onClick={handleQuietMode}
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
            >
              📢 Verbose
            </button>
          </div>
        </div>
      )}

      {/* Filter Controls - Only show when enabled */}
      {dependencyState.enabled && (
        <div style={sectionStyle}>
          <div
            style={{ marginBottom: "4px", fontSize: "10px", color: "#9ca3af" }}
          >
            Dependency Filter:
          </div>

          <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
            <button
              style={
                dependencyState.filter === "all"
                  ? activeButtonStyle
                  : buttonStyle
              }
              onClick={() => handleFilterChange("all")}
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
            >
              ⚠️ Unstable
            </button>
          </div>
        </div>
      )}

      {/* Advanced Controls Toggle */}
      <div style={sectionStyle}>
        <button
          style={buttonStyle}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          {showAdvanced ? "🔼" : "🔽"} Advanced
        </button>
      </div>

      {/* Advanced Controls */}
      {showAdvanced && dependencyState.enabled && (
        <div style={sectionStyle}>
          <div
            style={{ fontSize: "10px", color: "#9ca3af", marginBottom: "4px" }}
          >
            Log Count: {dependencyState.logs.length}
          </div>

          <div style={{ fontSize: "9px", color: "#6b7280" }}>
            Recent logs will appear in the debug panel when dependency tracking
            is active.
          </div>
        </div>
      )}
    </div>
  );
};
