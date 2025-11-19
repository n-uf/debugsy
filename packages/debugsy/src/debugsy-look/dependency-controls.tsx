"use client";

import { Button, Indicator, StatusButtonTheme } from "@workspace/harbuz";
import React, { useState } from "react";
import { ProbeReRenderDetection } from "../debugsy-look-v1/ui-dependency/probe-rerender-detection";
import { useDepsSettings } from "../debugsy-space/debugsy-space-settings";
import { setDebugDisplayContent } from "../shared/debug-display-state";
import { DependencyAdvancedPanel } from "./dependency-advanced-panel";

export interface DependencyControlsV2Props {
  theme?: StatusButtonTheme;
  className?: string;
  onAdvancedToggle?: (show: boolean) => void;
  showAdvanced?: boolean;
}

/**
 * Three-dot indicator for dependency controls
 */
interface ThreeDotIndicatorProps {
  activeDots: boolean[];
}

const ThreeDotIndicator: React.FC<ThreeDotIndicatorProps> = ({
  activeDots,
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
 * Dependency Controls V2 - Harbuz-themed implementation
 *
 * Provides compact controls with enhanced theme support via Harbuz components.
 * All buttons represent and modify the same global state as console commands.
 */
export const DependencyControlsV2: React.FC<DependencyControlsV2Props> = ({
  theme,
  className = "",
  onAdvancedToggle,
  showAdvanced: externalShowAdvanced,
}) => {
  const dependencyState = useDepsSettings();
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);
  const [isRunningProbe, setIsRunningProbe] = useState(false);

  const showAdvanced =
    externalShowAdvanced !== undefined
      ? externalShowAdvanced
      : internalShowAdvanced;

  // Apply theme styling
  const buttonStyle = {
    fontSize: theme?.fontSize ?? "10px",
    lineHeight: theme?.lineHeight ?? "12px",
    ...theme?.style,
  };

  // Button handlers
  const handleDependenciesToggle = () => {
    if (dependencyState.enabled) {
      dependencyState.disable();
      setDebugDisplayContent({
        message: "Dependencies tracking disabled",
        type: "info",
        duration: 1500,
      });
    } else {
      dependencyState.enable();
      setDebugDisplayContent({
        message: "Dependencies tracking enabled",
        type: "success",
        duration: 1500,
      });
    }
  };

  const handleQuietCycle = () => {
    dependencyState.enable();

    const currentLevel = dependencyState.logLevel;
    let newLevel: "quiet" | "normal" | "verbose";
    let message: string;

    if (currentLevel === "quiet") {
      newLevel = "normal";
      message = "Dependencies: Normal mode";
    } else if (currentLevel === "normal") {
      newLevel = "verbose";
      message = "Dependencies: Verbose mode";
    } else {
      newLevel = "quiet";
      message = "Dependencies: Quiet mode";
    }

    dependencyState.setLogLevel(newLevel);
    setDebugDisplayContent({
      message,
      type: "info",
      duration: 1500,
    });
  };

  const handleFilterCycle = () => {
    dependencyState.enable();

    const currentFilter = dependencyState.filter;
    let newFilter: "all" | "functions-only" | "objects-only" | "unstable-only";
    let message: string;

    if (currentFilter === "all" || !currentFilter) {
      newFilter = "functions-only";
      message = "Filter: Functions only";
    } else if (currentFilter === "functions-only") {
      newFilter = "objects-only";
      message = "Filter: Objects only";
    } else if (currentFilter === "objects-only") {
      newFilter = "unstable-only";
      message = "Filter: Unstable only";
    } else {
      newFilter = "all";
      message = "Filter: All dependencies";
    }

    dependencyState.setFilter(newFilter);
    setDebugDisplayContent({
      message,
      type: "info",
      duration: 1500,
    });
  };

  const handleProbeTest = () => {
    if (isRunningProbe) return;

    // Ensure dependency tracking is enabled
    if (!dependencyState.enabled) {
      dependencyState.enable();
      dependencyState.setLogLevel("verbose");
    } else if (dependencyState.logLevel === "quiet") {
      dependencyState.setLogLevel("normal");
    }

    setIsRunningProbe(true);
    setDebugDisplayContent({
      message: "Starting re-render probe...",
      type: "info",
      duration: 2000,
    });
  };

  const handleProbeComplete = () => {
    setIsRunningProbe(false);
    setDebugDisplayContent({
      message: "Probe test completed",
      type: "success",
      duration: 2000,
    });
  };

  const handleAdvancedToggle = () => {
    const newValue = !showAdvanced;
    if (externalShowAdvanced === undefined) {
      setInternalShowAdvanced(newValue);
    }
    onAdvancedToggle?.(newValue);
  };

  // Display helpers
  const getDependenciesColor = () =>
    dependencyState.enabled ? "bg-green-500" : "bg-red-500";

  const getQuietDisplayText = () => {
    if (!dependencyState.enabled) return "Quiet";
    const level = dependencyState.logLevel;
    if (level === "quiet") return "Quiet";
    if (level === "verbose") return "Verbose";
    return "Normal";
  };

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

  const renderFilterIndicator = () => {
    if (!dependencyState.enabled) {
      return <ThreeDotIndicator activeDots={[false, false, false]} />;
    }

    const currentFilter = dependencyState.filter;
    const isAll = currentFilter === "all" || !currentFilter;

    const activeDots = [
      isAll || currentFilter === "functions-only",
      isAll || currentFilter === "objects-only",
      isAll || currentFilter === "unstable-only",
    ];

    return <ThreeDotIndicator activeDots={activeDots} />;
  };

  return (
    <>
      <div
        className={`flex flex-col shrink-0 ${className}`}
        style={{ gap: "0px" }}
      >
        {/* Row 1: Deps | Quiet/Normal/Verbose */}
        <div className="flex items-center gap-0.5 h-[20px]">
          <Button
            onClick={handleDependenciesToggle}
            variant="ghost"
            size="xs"
            className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
            style={buttonStyle}
            title={
              dependencyState.enabled
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
            style={buttonStyle}
            title="Cycle between Quiet → Normal → Verbose modes"
          >
            {renderLevelIndicator()}
            <span className="leading-none truncate">
              {getQuietDisplayText()}
            </span>
          </Button>
        </div>

        {/* Row 2: Filter | Probe | Adv. */}
        <div className="flex items-center gap-0.5 overflow-x-auto h-[20px]">
          <Button
            onClick={handleFilterCycle}
            variant="ghost"
            size="xs"
            className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
            style={buttonStyle}
            title="Cycle between All → Func → Obj → Unstable filters"
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
            style={buttonStyle}
            title="Run comprehensive re-render probe to verify dependency tracking"
          >
            <span className="leading-none truncate">
              {isRunningProbe ? "..." : "Probe"}
            </span>
          </Button>

          <Button
            onClick={handleAdvancedToggle}
            variant="ghost"
            size="xs"
            className="justify-center px-1.5 py-0.5 w-10 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
            style={buttonStyle}
            title="Toggle advanced dependency controls panel"
          >
            <span className="leading-none truncate">Adv.</span>
          </Button>
        </div>
      </div>

      {/* Probe component (hidden until triggered) */}
      {isRunningProbe && (
        <ProbeReRenderDetection
          onComplete={handleProbeComplete}
          onStatusUpdate={(status) => console.log("Probe status:", status)}
        />
      )}

      {/* Advanced Panel */}
      {showAdvanced && (
        <div className="mt-2">
          <DependencyAdvancedPanel
            showToggle={false}
            isVisible={true}
            theme={theme}
          />
        </div>
      )}
    </>
  );
};
