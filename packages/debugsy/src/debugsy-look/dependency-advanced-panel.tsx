"use client";

import { Lamp, Word } from "../ui";
import React, { useState } from "react";
import type { DepsFilter } from "../debugsy-space/debugsy-constants";
import { useDepsSettings } from "../debugsy-space/debugsy-space-settings";

export interface DependencyAdvancedPanelProps {
  className?: string;
  /** Whether to show the advanced toggle word */
  showToggle?: boolean;
  /** External control of advanced panel visibility */
  isVisible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** @deprecated Ignored since the panel styles itself */
  theme?: unknown;
}

const LEVELS = [
  { value: "quiet", label: "Quiet", title: "Minimal logging - only critical changes" },
  { value: "normal", label: "Normal", title: "Standard logging - balanced detail" },
  { value: "verbose", label: "Verbose", title: "Detailed logging - all changes" },
] as const;

const FILTERS: ReadonlyArray<{ value: DepsFilter; label: string; title: string }> = [
  { value: "all", label: "All", title: "Show all dependencies" },
  { value: "functions-only", label: "Functions", title: "Only function dependencies" },
  { value: "objects-only", label: "Objects", title: "Only object dependencies" },
  { value: "unstable-only", label: "Unstable", title: "Only unstable/changing dependencies" },
];

/**
 * Advanced dependency controls: tracking on/off, level, content filter, a
 * little status, and the matching console commands.
 */
export const DependencyAdvancedPanel: React.FC<DependencyAdvancedPanelProps> = ({
  className = "",
  showToggle = true,
  isVisible,
  onVisibilityChange,
}) => {
  const dependencyState = useDepsSettings();
  const [internalShowAdvanced, setInternalShowAdvanced] = useState(false);

  // Use external visibility control if provided, otherwise use internal state
  const showAdvanced = isVisible !== undefined ? isVisible : internalShowAdvanced;

  const toggleAdvanced = () => {
    const newValue = !showAdvanced;
    if (onVisibilityChange) {
      onVisibilityChange(newValue);
    } else {
      setInternalShowAdvanced(newValue);
    }
  };

  const handleDependenciesToggle = () => {
    console.log(
      "🔵 [AdvancedControls] Dependencies toggle, current enabled:",
      dependencyState.enabled,
    );
    if (dependencyState.enabled) {
      dependencyState.disable();
    } else {
      dependencyState.enable();
    }
  };

  const handleLevel = (level: (typeof LEVELS)[number]["value"]) => {
    console.log(`📊 [AdvancedControls] Setting dependencies to ${level} mode`);
    dependencyState.enable();
    dependencyState.setLogLevel(level);
  };

  const handleFilterChange = (filter: DepsFilter) => {
    console.log(`🔧 [AdvancedControls] Setting dependency filter to: ${filter}`);
    if (filter !== "all") {
      dependencyState.enable(); // Auto-enable when setting a specific filter
    }
    dependencyState.setFilter(filter);
  };

  const latest = dependencyState.logs[dependencyState.logs.length - 1];

  return (
    <div className={className}>
      {showToggle && (
        <Word size="sm" active={showAdvanced} onClick={toggleAdvanced}>
          Advanced
        </Word>
      )}

      {showAdvanced && (
        <div className="dbg-advanced">
          <div className="dbg-advanced-row">
            <span className="dbg-advanced-label">Deps</span>
            <Word
              size="sm"
              lamp={dependencyState.enabled ? "on" : "off"}
              active={dependencyState.enabled}
              onClick={handleDependenciesToggle}
              title={dependencyState.enabled ? "Disable dependency tracking" : "Enable dependency tracking"}
            >
              {dependencyState.enabled ? "On" : "Off"}
            </Word>
          </div>

          {dependencyState.enabled && (
            <>
              <div className="dbg-advanced-row">
                <span className="dbg-advanced-label">Level</span>
                {LEVELS.map((level) => (
                  <Word
                    key={level.value}
                    size="sm"
                    pill
                    active={dependencyState.logLevel === level.value}
                    onClick={() => handleLevel(level.value)}
                    title={level.title}
                  >
                    {level.label}
                  </Word>
                ))}
              </div>
              <div className="dbg-advanced-row">
                <span className="dbg-advanced-label">Filter</span>
                {FILTERS.map((filter) => (
                  <Word
                    key={filter.value}
                    size="sm"
                    pill
                    active={dependencyState.filter === filter.value}
                    onClick={() => handleFilterChange(filter.value)}
                    title={filter.title}
                  >
                    {filter.label}
                  </Word>
                ))}
              </div>
              <div className="dbg-advanced-row">
                <span className="dbg-advanced-label">Logs</span>
                <span className="dbg-advanced-note">
                  <Lamp state={dependencyState.logs.length > 0 ? "ok" : "off"} />{" "}
                  {dependencyState.logs.length}
                  {latest && ` · latest ${new Date(latest.timestamp || Date.now()).toLocaleTimeString()}`}
                  {dependencyState.logs.length === 0 && " · interact with components to see tracking"}
                </span>
              </div>
            </>
          )}

          <div className="dbg-advanced-row">
            <span className="dbg-advanced-label">Console</span>
            <code className="dbg-advanced-note">
              surfaceDebug.deps.off() · surfaceDebug.deps.{dependencyState.logLevel}() ·
              surfaceDebug.deps.{dependencyState.filter.replace("-", "")}()
            </code>
          </div>
        </div>
      )}
    </div>
  );
};
