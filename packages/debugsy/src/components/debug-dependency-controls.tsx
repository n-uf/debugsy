"use client";

import React, { useState } from "react";
import { useDependencyState } from "../hooks/use-debug";

export interface DebugDependencyControlsProps {
  className?: string;
}

/**
 * Debug Dependency Controls - Direct connection to global debug-deps.ts state
 *
 * All buttons represent and modify the same global state as console commands:
 * - surfaceDebug.deps.off()
 * - surfaceDebug.deps.quiet()
 * - surfaceDebug.deps.functionsOnly()
 * - surfaceDebug.deps.unstableOnly()
 *
 * Always shows controls, even when global state is not initialized.
 * Clicking buttons will initialize the global state if needed.
 */
export const DebugDependencyControls: React.FC<
  DebugDependencyControlsProps
> = ({ className = "" }) => {
  const { state, methods, isInitialized } = useDependencyState();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customHooks, setCustomHooks] = useState("");

  // Safe method caller - handles uninitialized state
  const safeCall = (methodPath: string, fallback: () => void) => {
    try {
      const pathParts = methodPath.split(".");
      let current = methods;
      for (const part of pathParts) {
        if (current && typeof current === "object" && part in current) {
          current = current[part];
        } else {
          console.warn(
            `⚠️ Method ${methodPath} not available, state not initialized`
          );
          fallback();
          return;
        }
      }
      if (typeof current === "function") {
        current();
      } else {
        console.warn(`⚠️ ${methodPath} is not a function`);
        fallback();
      }
    } catch (error) {
      console.warn(`⚠️ Error calling ${methodPath}:`, error);
      fallback();
    }
  };

  // Button handlers that work with both initialized and uninitialized state
  const handleDependenciesToggle = () => {
    console.log("🔵 Dependencies toggle, current enabled:", state.enabled);
    if (state.enabled) {
      safeCall("deps.off", () =>
        console.log("Would call surfaceDebug.deps.off()")
      );
    } else {
      safeCall("deps.normal", () =>
        console.log("Would call surfaceDebug.deps.normal()")
      );
    }
  };

  const handleQuietMode = () => {
    console.log("🔵 Quiet mode");
    safeCall("deps.quiet", () =>
      console.log("Would call surfaceDebug.deps.quiet()")
    );
  };

  const handleFunctionsMode = () => {
    console.log("🔵 Functions mode");
    safeCall("deps.functionsOnly", () =>
      console.log("Would call surfaceDebug.deps.functionsOnly()")
    );
  };

  const handleUnstableMode = () => {
    console.log("🔵 Unstable mode");
    safeCall("deps.unstableOnly", () =>
      console.log("Would call surfaceDebug.deps.unstableOnly()")
    );
  };

  // Advanced filter handlers
  const handleLevelChange = (level: string) => {
    const methodMap: Record<string, string> = {
      silent: "deps.off",
      quiet: "deps.quiet",
      normal: "deps.normal",
      verbose: "deps.verbose",
      debug: "deps.verbose", // Map debug to verbose for now
    };
    const methodPath = methodMap[level];
    if (methodPath) {
      safeCall(methodPath, () =>
        console.log(`Would call surfaceDebug.${methodPath}()`)
      );
    }
  };

  const handleFilterChange = (filter: string) => {
    const methodMap: Record<string, string> = {
      "functions-only": "deps.functionsOnly",
      "objects-only": "deps.objectsOnly",
      "unstable-only": "deps.unstableOnly",
      all: "deps.normal",
    };
    const methodPath = methodMap[filter];
    if (methodPath) {
      safeCall(methodPath, () =>
        console.log(`Would call surfaceDebug.${methodPath}()`)
      );
    } else {
      safeCall("setDependencyFilter", () =>
        console.log(`Would call surfaceDebug.setDependencyFilter("${filter}")`)
      );
    }
  };

  const handleHookFilter = () => {
    const hooks = customHooks
      .split(",")
      .map((h) => h.trim())
      .filter(Boolean);
    if (hooks.length > 0) {
      safeCall("filterDependencies", () =>
        console.log(
          `Would call surfaceDebug.filterDependencies([${hooks.join(", ")}])`
        )
      );
    } else {
      safeCall("resetDependencyFilters", () =>
        console.log("Would call surfaceDebug.resetDependencyFilters()")
      );
    }
  };

  // Indicator logic based on actual global state
  const getDependenciesColor = () =>
    state.enabled ? "bg-green-500" : "bg-red-500";
  const getQuietColor = () =>
    state.enabled && state.level === "quiet" ? "bg-green-500" : "bg-red-200";
  const getFunctionsColor = () =>
    state.enabled && state.filter === "functions-only"
      ? "bg-blue-500"
      : "bg-red-200";
  const getUnstableColor = () =>
    state.enabled && state.filter === "unstable-only"
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
                : state.enabled
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

        {/* Second Row - Mode buttons */}
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

      {/* Advanced Controls */}
      {showAdvanced && (
        <div className="mt-2 p-2 bg-yellow-50 rounded text-xs">
          {/* Current State Display */}
          <div className="space-y-1 mb-2">
            <div>
              <strong>Global State:</strong>
            </div>
            <div>
              Initialized:{" "}
              <span
                className={isInitialized ? "text-green-600" : "text-red-600"}
              >
                {isInitialized.toString()}
              </span>
            </div>
            <div>
              Enabled:{" "}
              <span
                className={state.enabled ? "text-green-600" : "text-red-600"}
              >
                {state.enabled.toString()}
              </span>
            </div>
            <div>
              Level: <span className="text-blue-600">{state.level}</span>
            </div>
            <div>
              Filter: <span className="text-purple-600">{state.filter}</span>
            </div>
            {state.allowedHooks && (
              <div>
                Allowed Hooks:{" "}
                <span className="text-orange-600">
                  {state.allowedHooks.join(", ")}
                </span>
              </div>
            )}
            {state.excludedHooks.length > 0 && (
              <div>
                Excluded:{" "}
                <span className="text-red-600">
                  {state.excludedHooks.join(", ")}
                </span>
              </div>
            )}
          </div>

          {/* Advanced Controls */}
          <div className="space-y-2 pt-2 border-t border-gray-200">
            {/* Log Level */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium text-gray-600 min-w-[40px]"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                Level:
              </label>
              <select
                value={state.level}
                onChange={(e) => handleLevelChange(e.target.value)}
                className="border border-gray-300 rounded px-1 py-0.5 flex-1"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                <option value="silent">Silent</option>
                <option value="quiet">Quiet</option>
                <option value="normal">Normal</option>
                <option value="verbose">Verbose</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            {/* Filter Type */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium text-gray-600 min-w-[40px]"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                Filter:
              </label>
              <select
                value={state.filter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="border border-gray-300 rounded px-1 py-0.5 flex-1"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                <option value="all">All</option>
                <option value="functions-only">Functions Only</option>
                <option value="objects-only">Objects Only</option>
                <option value="unstable-only">Unstable Only</option>
                <option value="stable-only">Stable Only</option>
                <option value="loop-risks">Loop Risks</option>
              </select>
            </div>

            {/* Hook Filtering */}
            <div className="flex items-center gap-2">
              <label
                className="font-medium text-gray-600 min-w-[40px]"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                Hooks:
              </label>
              <input
                type="text"
                value={customHooks}
                onChange={(e) => setCustomHooks(e.target.value)}
                placeholder="hook1,hook2,..."
                className="border border-gray-300 rounded px-1 py-0.5 flex-1"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              />
              <button
                onClick={handleHookFilter}
                className="bg-gray-100 text-gray-600 rounded hover:bg-gray-200 px-1.5 py-0.5"
                style={{ fontSize: "10px", lineHeight: "12px" }}
              >
                Apply
              </button>
            </div>
          </div>

          {/* Console Commands Reference */}
          <div className="pt-2 border-t border-gray-200 text-gray-600">
            <div>
              <strong>Console Commands:</strong>
            </div>
            <div>surfaceDebug.deps.off()</div>
            <div>surfaceDebug.deps.quiet()</div>
            <div>surfaceDebug.deps.functionsOnly()</div>
            <div>surfaceDebug.deps.unstableOnly()</div>
            <div>surfaceDebug.filterDependencies(["hook"])</div>
            <div>surfaceDebug.resetDependencyFilters()</div>
          </div>
        </div>
      )}
    </div>
  );
};

DebugDependencyControls.displayName = "DebugDependencyControls";
