/**
 * Debug Dependencies - React Hook Dependency Tracking
 *
 * MIGRATED: Now uses unified debugsy logging system as core logger
 * REFACTORED: Split into focused responsibility modules + extracted utilities
 *
 * ARCHITECTURE: Dependencies as Debugsy Extension
 * - Core debugsy handles all logging, state management, and UI integration
 * - Dependencies module focuses only on React-specific tracking logic
 * - Clean separation of concerns with unified interface
 *
 * MODULES:
 * - dependency-logger.ts: Unified logging system
 * - dependency-state.ts: State access and management
 * - change-tracking.ts: Frequency detection and initialization tracking
 * - dependency-filters.ts: Filtering logic for what to log
 * - dependency-utilities.ts: Utility functions for change analysis and logging
 * - debug-deps.ts (this file): React hooks orchestration
 *
 * Provides enhanced dependency tracking for React hooks to debug:
 * - Circular re-rendering
 * - Ineffective memoization
 * - Render loops
 * - Unstable prop changes
 */

import { useEffect, useRef } from "react";
import { logWarnToDebugSystem } from "./dependency-logger";
import { getDependencyState } from "./dependency-state";
import { analyzeChanges, logDependencyChanges } from "./dependency-utilities";

/**
 * Enhanced dependency tracking that respects unified debug controls
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

  const dependencyState = getDependencyState();

  // Check if we should do any work (but hooks are already called)
  const shouldTrack =
    dependencyState.enabled &&
    !(globalThis as any).__DEBUGSY_EMERGENCY_STOP?.active;

  useEffect(() => {
    // Early exit if tracking is disabled, but still update previousProps
    if (!shouldTrack) {
      previousProps.current = props;
      return;
    }

    const currentDependencyState = getDependencyState();

    // Throttling
    const now = Date.now();
    if (now - lastLogTime.current < currentDependencyState.throttleMs) {
      previousProps.current = props;
      return;
    }

    if (previousProps.current) {
      // Use extracted utility to analyze changes
      const changesToLog = analyzeChanges(name, previousProps.current, props);

      // Use extracted utility to log changes
      if (changesToLog.length > 0) {
        logDependencyChanges(name, changesToLog);
        lastLogTime.current = now;
      }
    }

    previousProps.current = props;
  }); // Deliberately no deps - we want this to run on every render to track changes
}

/**
 * Enhanced version that tracks render count and warns about excessive renders
 *
 * Features:
 * - Automatic render count tracking
 * - Excessive render warnings (every 10 renders after threshold)
 * - Throttled warnings to prevent spam
 * - Delegates to useWhyDidYouUpdate for dependency analysis
 */
export function useRenderTracker(
  name: string,
  props: Record<string, any>
): void {
  const renderCount = useRef(0);
  const lastWarning = useRef(0);

  renderCount.current += 1;

  // Warn every 10 renders after threshold
  if (renderCount.current > 10 && renderCount.current % 10 === 0) {
    const now = Date.now();
    if (now - lastWarning.current > 1000) {
      // Throttle warnings to once per second
      logWarnToDebugSystem(
        `⚠️ [${name}] High render count detected: ${renderCount.current}`,
        undefined,
        "render-warning"
      );
      lastWarning.current = now;
    }
  }

  useWhyDidYouUpdate(name, props);
}
