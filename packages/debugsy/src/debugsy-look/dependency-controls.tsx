"use client";

import {
  IndicatorButtonGroup,
  type IndicatorButtonTheme,
} from "@workspace/harbuz";
import React, { useState } from "react";
import { ProbeReRenderDetection } from "../debugsy-look-v1/ui-dependency/probe-rerender-detection";
import { useDepsSettings } from "../debugsy-space/debugsy-space-settings";
import { setDebugDisplayContent } from "../shared/debug-display-state";
import { DependencyAdvancedPanel } from "./dependency-advanced-panel";

export interface DependencyControlsV2Props {
  theme?: IndicatorButtonTheme;
  className?: string;
  onAdvancedToggle?: (show: boolean) => void;
  showAdvanced?: boolean;
}

/**
 * Dependency Controls V2 - Harbuz-themed implementation
 *
 * Follows exact structure and pattern from Showcase control buttons.
 * Uses IndicatorButtonGroup for consistent theming and layout.
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

  // IndicatorButtonGroup configuration with type-based indicators
  return (
    <>
      <IndicatorButtonGroup
        buttons={[
          {
            label: "Deps",
            indicatorType: "single" as const,
            onClick: handleDependenciesToggle,
            buttonVariant: "ghost" as const,
            buttonSize: "xs" as const,
            variant: "success" as const,
            active: dependencyState.enabled,
            inactiveVariant: "error" as const,
            title: dependencyState.enabled
              ? "Click to disable (surfaceDebug.deps.off)"
              : "Click to enable (surfaceDebug.deps.normal)",
          },
          {
            label: "Quiet",
            indicatorType: "sequential" as const,
            value: dependencyState.logLevel,
            levels: ["quiet", "normal", "verbose"],
            labelMap: {
              quiet: "Quiet",
              normal: "Normal",
              verbose: "Verbose",
            },
            disabled: !dependencyState.enabled,
            onClick: handleQuietCycle,
            buttonVariant: "ghost" as const,
            buttonSize: "xs" as const,
            title: "Cycle between Quiet → Normal → Verbose modes",
          },
          { type: "row-break" as const }, // Start new row (V1 layout: 2+3 buttons)
          {
            label: "All",
            indicatorType: "parallel" as const,
            value: dependencyState.filter ?? "all",
            options: ["functions-only", "objects-only", "unstable-only"],
            allValue: "all",
            labelMap: {
              all: "All",
              "functions-only": "Func",
              "objects-only": "Obj",
              "unstable-only": "Unstable",
            },
            disabled: !dependencyState.enabled,
            onClick: handleFilterCycle,
            buttonVariant: "ghost" as const,
            buttonSize: "xs" as const,
            title: "Cycle between All → Func → Obj → Unstable filters",
          },
          {
            label: isRunningProbe ? "..." : "Probe",
            indicatorType: "none" as const,
            onClick: handleProbeTest,
            disabled: isRunningProbe,
            buttonVariant: "ghost" as const,
            buttonSize: "xs" as const,
            width: "narrow" as const,
            justify: "center" as const,
            className: isRunningProbe ? "text-gray-400" : "text-gray-600",
            title:
              "Run comprehensive re-render probe to verify dependency tracking",
          },
          {
            label: "Adv.",
            indicatorType: "none" as const,
            onClick: handleAdvancedToggle,
            buttonVariant: "ghost" as const,
            buttonSize: "xs" as const,
            width: "narrow" as const,
            justify: "center" as const,
            className: showAdvanced
              ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
              : "",
            title: "Toggle advanced dependency controls panel",
          },
        ]}
        theme={theme}
        gap="2px"
        className={className}
      />

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
