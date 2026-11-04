"use client";

import { Word } from "../ui";
import React, { useState } from "react";
import { ProbeReRenderDetection } from "./probe-rerender-detection";
import { useDepsSettings } from "../debugsy-space/debugsy-space-settings";
import { setDebugDisplayContent } from "../shared/debug-display-state";
import { DependencyAdvancedPanel } from "./dependency-advanced-panel";

export interface DependencyControlsProps {
  /** @deprecated Ignored since the panel styles itself */
  theme?: unknown;
  className?: string;
  onAdvancedToggle?: (show: boolean) => void;
  showAdvanced?: boolean;
}

const LEVELS: readonly string[] = ["quiet", "normal", "verbose"];
const LEVEL_LABEL: Record<string, string> = {
  silent: "Silent",
  quiet: "Quiet",
  normal: "Normal",
  verbose: "Verbose",
};
const FILTER_OPTIONS = ["functions-only", "objects-only", "unstable-only"] as const;
const FILTER_LABEL: Record<string, string> = {
  all: "All",
  "functions-only": "Func",
  "objects-only": "Obj",
  "unstable-only": "Unstable",
};

/**
 * DependencyControls - the dependency-tracking words in the control tray:
 * on/off, level (Quiet → Normal → Verbose), filter (All → Func → Obj →
 * Unstable), the re-render probe and the advanced panel.
 */
export const DependencyControls: React.FC<DependencyControlsProps> = ({
  className = "",
  onAdvancedToggle,
  showAdvanced: externalShowAdvanced,
}) => {
  const dependencyState = useDepsSettings();
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);
  const [isRunningProbe, setIsRunningProbe] = useState(false);

  // Use external control if provided, otherwise use internal state
  const showAdvanced =
    externalShowAdvanced !== undefined
      ? externalShowAdvanced
      : internalShowAdvanced;

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
    // Auto-enable dependencies when changing log level
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
    // Auto-enable dependencies when changing filter
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

    // Ensure dependencies are enabled with appropriate log level for probe
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

  const level = dependencyState.logLevel;
  const levelIndex = LEVELS.indexOf(level);
  const filter = dependencyState.filter ?? "all";
  const filterLit = FILTER_OPTIONS.map((option) => filter === "all" || option === filter);

  return (
    <div className={className ? `dbg-deps ${className}` : "dbg-deps"}>
      <div className="dbg-rows">
        <div className="dbg-words">
          <Word
            lamp={dependencyState.enabled ? "on" : "off"}
            active={dependencyState.enabled}
            ariaPressed={dependencyState.enabled}
            onClick={handleDependenciesToggle}
            title={
              dependencyState.enabled
                ? "Click to disable (surfaceDebug.deps.off)"
                : "Click to enable (surfaceDebug.deps.normal)"
            }
          >
            Deps
          </Word>
          <Word
            segments={LEVELS.map((_, i) => i <= levelIndex)}
            disabled={!dependencyState.enabled}
            onClick={handleQuietCycle}
            title="Cycle between Quiet → Normal → Verbose modes"
          >
            {LEVEL_LABEL[level] ?? level}
          </Word>
        </div>
        <div className="dbg-words">
          <Word
            segments={filterLit}
            disabled={!dependencyState.enabled}
            onClick={handleFilterCycle}
            title="Cycle between All → Func → Obj → Unstable filters"
          >
            {FILTER_LABEL[filter] ?? filter}
          </Word>
          <Word
            lamp={isRunningProbe ? "busy" : undefined}
            busy={isRunningProbe}
            disabled={isRunningProbe}
            onClick={handleProbeTest}
            title="Run comprehensive re-render probe to verify dependency tracking"
          >
            Probe
          </Word>
          <Word
            pill
            active={showAdvanced}
            ariaPressed={showAdvanced}
            onClick={handleAdvancedToggle}
            title="Toggle advanced dependency controls panel"
          >
            Adv
          </Word>
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
        <DependencyAdvancedPanel showToggle={false} isVisible={true} />
      )}
    </div>
  );
};
