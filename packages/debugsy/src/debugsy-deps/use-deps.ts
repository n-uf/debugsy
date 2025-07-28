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
import { setDebugDisplayContent } from "../debugsy-look/ui-display/debug-display-state";
import {
  DEPS_CONFIG_DEFAULTS,
  getRenderRateSeverity,
  type DepsConfigThresholds,
} from "./deps-config";
import { getDepsSettings } from "./deps-settings";
import { analyzeChanges, logDependencyChanges } from "./logic/change-utils";

// Global state for render rate notifications
const renderRateNotifier = {
  lastNotification: 0,
  notificationCooldown: DEPS_CONFIG_DEFAULTS.renderRateNotificationCooldown,
  displayDuration: DEPS_CONFIG_DEFAULTS.renderRateDisplayDuration,

  // Allow configuration updates
  updateConfig(config: DepsConfigThresholds) {
    this.notificationCooldown = config.renderRateNotificationCooldown;
    this.displayDuration = config.renderRateDisplayDuration;
  },
};

/**
 * Notify about high render rates with UI feedback and configurable thresholds
 */
function notifyHighRenderRate(
  componentName: string,
  renderCount: number,
  timeElapsed: number,
  renderRate: number,
  threshold: number,
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): void {
  const now = Date.now();

  // Respect cooldown period
  if (
    now - renderRateNotifier.lastNotification <
    renderRateNotifier.notificationCooldown
  ) {
    return;
  }

  renderRateNotifier.lastNotification = now;

  // Get severity from centralized config
  const severity = getRenderRateSeverity(renderRate, threshold, config);

  try {
    // 🎨 UI Notification with enhanced visual feedback
    setDebugDisplayContent({
      message: `⚠️ High Render Rate
Component: ${componentName}
Rate: ${renderRate.toFixed(1)} renders/sec
Threshold: ${threshold} renders`,
      type: severity,
      duration: renderRateNotifier.displayDuration,
    });
  } catch (error) {
    // Fallback to console if UI system unavailable
    console.warn(
      `🚨 RENDER RATE NOTIFIER: ${componentName} - ${renderRate.toFixed(1)} renders/sec`
    );
  }

  // Always log to console as backup
  console.warn(
    `🚨 HIGH RENDER RATE: ${componentName} - ${renderRate.toFixed(1)} renders/sec (${renderCount} in ${timeElapsed}ms)`
  );
}

// Interface for dependency change information
export interface DependencyChangeInfo {
  changesCount: number;
  hasFrequentChanges: boolean;
  changeTypes: Array<"function" | "object" | "primitive">;
  frequentChangeTypes: Array<"function" | "object" | "primitive">;
}

// Interface for render rate information
export interface RenderRateInfo {
  renderCount: number;
  timeElapsed: number;
  renderRate: number;
  threshold: number;
  isExcessive: boolean;
  alertsTriggered: number;
}

/**
 * Enhanced deps tracking that respects unified debug controls
 * REFACTORED: Extracted complex utility logic for better maintainability
 * FIXED: Rules of Hooks violation - all hooks now called unconditionally
 * ENHANCED: Returns dependency change information and accepts callback
 *
 * Features:
 * - Smart frequency detection with initialization-aware logic
 * - Progressive filtering based on app lifecycle phase
 * - Detailed change analysis with type discrimination
 * - Performance-conscious throttling
 * - Clean separation between React logic and analysis utilities
 * - Returns change information for caller to handle
 */
