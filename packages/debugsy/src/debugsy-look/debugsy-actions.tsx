"use client";

import {
  ActionToolbar,
  DEFAULT_COPY_CONFIG,
  DEPTH_SETTINGS,
  getDepthDescription,
  getDepthSegments,
  getLogsToCopy,
  safeSuperjsonStringify,
  // Context-based queue system (isolated)
  useDisplayQueueHelpers,
  useLegacyDisplayCompat,
  type ActionButton,
  type CopyStateReturn,
  type DepthControl,
  type DepthSetting,
  type HoverMessageHandlers,
  type PauseState,
  type ScrollFollowingState,
} from "../ui";
import React, { useCallback, useState } from "react";
import { getDebugsy } from "../debugsy-space";

export interface DebugsyActionsProps<T> {
  /** Active logs to display/copy */
  activeLogs: T[];
  /** Filtered logs (for snapshot capture) */
  filteredLogs: T[];
  /** Copy state hook return */
  copyState: CopyStateReturn;
  /** Pause state hook return */
  pauseState: PauseState<T>;
  /** Scroll following state hook return */
  scrollFollowing: ScrollFollowingState<T>;
  /** Hover message handlers */
  hoverMessage: HoverMessageHandlers;
  /** Depth setting for copy operations (optional, defaults to "all") */
  depthSetting?: DepthSetting;
  /** Callback when depth setting changes */
  onDepthChange?: (depth: DepthSetting) => void;
}

/** Copy state 0 / 1 / 2 as the COPY word's LED fill */
const COPY_PROGRESS = [0, 50, 100] as const;

/**
 * DebugsyActions - the action rail: copy (twice copies everything), pause,
 * health snapshot, and the copy depth.
 */
export const DebugsyActions = <T,>({
  activeLogs,
  filteredLogs,
  copyState,
  pauseState,
  scrollFollowing,
  hoverMessage,
  depthSetting: externalDepthSetting,
  onDepthChange,
}: DebugsyActionsProps<T>): React.ReactElement => {
  // Context-based display queue helpers (isolated to this component tree)
  const { startLoading, completeLoading } = useDisplayQueueHelpers();
  const { setDisplayContent } = useLegacyDisplayCompat();

  const [internalDepthSetting, setInternalDepthSetting] =
    useState<DepthSetting>("all");

  // Use external depth setting if provided, otherwise use internal
  const depthSetting = externalDepthSetting ?? internalDepthSetting;
  const setDepthSetting = onDepthChange ?? setInternalDepthSetting;

  // Health Snapshot Handler
  const handleHealthSnapshot = useCallback(() => {
    // The debug space (the console command may be off); there is no surfaceDebug global
    const globalDebug = getDebugsy();
    if (typeof globalDebug?.captureHealthSnapshot === "function") {
      globalDebug.captureHealthSnapshot();
      // Capture snapshot when taking health snapshot (stops following)
      scrollFollowing.setIsFollowing(false);
      scrollFollowing.setSnapshotItems([...filteredLogs]);
      setDisplayContent({
        message: "Health snapshot captured and saved to logs",
        type: "success",
        duration: 2000,
      });
    } else {
      setDisplayContent({
        message: "Health snapshot unavailable (debug space not initialised)",
        type: "info",
        duration: 2000,
      });
    }
  }, [filteredLogs, scrollFollowing]);

  // Copy Logs Handler with Depth Setting
  const handleCopyLogs = useCallback(async () => {
    const {
      logs: logsToCopy,
      nextState,
      message,
    } = getLogsToCopy(activeLogs, copyState.state, DEFAULT_COPY_CONFIG);

    // Get depth as number for safeSuperjsonStringify
    const depthMap: Record<DepthSetting, number | undefined> = {
      str: 0,
      "1": 1,
      "3": 3,
      "5": 5,
      "10": 10,
      all: undefined,
    };
    const depth = depthMap[depthSetting];

    // Start loading (returns ID for later update)
    const loadingId = startLoading(`Copying ${logsToCopy.length} logs...`, {
      type: "info",
      showProcessingTime: false,
    });

    // Copy with depth setting (wrapped in promise for async/await)
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        const serialized = safeSuperjsonStringify(logsToCopy, depth);
        navigator.clipboard.writeText(serialized);
        resolve();
      }, 50); // Small delay to show loading state
    });

    // Advance copy state
    copyState.setState(nextState);

    // Complete loading with success (updates item by ID)
    completeLoading(loadingId, `${message} (depth: ${depthSetting})`, {
      progressValue: COPY_PROGRESS[nextState],
      duration: 2000,
    });
  }, [activeLogs, copyState, depthSetting]);

  // Depth control configuration
  const depthControl: DepthControl<DepthSetting> = {
    value: depthSetting,
    options: DEPTH_SETTINGS,
    onChange: (newDepth) => {
      setDepthSetting(newDepth);
      setDisplayContent({
        message: `${getDepthDescription(newDepth)}`,
        type: "info",
        duration: 2000,
      });
    },
    getDescription: getDepthDescription,
    getSegments: getDepthSegments,
  };

  const actionButtons: ActionButton[] = [
    {
      label: "Copy",
      title:
        copyState.state === 0
          ? `Copy ${activeLogs.length} logs to clipboard`
          : copyState.state === 1
            ? "Click again to copy all"
            : "Copy complete",
      tone: copyState.state === 2 ? "led" : undefined,
      progress: copyState.state === 0 ? undefined : COPY_PROGRESS[copyState.state],
      onClick: handleCopyLogs,
      disabled: activeLogs.length === 0,
      ...hoverMessage.getHandlers(
        `Copy ${activeLogs.length} logs (depth: ${depthSetting})`,
        "info",
      ),
    },
    {
      label: pauseState.isPaused ? "Resume" : "Pause",
      title: pauseState.isPaused
        ? "Resume log rendering"
        : "Pause log rendering",
      tone: pauseState.isPaused ? "warn" : undefined,
      active: pauseState.isPaused,
      onClick: () => pauseState.toggle(filteredLogs),
      ...hoverMessage.getHandlers(
        pauseState.isPaused
          ? "Resume live log updates"
          : "Pause live log updates",
        "info",
      ),
    },
    {
      label: "Health",
      title: "Capture a health snapshot into the logs",
      onClick: handleHealthSnapshot,
      ...hoverMessage.getHandlers(
        "Capture health snapshot and save to debug logs",
        "info",
      ),
    },
  ];

  return <ActionToolbar depthControl={depthControl} actions={actionButtons} />;
};

DebugsyActions.displayName = "DebugsyActions";
