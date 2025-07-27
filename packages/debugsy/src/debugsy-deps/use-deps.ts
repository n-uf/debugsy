/**
 * Debug Deps - React Hook Dependency Tracking
 *
 * MIGRATED: Now uses unified debugsy logging system as core logger
 * REFACTORED: Split into focused responsibility modules + extracted utilities
 *
 * ARCHITECTURE: Deps as Debugsy Extension
 * - Core debugsy handles all logging, state management, and UI integration
 * - Deps module focuses only on React-specific tracking logic
 * - Clean separation of concerns with unified interface
 *
 * MODULES:
 * - deps-logger.ts: Unified logging system
 * - deps-state.ts: State access and management
 * - change-tracking.ts: Frequency detection and initialization tracking
 * - deps-filters.ts: Filtering logic for what to log
 * - deps-utilities.ts: Utility functions for change analysis and logging
 * - debug-deps.ts (this file): React hooks orchestration
 *
 * Provides enhanced dependency tracking for React hooks to debug:
 * - Circular re-rendering
 * - Ineffective memoization
 * - Render loops
 * - Unstable prop changes
 */

import { useEffect, useRef } from "react";
import { logWarnToDebugSystem } from "./deps-logger";
import { getDepsSettings } from "./deps-settings";
import { analyzeChanges } from "./logic/change-utils";

/**
 * Enhanced deps tracking that respects unified debug controls
 * REFACTORED: Extracted complex utility logic for better maintainability
 *
 * Features:
 * - Smart frequency detection with initialization-aware logic
 * - Progressive filtering based on app lifecycle phase
 * - Detailed change analysis with type discrimination
 * - Performance-conscious throttling
 * - Clean separation between React logic and analysis utilities
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>
): void {
  // ALWAYS call hooks first - never conditionally skip them
  const previousProps = useRef<Record<string, any> | undefined>(undefined);
  const lastLogTime = useRef(0);

  // Get current deps state - AFTER hooks are called
  const depsState = getDepsSettings();

  // Early return if deps tracking disabled - but AFTER calling hooks
  if (
    !depsState.enabled ||
    !props ||
    typeof props !== "object" ||
    Object.keys(props).length === 0
  ) {
    return;
  }

  // Throttling check using current state
  const now = Date.now();
  const currentDepsState = getDepsSettings();

  // Respect throttling settings from current state
  if (now - lastLogTime.current < currentDepsState.throttleMs) {
    return;
  }

  useEffect(() => {
    // Skip on first render (no previous props to compare)
    if (previousProps.current === undefined) {
      previousProps.current = props;
      return;
    }

    // Use extracted utility for change analysis and logging
    analyzeChanges(name, previousProps.current, props);

    // Update for next render
    previousProps.current = props;
    lastLogTime.current = now;
  });
}

/**
 * Simplified render tracking hook
 * Tracks render frequency and logs warnings for excessive renders
 */
export function useRenderTracker(
  componentName: string,
  threshold: number = 10
): void {
  // Hook calls first
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());

  // State check after hooks
  const depsState = getDepsSettings();
  if (!depsState.enabled) {
    return;
  }

  useEffect(() => {
    renderCount.current += 1;

    // Log warning if excessive renders detected
    if (renderCount.current >= threshold) {
      const timeElapsed = Date.now() - startTime.current;
      const renderRate = renderCount.current / (timeElapsed / 1000);

      logWarnToDebugSystem(
        `${componentName} has rendered ${renderCount.current} times in ${timeElapsed}ms (${renderRate.toFixed(
          2
        )} renders/sec). This may indicate a render loop.`,
        {
          component: componentName,
          renderCount: renderCount.current,
          timeElapsed,
          renderRate,
          threshold,
        }
      );

      // Reset counter to prevent spam
      renderCount.current = 0;
      startTime.current = Date.now();
    }
  });
}
