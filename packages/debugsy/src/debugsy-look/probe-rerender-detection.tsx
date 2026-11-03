"use client";

import { useRenderTracker, useWhyDidYouUpdate } from "../debugsy-deps";
import React from "react";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../shared/debug-display-state";

export interface ProbeReRenderDetectionProps {
  onComplete: () => void;
  onStatusUpdate?: (status: string) => void;
}

/**
 * Headless Probe Component for Re-render Detection Testing
 *
 * Runs dependency tracking tests and reports results via the debug display system.
 * Renders no UI — all visual feedback goes through setDebugDisplayContent.
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
  const [mountRateNotifications, setMountRateNotifications] = React.useState(0);
  const maxRenders = 8;
  const renderInterval = 50;

  const lifecycleInfo = useRenderTracker("ProbeReRenderDetection", {
    renderThreshold: 3,
    mountThreshold: 2,
    trackRenders: true,
    trackMounts: true,
    onExcessiveRenders: (info) => {
      setRenderRateNotifications(info.alertsTriggered);
    },
    onExcessiveMounts: (info) => {
      setMountRateNotifications(info.alertsTriggered);
    },
  });

  const unstableObject = {
    timestamp: Date.now(),
    random: Math.random(),
    nested: { value: Date.now() },
  };
  const unstableFunction = React.useCallback(() => Date.now(), [Date.now()]);
  const unstableArray = [Date.now(), Math.random(), `render-${renderCount}`];

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
      if (info.hasFrequentChanges) {
        setWarningsDetected((prev) => prev + info.frequentChangeTypes.length);
      }
    },
  );

  React.useEffect(() => {
    if (dependencyInfo.changesCount > 0) {
      const totalRelevantChanges = dependencyInfo.hasFrequentChanges
        ? dependencyInfo.frequentChangeTypes.length
        : Math.min(dependencyInfo.changesCount, 3);
      setWarningsDetected(totalRelevantChanges);
    }
  }, [
    dependencyInfo.changesCount,
    dependencyInfo.hasFrequentChanges,
    dependencyInfo.frequentChangeTypes.length,
  ]);

  React.useEffect(() => {
    if (lifecycleInfo.render.alertsTriggered > 0) {
      setRenderRateNotifications(lifecycleInfo.render.alertsTriggered);
    }
  }, [lifecycleInfo.render.alertsTriggered]);

  React.useEffect(() => {
    if (lifecycleInfo.mount.alertsTriggered > 0) {
      setMountRateNotifications(lifecycleInfo.mount.alertsTriggered);
    }
  }, [lifecycleInfo.mount.alertsTriggered]);

  React.useEffect(() => {
    if (renderCount >= 3) {
      try {
        const {
          initializationPhase,
        } = require("../debugsy-deps/logic/change-tracking");
        if (
          initializationPhase &&
          typeof initializationPhase.markComponentSeen === "function"
        ) {
          initializationPhase.markComponentSeen();
          initializationPhase.markComponentSeen();
        }
      } catch {
        // Not critical for probe operation
      }
    }
  }, [renderCount]);

  React.useEffect(() => {
    const progress = ((renderCount / maxRenders) * 100).toFixed(0);
    const statusType =
      warningsDetected > 0 ||
      renderRateNotifications > 0 ||
      mountRateNotifications > 0
        ? "success"
        : "info";

    const status =
      warningsDetected > 0 ||
      renderRateNotifications > 0 ||
      mountRateNotifications > 0
        ? "Working"
        : "Testing";
    const currentStatus = `Probe ${progress}% | ${warningsDetected} deps, ${renderRateNotifications} renders, ${mountRateNotifications} mounts | ${status}`;

    setDebugDisplayContent({
      message: currentStatus,
      type: statusType,
    });

    onStatusUpdate?.(currentStatus);

    if (renderCount < maxRenders) {
      const timeout = setTimeout(() => {
        setRenderCount((prev) => prev + 1);
      }, renderInterval);
      return () => clearTimeout(timeout);
    } else {
      const duration = Date.now() - startTime;
      const renderRate = (renderCount / (duration / 1000)).toFixed(1);
      const wasSuccessful =
        warningsDetected > 0 ||
        renderRateNotifications > 0 ||
        mountRateNotifications > 0;
      const resultType = wasSuccessful ? "success" : "warning";
      const displayMessage = wasSuccessful
        ? `Probe Success: ${warningsDetected} deps, ${renderRateNotifications} renders, ${mountRateNotifications} mounts detected (${renderRate}/sec)`
        : `Probe Complete: No detections at ${renderRate}/sec - check config`;

      clearDebugDisplayContent();
      setDebugDisplayContent({
        message: displayMessage,
        type: resultType,
        duration: 10000,
      });

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
    mountRateNotifications,
    renderInterval,
  ]);

  return null;
};
