"use client";

import { Button, Indicator } from "@workspace/harbuz";
import React from "react";
import { useDepsSettings } from "../../debugsy-space/debugsy-space-settings";
import { DebugDependencyAdvancedControls } from "./dependency-advanced-controls";
import { ProbeReRenderDetection } from "./probe-rerender-detection";

export interface DebugDependencyControlsProps {
  className?: string;
}

/**
 * Reusable 3-dot indicator component using harbuz Indicator
 */
interface ThreeDotIndicatorProps {
  activeDots: boolean[];
  disabledColor?: string;
}

const ThreeDotIndicator: React.FC<ThreeDotIndicatorProps> = ({
  activeDots,
  disabledColor = "bg-red-200",
}) => {
  const isDisabled = activeDots.every((dot) => !dot);

  return (
    <div className="flex items-center gap-0.5 w-4 h-2">
      {activeDots.map((isActive, index) => (
        <Indicator
          key={index}
          size="sm"
          variant={isDisabled ? "error" : isActive ? "success" : "neutral"}
          active={!isDisabled && isActive}
          inactiveVariant={isDisabled ? "error" : "neutral"}
          className="w-1.5 h-1.5"
        />
      ))}
    </div>
  );
};

/**
 * Debug Dependency Controls - Enhanced interface with improved advanced panel and probe rendering
 *
 * Provides compact controls with enhanced advanced controls panel and probe functionality.
 * All buttons represent and modify the same global state as console commands:
 * - surfaceDebug.deps.off()
 * - surfaceDebug.deps.quiet()
 * - surfaceDebug.deps.functionsOnly()
 * - surfaceDebug.deps.unstableOnly()
 */
export const DebugDependencyControls: React.FC<
  DebugDependencyControlsProps
