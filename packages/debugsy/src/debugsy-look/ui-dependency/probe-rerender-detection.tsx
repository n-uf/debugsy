"use client";

import { useRenderTracker, useWhyDidYouUpdate } from "@workspace/debugsy";
import React from "react";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../ui-display";

export interface ProbeReRenderDetectionProps {
  onComplete: () => void; // Simplified - just signals completion, no data
  onStatusUpdate?: (status: string) => void;
}

/**
 * Headless Probe Component for Re-render Detection Testing
 *
 * This component runs dependency tracking tests and reports results via the debug display system.
 * It renders no UI of its own - all visual feedback goes through setDebugDisplayContent.
 * Handles its own result display logic internally.
 *
 * DESIGN:
 * - Creates rapid re-renders with 50ms intervals to trigger frequency warnings
 * - Uses various unstable dependency types (objects, functions, arrays)
 * - Reports all status via debug display system
 * - Limited to 8 renders to prevent browser issues
 * - Uses callback-based detection for both dependency and render rate warnings
 * - Completely headless - no custom UI rendering
 * - Self-contained display logic for results
 * - No console.warn interception - uses proper React hook callbacks
 */
export const ProbeReRenderDetection: React.FC<ProbeReRenderDetectionProps> = ({
  onComplete,
  onStatusUpdate,
}) => {
  const [renderCount, setRenderCount] = React.useState(0);
  const [startTime] = React.useState(Date.now());
  const [warningsDetected, setWarningsDetected] = React.useState(0);
  const [renderRateNotifications, setRenderRateNotifications] =
    React.useState(0);
  const maxRenders = 8;
  const renderInterval = 50;

  // 🚨 Use render tracker with low threshold and callback
  const renderInfo = useRenderTracker("ProbeReRenderDetection", 3, (info) => {
    // Callback when excessive renders are detected
    console.log("🚨 Excessive render rate detected:", info);
    setRenderRateNotifications(info.alertsTriggered);
  });

  // Create intentionally unstable dependencies that change every render
  const unstableObject = {
    timestamp: Date.now(),
    random: Math.random(),
    nested: { value: Date.now() },
  };
  const unstableFunction = React.useCallback(() => Date.now(), [Date.now()]);
  const unstableArray = [Date.now(), Math.random(), `render-${renderCount}`];

  // Track the unstable dependencies with useWhyDidYouUpdate - now using callback approach
  const dependencyInfo = useWhyDidYouUpdate(
    "ProbeReRenderDetection",
    {
      unstableObject,
      unstableFunction,
      unstableArray,
      renderCount,
      extraData: { phase: "testing", iteration: renderCount },
    },
    (info) => {
      // Callback when frequent changes are detected
      console.log("🎯 Frequent dependency changes detected:", info);
      // Track frequent changes for warning count
      if (info.hasFrequentChanges) {
        setWarningsDetected((prev) => prev + info.frequentChangeTypes.length);
      }
    }
  );

  // Also track total dependency changes from the returned info
  React.useEffect(() => {
    if (dependencyInfo.changesCount > 0) {
      // Update total warning count based on both frequent and all changes
      const totalRelevantChanges = dependencyInfo.hasFrequentChanges
        ? dependencyInfo.frequentChangeTypes.length
        : Math.min(dependencyInfo.changesCount, 3); // Cap non-frequent changes

      setWarningsDetected(totalRelevantChanges);
    }
  }, [
    dependencyInfo.changesCount,
    dependencyInfo.hasFrequentChanges,
    dependencyInfo.frequentChangeTypes.length,
  ]);

  // Also track render rate alerts from the returned info
  React.useEffect(() => {
    if (renderInfo.alertsTriggered > 0) {
      setRenderRateNotifications(renderInfo.alertsTriggered);
    }
  }, [renderInfo.alertsTriggered]);

  // Force runtime phase for stronger warnings after a few renders
  React.useEffect(() => {
    if (renderCount >= 3) {
      try {
        // Try to force the system into runtime phase for stronger warnings
        const {
          initializationPhase,
        } = require("../../debugsy-deps/logic/change-tracking");
        if (
          initializationPhase &&
          typeof initializationPhase.markComponentSeen === "function"
        ) {
          // Accelerate the phase transition by calling markComponentSeen multiple times
          initializationPhase.markComponentSeen();
          initializationPhase.markComponentSeen();
        }
      } catch (error) {
        // Silently ignore if the import fails - not critical for probe operation
        console.debug("Could not access initialization phase control:", error);
      }
    }
  }, [renderCount]);

  React.useEffect(() => {
    const progress = ((renderCount / maxRenders) * 100).toFixed(0);
    const statusType =
      warningsDetected > 0 || renderRateNotifications > 0 ? "success" : "info";

    // Enhanced readability with minimal text
    const status =
      warningsDetected > 0 || renderRateNotifications > 0
        ? "Working"
        : "Testing";
    const currentStatus = `Probe ${progress}% | ${warningsDetected} deps, ${renderRateNotifications} rates | ${status}`;

    setDebugDisplayContent({
      message: currentStatus,
      type: statusType,
    });

    // Call status update callback if provided
    onStatusUpdate?.(currentStatus);

    if (renderCount < maxRenders) {
      // Cause another render with faster intervals to trigger warnings
      const timeout = setTimeout(() => {
        setRenderCount((prev) => prev + 1);
      }, renderInterval);

      return () => clearTimeout(timeout);
    } else {
      // Test complete - handle result display internally
      const duration = Date.now() - startTime;
      const renderRate = (renderCount / (duration / 1000)).toFixed(1);

      const wasSuccessful = warningsDetected > 0 || renderRateNotifications > 0;
      const resultType = wasSuccessful ? "success" : "warning";

      // Enhanced readability with minimal text, fewer emojis
      const displayMessage = wasSuccessful
        ? `✅ Probe Success: ${warningsDetected} deps, ${renderRateNotifications} rates detected (${renderRate}/sec)`
        : `⚠️ Probe Complete: No detections at ${renderRate}/sec - check config`;

      // Clear any existing display first
      clearDebugDisplayContent();

      // Show results for 10 seconds
      setDebugDisplayContent({
        message: displayMessage,
        type: resultType,
        duration: 10000, // Auto-clear after 10 seconds
      });

      // Log detailed results to console
      console.log("🎯 Probe completed:", {
        success: wasSuccessful,
        renderCount,
        duration,
        renderRate,
        renderInterval,
        warningsDetected,
        renderRateNotifications,
        dependencyInfo, // Structured dependency change information
        renderInfo, // Structured render rate information
      });

      // Signal completion to parent (no data needed)
      onComplete();
    }
  }, [
    renderCount,
    maxRenders,
    startTime,
    onComplete,
    onStatusUpdate,
    warningsDetected,
    renderRateNotifications,
    renderInterval,
  ]);

  // 🎯 HEADLESS: This component renders nothing - all UI goes through debug display system
  return null;
};