export function useWhyDidYouUpdate(
  name: string,
  props: Record<string, any>,
  onFrequentChanges?: (info: DependencyChangeInfo) => void
): DependencyChangeInfo {
  // ✅ ALWAYS call ALL hooks first - never conditionally skip them
  const previousProps = useRef<Record<string, any> | undefined>(undefined);
  const lastLogTime = useRef(0);
  const changeInfo = useRef<DependencyChangeInfo>({
    changesCount: 0,
    hasFrequentChanges: false,
    changeTypes: [],
    frequentChangeTypes: [],
  });

  // ✅ RULES OF HOOKS FIX: useEffect MUST always be called - move conditions inside
  useEffect(() => {
    // Get current deps state inside effect
    const depsState = getDepsSettings();

    // Early return if deps tracking disabled - but INSIDE the effect
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

    // Skip on first render (no previous props to compare)
    if (previousProps.current === undefined) {
      previousProps.current = props;
      return;
    }

    // Use extracted utility for change analysis and logging
    const changes = analyzeChanges(name, previousProps.current, props);

    if (changes.length > 0) {
      logDependencyChanges(name, changes);

      // Update change information
      const changeTypes = changes.map((change) => change.type);
      const frequentChanges = changes.filter((change) => !change.isStable);
      const frequentChangeTypes = frequentChanges.map((change) => change.type);
      const hasFrequentChanges = frequentChanges.length > 0;

      changeInfo.current = {
        changesCount: changes.length,
        hasFrequentChanges,
        changeTypes,
        frequentChangeTypes,
      };

      // Call callback if frequent changes detected
      if (hasFrequentChanges && onFrequentChanges) {
        onFrequentChanges(changeInfo.current);
      }
    }

    // Update for next render
    previousProps.current = props;
    lastLogTime.current = now;
  }); // Note: No dependency array to run on every render

  return changeInfo.current;
}

/**
 * Enhanced render tracking hook with UI notifications and callback support
 * Tracks render frequency and provides callback when excessive renders detected
 * FIXED: Rules of Hooks violation - all hooks now called unconditionally
 * ENHANCED: Added callback support and return value for render rate info
 */
export function useRenderTracker(
  componentName: string,
  threshold: number = 10,
  onExcessiveRenders?: (info: RenderRateInfo) => void
): RenderRateInfo {
  // ✅ ALWAYS call ALL hooks first - never conditionally skip them
  const renderCount = useRef(0);
  const startTime = useRef<number>(Date.now());
  const alertsTriggered = useRef(0);
  const renderInfo = useRef<RenderRateInfo>({
    renderCount: 0,
    timeElapsed: 0,
    renderRate: 0,
    threshold,
    isExcessive: false,
    alertsTriggered: 0,
  });

  // ✅ RULES OF HOOKS FIX: useEffect MUST always be called - move conditions inside
  useEffect(() => {
    // Get current deps state inside effect
    const depsState = getDepsSettings();

    // Early return if deps tracking disabled - but INSIDE the effect
    if (!depsState.enabled) {
      return;
    }

    renderCount.current += 1;
    const timeElapsed = Date.now() - startTime.current;
    const renderRate = renderCount.current / (timeElapsed / 1000);

    // Update render info
    renderInfo.current = {
      renderCount: renderCount.current,
      timeElapsed,
      renderRate,
      threshold,
      isExcessive: renderCount.current >= threshold,
      alertsTriggered: alertsTriggered.current,
    };

    // Log warning if excessive renders detected
    if (renderCount.current >= threshold) {
      alertsTriggered.current += 1;
      renderInfo.current.alertsTriggered = alertsTriggered.current;

      // Console logging
      // Assuming logWarnToDebugSystem is available from deps-logger or similar
      // For now, keeping the original console.warn as a fallback
      console.warn(
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

      // 🚨 UI Notification System for high render rates
      notifyHighRenderRate(
        componentName,
        renderCount.current,
        timeElapsed,
        renderRate,
        threshold
      );

      // 🔔 NEW: Callback support for external handling
      if (onExcessiveRenders) {
        onExcessiveRenders(renderInfo.current);
      }

      // Reset counter to prevent spam
      renderCount.current = 0;
      startTime.current = Date.now();
    }
  }); // Note: No dependency array to run on every render

  return renderInfo.current;
}

/**
 * Export render rate notifier for external use
 * Allows other components to trigger render rate notifications
 */
export { notifyHighRenderRate };