> = ({ className = "" }) => {
  const dependencyState = useDepsSettings();
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [isRunningProbe, setIsRunningProbe] = React.useState(false);

  const isInitialized = true; // Always true with new interface

  // Enhanced probe test functionality
  const handleProbeTest = () => {
    if (isRunningProbe) {
      return; // Prevent multiple concurrent probes
    }

    console.log("Starting re-render probe test...");

    // Ensure dependency tracking is enabled with optimal settings for detection
    if (!dependencyState.enabled) {
      dependencyState.enable();
      dependencyState.setLogLevel("verbose"); // Use verbose for comprehensive detection
    } else if (dependencyState.logLevel === "quiet") {
      dependencyState.setLogLevel("normal"); // Upgrade from quiet for better detection
    }

    setIsRunningProbe(true);
  };

  const handleProbeComplete = () => {
    console.log("Probe test completed successfully");
    setIsRunningProbe(false);
  };

  const handleProbeStatusUpdate = (status: string) => {
    console.log("Probe status:", status);
  };

  // Enhanced button handlers with improved feedback
  const handleDependenciesToggle = () => {
    console.log(
      "[DepsControls] Dependencies toggle, current enabled:",
      dependencyState.enabled
    );
    if (dependencyState.enabled) {
      dependencyState.disable();
    } else {
      dependencyState.enable();
    }
  };

  // Cycling Quiet button: quiet -> normal -> verbose -> quiet
  const handleQuietCycle = () => {
    dependencyState.enable(); // Always enable when cycling

    const currentLevel = dependencyState.logLevel;
    if (currentLevel === "quiet") {
      dependencyState.setLogLevel("normal");
      console.log("[DepsControls] Cycling to normal mode");
    } else if (currentLevel === "normal") {
      dependencyState.setLogLevel("verbose");
      console.log("[DepsControls] Cycling to verbose mode");
    } else {
      dependencyState.setLogLevel("quiet");
      console.log("[DepsControls] Cycling to quiet mode");
    }
  };

  // Cycling Filter button: All -> Func -> Obj -> Unstable -> All
  const handleFilterCycle = () => {
    dependencyState.enable(); // Always enable when cycling

    const currentFilter = dependencyState.filter;
    if (currentFilter === "all" || !currentFilter) {
      dependencyState.setFilter("functions-only");
      console.log("[DepsControls] Cycling to functions filter");
    } else if (currentFilter === "functions-only") {
      dependencyState.setFilter("objects-only");
      console.log("[DepsControls] Cycling to objects filter");
    } else if (currentFilter === "objects-only") {
      dependencyState.setFilter("unstable-only");
      console.log("[DepsControls] Cycling to unstable filter");
    } else {
      dependencyState.setFilter("all");
      console.log("[DepsControls] Cycling to all filter");
    }
  };

  const handleAdvancedToggle = () => {
    setShowAdvanced(!showAdvanced);
    console.log(
      `[DepsControls] Advanced panel ${!showAdvanced ? "opened" : "closed"}`
    );
  };

  // Helper functions for display state
  const getDependenciesColor = () =>
    dependencyState.enabled ? "bg-green-500" : "bg-red-500";

  const getQuietDisplayText = () => {
    if (!dependencyState.enabled) return "Quiet";
    const level = dependencyState.logLevel;
    if (level === "quiet") return "Quiet";
    if (level === "verbose") return "Verbose";
    return "Normal";
  };

  // Level indicator with cumulative behavior
  const renderLevelIndicator = () => {
    if (!dependencyState.enabled) {
      return <ThreeDotIndicator activeDots={[false, false, false]} />;
    }

    const level = dependencyState.logLevel;
    if (level === "quiet") {
      return <ThreeDotIndicator activeDots={[true, false, false]} />;
    } else if (level === "normal") {
      return <ThreeDotIndicator activeDots={[true, true, false]} />;
    } else {
      // verbose
      return <ThreeDotIndicator activeDots={[true, true, true]} />;
    }
  };

  const getFilterDisplayText = () => {
    if (!dependencyState.enabled) return "All";
    const filter = dependencyState.filter;
    if (filter === "functions-only") return "Func";
    if (filter === "objects-only") return "Obj";
    if (filter === "unstable-only") return "Unstable";
    return "All";
  };

  // Filter indicator with selective behavior
  const renderFilterIndicator = () => {
    if (!dependencyState.enabled) {
      return <ThreeDotIndicator activeDots={[false, false, false]} />;
    }

    const currentFilter = dependencyState.filter;
    const isAll = currentFilter === "all" || !currentFilter;

    const activeDots = [
      isAll || currentFilter === "functions-only", // Functions dot
      isAll || currentFilter === "objects-only", // Objects dot
      isAll || currentFilter === "unstable-only", // Unstable dot
    ];

    return <ThreeDotIndicator activeDots={activeDots} />;
  };

  return (
    <div
      className={`pl-4 ${className}`}
      style={{ borderLeft: "1px solid #d1d5db" }}
    >
      <div className="flex flex-col shrink-0" style={{ gap: "0px" }}>
        {/* Row 1: Deps | Quiet - Using harbuz Button */}
        <div className="flex items-center gap-0.5 h-[20px]">
          <Button
            onClick={handleDependenciesToggle}
            variant="ghost"
            size="xs"
            className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <span className="leading-none truncate">Deps</span>
          </Button>

          <Button
            onClick={handleQuietCycle}
            variant="ghost"
            size="xs"
            className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Cycle between Quiet -> Normal -> Verbose modes"
          >
            {renderLevelIndicator()}
            <span className="leading-none truncate">
              {getQuietDisplayText()}
            </span>
          </Button>
        </div>

        {/* Row 2: Filter | Probe | Adv. - Using harbuz Button */}
        <div className="flex items-center gap-0.5 overflow-x-auto h-[20px]">
          <Button
            onClick={handleFilterCycle}
            variant="ghost"
            size="xs"
            className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Cycle between All -> Func -> Obj -> Unstable filters"
          >
            {renderFilterIndicator()}
            <span className="leading-none truncate">
              {getFilterDisplayText()}
            </span>
          </Button>

          <Button
            onClick={handleProbeTest}
            disabled={isRunningProbe}
            variant="ghost"
            size="xs"
            className="justify-center px-1.5 py-0.5 w-10 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title="Run comprehensive re-render probe to verify dependency tracking"
          >
            <span className="leading-none truncate">
              {isRunningProbe ? "Testing" : "Probe"}
            </span>
          </Button>

          <Button
            onClick={handleAdvancedToggle}
            variant="ghost"
            size="xs"
            className={`justify-center px-1.5 py-0.5 w-10 h-auto rounded font-medium transition-colors duration-150 ${
              showAdvanced
                ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={{ fontSize: "10px", lineHeight: "12px" }}
            title={
              showAdvanced ? "Hide advanced controls" : "Show advanced controls"
            }
          >
            <span className="leading-none truncate">Adv.</span>
          </Button>
        </div>
      </div>

      {/* Headless Probe Component - enhanced with progress reporting */}
      {isRunningProbe && (
        <ProbeReRenderDetection
          onComplete={handleProbeComplete}
          onStatusUpdate={handleProbeStatusUpdate}
        />
      )}

      {/* Enhanced Advanced Controls Panel with improved layout */}
      {showAdvanced && (
        <div className="mt-2 pt-2" style={{ borderTop: "1px solid #d1d5db" }}>
          <div
            className="bg-gray-50 rounded-md overflow-hidden"
            style={{ border: "1px solid #d1d5db" }}
          >
            {/* Advanced Panel Header */}
            <div
              className="bg-gray-100 px-2 py-1"
              style={{ borderBottom: "1px solid #d1d5db" }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-700">
                  Advanced Controls
                </span>
                <button
                  onClick={() => setShowAdvanced(false)}
                  className="text-xs text-gray-500 hover:text-gray-700 px-1"
                  title="Close advanced panel"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Advanced Panel Content */}
            <div className="p-2">
              <DebugDependencyAdvancedControls
                showToggle={false}
                isVisible={true}
                onVisibilityChange={() => {}} // Controlled by parent
                className=""
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DebugDependencyControls.displayName = "DebugDependencyControls";
