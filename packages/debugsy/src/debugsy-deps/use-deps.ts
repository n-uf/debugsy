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
  getMountRateSeverity,
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

// Global state for mount rate notifications
const mountRateNotifier = {
  lastNotification: 0,
  notificationCooldown: DEPS_CONFIG_DEFAULTS.mountRateNotificationCooldown,
  displayDuration: DEPS_CONFIG_DEFAULTS.mountRateDisplayDuration,

  // Allow configuration updates
  updateConfig(config: DepsConfigThresholds) {
    this.notificationCooldown = config.mountRateNotificationCooldown;
    this.displayDuration = config.mountRateDisplayDuration;
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

/**
 * Notify about high mount rates with UI feedback and configurable thresholds
 */
function notifyHighMountRate(
  componentName: string,
  mountCount: number,
  timeElapsed: number,
  mountRate: number,
  threshold: number,
  config: DepsConfigThresholds = DEPS_CONFIG_DEFAULTS
): void {
  const now = Date.now();

  // Respect cooldown period
  if (
    now - mountRateNotifier.lastNotification <
    mountRateNotifier.notificationCooldown
  ) {
    return;
  }

  mountRateNotifier.lastNotification = now;

  // Get severity from centralized config
  const severity = getMountRateSeverity(mountRate, threshold, config);

  try {
    // 🎨 UI Notification with enhanced visual feedback
    setDebugDisplayContent({
      message: `🔄 High Mount Rate
Component: ${componentName}
Rate: ${mountRate.toFixed(1)} mounts/sec
Threshold: ${threshold} mounts`,
      type: severity,
      duration: mountRateNotifier.displayDuration,
    });
  } catch (error) {
    // Fallback to console if UI system unavailable
    console.warn(
      `🚨 MOUNT RATE NOTIFIER: ${componentName} - ${mountRate.toFixed(1)} mounts/sec`
    );
  }

  // Always log to console as backup
  console.warn(
    `🚨 HIGH MOUNT RATE: ${componentName} - ${mountRate.toFixed(1)} mounts/sec (${mountCount} in ${timeElapsed}ms)`
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

// Interface for mount rate information
export interface MountRateInfo {
  mountCount: number;
  timeElapsed: number;
  mountRate: number;
  threshold: number;
  isExcessive: boolean;
  alertsTriggered: number;
}

// Options for configuring render tracker behavior
export interface RenderTrackerOptions {
  /** Threshold for render count warnings (default: 10) */
  renderThreshold?: number;
  /** Threshold for mount count warnings (default: 3) */
  mountThreshold?: number;
  /** Enable render tracking (default: true) */
  trackRenders?: boolean;
  /** Enable mount tracking (default: true) */
  trackMounts?: boolean;
  /** Callback for excessive render events */
  onExcessiveRenders?: (info: RenderRateInfo) => void;
  /** Callback for excessive mount events */
  onExcessiveMounts?: (info: MountRateInfo) => void;
}

// Combined lifecycle information returned by useRenderTracker
export interface ComponentLifecycleInfo {
  render: RenderRateInfo;
  mount: MountRateInfo;
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
 * Enhanced render and mount tracking hook with UI notifications and callback support
 * Tracks both render frequency and mount/unmount lifecycle events
 * ENHANCED: Added mount tracking and separate configuration options
 * FIXED: Rules of Hooks violation - all hooks now called unconditionally
 */
// Overloaded signatures for backward compatibility
export function useRenderTracker(
  componentName: string,
  threshold?: number,
  onExcessiveRenders?: (info: RenderRateInfo) => void
): RenderRateInfo;
export function useRenderTracker(
  componentName: string,
  options?: RenderTrackerOptions
): ComponentLifecycleInfo;
export function useRenderTracker(
  componentName: string,
  thresholdOrOptions?: number | RenderTrackerOptions,
  onExcessiveRenders?: (info: RenderRateInfo) => void
): RenderRateInfo | ComponentLifecycleInfo {
  // Parse options from parameters (backward compatibility)
  const options: RenderTrackerOptions =
    typeof thresholdOrOptions === "object" && thresholdOrOptions !== null
      ? thresholdOrOptions
      : {
          renderThreshold: thresholdOrOptions ?? 10,
          mountThreshold: DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold,
          trackRenders: true,
          trackMounts: true,
          onExcessiveRenders,
        };

  // ✅ ALWAYS call ALL hooks first - never conditionally skip them
  const renderCount = useRef(0);
  const renderStartTime = useRef<number>(Date.now());
  const renderAlertsTriggered = useRef(0);

  const mountCount = useRef(0);
  const mountStartTime = useRef<number>(Date.now());
  const mountAlertsTriggered = useRef(0);
  const isMounted = useRef(false);

  const renderInfo = useRef<RenderRateInfo>({
    renderCount: 0,
    timeElapsed: 0,
    renderRate: 0,
    threshold: options.renderThreshold ?? 10,
    isExcessive: false,
    alertsTriggered: 0,
  });

  const mountInfo = useRef<MountRateInfo>({
    mountCount: 0,
    timeElapsed: 0,
    mountRate: 0,
    threshold:
      options.mountThreshold ?? DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold,
    isExcessive: false,
    alertsTriggered: 0,
  });

  // Track mounts/unmounts
  useEffect(() => {
    const depsState = getDepsSettings();

    if (!depsState.enabled || !options.trackMounts) {
      return;
    }

    // Mount detected
    if (!isMounted.current) {
      isMounted.current = true;
      mountCount.current += 1;

      const timeElapsed = Date.now() - mountStartTime.current;
      const mountRate = mountCount.current / (timeElapsed / 1000);

      // Update mount info
      mountInfo.current = {
        mountCount: mountCount.current,
        timeElapsed,
        mountRate,
        threshold:
          options.mountThreshold ??
          DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold,
        isExcessive:
          mountCount.current >=
          (options.mountThreshold ??
            DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold),
        alertsTriggered: mountAlertsTriggered.current,
      };

      // Check for excessive mounts
      if (
        mountCount.current >=
        (options.mountThreshold ??
          DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold)
      ) {
        mountAlertsTriggered.current += 1;
        mountInfo.current.alertsTriggered = mountAlertsTriggered.current;

        console.warn(
          `${componentName} has mounted ${mountCount.current} times in ${timeElapsed}ms (${mountRate.toFixed(
            2
          )} mounts/sec). This may indicate rapid mount/unmount cycles.`,
          {
            component: componentName,
            mountCount: mountCount.current,
            timeElapsed,
            mountRate,
            threshold: options.mountThreshold,
          }
        );

        // 🚨 UI Notification System for high mount rates
        notifyHighMountRate(
          componentName,
          mountCount.current,
          timeElapsed,
          mountRate,
          options.mountThreshold ??
            DEPS_CONFIG_DEFAULTS.mountRateDefaultThreshold
        );

        // 🔔 Callback support for external handling
        if (options.onExcessiveMounts) {
          options.onExcessiveMounts(mountInfo.current);
        }

        // Reset counter to prevent spam
        mountCount.current = 0;
        mountStartTime.current = Date.now();
      }
    }

    // Cleanup: track unmount
    return () => {
      isMounted.current = false;
    };
  }, []); // Empty dependency array to track mount/unmount only

  // Track renders
  useEffect(() => {
    const depsState = getDepsSettings();

    if (!depsState.enabled || !options.trackRenders) {
      return;
    }

    renderCount.current += 1;
    const timeElapsed = Date.now() - renderStartTime.current;
    const renderRate = renderCount.current / (timeElapsed / 1000);

    // Update render info
    renderInfo.current = {
      renderCount: renderCount.current,
      timeElapsed,
      renderRate,
      threshold: options.renderThreshold ?? 10,
      isExcessive: renderCount.current >= (options.renderThreshold ?? 10),
      alertsTriggered: renderAlertsTriggered.current,
    };

    // Log warning if excessive renders detected
    if (renderCount.current >= (options.renderThreshold ?? 10)) {
      renderAlertsTriggered.current += 1;
      renderInfo.current.alertsTriggered = renderAlertsTriggered.current;

      console.warn(
        `${componentName} has rendered ${renderCount.current} times in ${timeElapsed}ms (${renderRate.toFixed(
          2
        )} renders/sec). This may indicate a render loop.`,
        {
          component: componentName,
          renderCount: renderCount.current,
          timeElapsed,
          renderRate,
          threshold: options.renderThreshold,
        }
      );

      // 🚨 UI Notification System for high render rates
      notifyHighRenderRate(
        componentName,
        renderCount.current,
        timeElapsed,
        renderRate,
        options.renderThreshold ?? 10
      );

      // 🔔 Callback support for external handling
      if (options.onExcessiveRenders) {
        options.onExcessiveRenders(renderInfo.current);
      }

      // Reset counter to prevent spam
      renderCount.current = 0;
      renderStartTime.current = Date.now();
    }
  }); // No dependency array to run on every render

  // Return appropriate format based on input type
  if (typeof thresholdOrOptions === "object" && thresholdOrOptions !== null) {
    // New API: return full lifecycle info
    return {
      render: renderInfo.current,
      mount: mountInfo.current,
    };
  } else {
    // Backward compatibility: return just render info
    return renderInfo.current;
  }
}

/**
 * Export rate notifiers for external use
 * Allows other components to trigger rate notifications
 */
export { notifyHighMountRate, notifyHighRenderRate };
