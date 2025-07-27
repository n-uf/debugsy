"use client";

import React, { useState } from "react";
import { useDebugSubscription } from "../../debugsy-logs/hooks/debug-notifications";
import { useDependencySettings } from "../../debugsy-shared/debug-settings";
import { DebugDependencyAdvancedControls } from "./dependency-advanced-controls";

export interface DebugDependencyControlsProps {
  className?: string;
}

/**
 * Debug Dependency Controls - Clean main interface with advanced panel integration
 *
 * Provides basic controls with access to comprehensive advanced controls panel.
 * All buttons represent and modify the same global state as console commands:
 * - surfaceDebug.deps.off()
 * - surfaceDebug.deps.quiet()
 * - surfaceDebug.deps.functionsOnly()
 * - surfaceDebug.deps.unstableOnly()
 */
export const DebugDependencyControls: React.FC<
  DebugDependencyControlsProps
> = ({ className = "" }) => {
  // SUBSCRIBE to debug state changes so button indicators update (like debug point buttons)
  useDebugSubscription();

  const dependencyState = useDependencySettings();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Use reactive state directly instead of static object
  const methods: any = {
    deps: {
      off: dependencyState.disable,
      normal: dependencyState.enable,
      quiet: () => {
        dependencyState.enable();
        dependencyState.setLogLevel("quiet");
      },
      functionsOnly: () => {
        dependencyState.enable();
        dependencyState.setFilter("functions-only");
      },
      unstableOnly: () => {
        dependencyState.enable();
        dependencyState.setFilter("unstable-only");
      },
      verbose: () => {
        dependencyState.enable();
        dependencyState.setLogLevel("verbose");
      },
      objectsOnly: () => {
        dependencyState.enable();
        dependencyState.setFilter("objects-only");
      },
    },
    setDependencyFilter: dependencyState.setFilter,
    filterDependencies: () => {}, // Not implemented in new interface
    resetDependencyFilters: () => {}, // Not implemented in new interface
  };

  const isInitialized = true; // Always true with new interface

  // Simplified button handlers for main controls
  const handleDependenciesToggle = () => {
    console.log(
      "🔵 [MainControls] Dependencies toggle, current enabled:",
      dependencyState.enabled
    );
    if (dependencyState.enabled) {
      dependencyState.disable();
    } else {
      dependencyState.enable();
    }
  };

  const handleQuietMode = () => {
    console.log("🔇 [MainControls] Quiet mode");
    dependencyState.enable();
    dependencyState.setLogLevel("quiet");
  };

  const handleFunctionsMode = () => {
    console.log("📝 [MainControls] Functions mode");
    dependencyState.enable();
    dependencyState.setFilter("functions-only");
  };

  const handleUnstableMode = () => {
    console.log("⚠️ [MainControls] Unstable mode");
    dependencyState.enable();
    dependencyState.setFilter("unstable-only");
  };

  // Reactive indicator logic using dependencyState directly
  const getDependenciesColor = () =>
    dependencyState.enabled ? "bg-green-500" : "bg-red-500";
  const getQuietColor = () =>
    dependencyState.enabled && dependencyState.logLevel === "quiet"
      ? "bg-green-500"
      : "bg-red-200";
  const getFunctionsColor = () =>
    dependencyState.enabled && dependencyState.filter === "functions-only"
      ? "bg-blue-500"
      : "bg-red-200";
  const getUnstableColor = () =>
    dependencyState.enabled && dependencyState.filter === "unstable-only"
      ? "bg-yellow-500"
      : "bg-red-200";

  return (
    <div className={`border-l border-gray-200 pl-4 ${className}`}>
      <div className={`flex flex-col shrink-0`} style={{ gap: "0px" }}>
        {/* First Row - Dependencies toggle + Advanced */}
        <div className="flex items-center gap-0.5 h-[20px]">
          <button
            onClick={handleDependenciesToggle}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded font-medium w-32
              bg-gray-100 text-gray-600 hover:bg-gray-200`}
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title={
              !isInitialized
                ? "Debug system not initialized - click to enable"
                : dependencyState.enabled
                  ? "Click to disable (surfaceDebug.deps.off)"
                  : "Click to enable (surfaceDebug.deps.normal)"
            }
          >
            <div
              className={`w-2 h-1 rounded-sm transition-colors duration-150 ${getDependenciesColor()}`}
            />
            <span className="leading-none truncate">Dependencies</span>
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-1.5 py-0.5 rounded text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            style={{ fontSize: "10px", lineHeight: "12px" }}
          >
            {showAdvanced ? "Simple" : "Advanced"}
          </button>
        </div>

        {/* Second Row - Quick Mode buttons */}
        <div className="flex items-center gap-0.5 overflow-x-auto h-[20px]">
          <button
            onClick={handleQuietMode}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded w-16 
              bg-gray-100 text-gray-600 hover:bg-gray-200`}
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Quiet mode: only critical changes (surfaceDebug.deps.quiet)"
          >
            <div
              className={`w-2 h-1 rounded-sm transition-colors duration-150 ${getQuietColor()}`}
            />
            <span className="leading-none truncate">Quiet</span>
          </button>

          <button
            onClick={handleFunctionsMode}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded w-20
              bg-gray-100 text-gray-600 hover:bg-gray-200`}
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Functions only mode (surfaceDebug.deps.functionsOnly)"
          >
            <div
              className={`w-2 h-1 rounded-sm transition-colors duration-150 ${getFunctionsColor()}`}
            />
            <span className="leading-none truncate">Functions</span>
          </button>

          <button
            onClick={handleUnstableMode}
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded w-20
              bg-gray-100 text-gray-600 hover:bg-gray-200`}
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Unstable only mode (surfaceDebug.deps.unstableOnly)"
          >
            <div
              className={`w-2 h-1 rounded-sm transition-colors duration-150 ${getUnstableColor()}`}
            />
            <span className="leading-none truncate">Unstable</span>
          </button>
        </div>
      </div>

      {/* Advanced Controls Panel - Now using dedicated component */}
      <DebugDependencyAdvancedControls
        showToggle={false}
        isVisible={showAdvanced}
        onVisibilityChange={setShowAdvanced}
        className="mt-2"
      />
    </div>
  );
};
DebugDependencyControls.displayName = "DebugDependencyControls";
