"use client";

import {
  ActionToolbar,
  DEFAULT_COPY_CONFIG,
  getProgressColor as getActionProgressColor,
  getProgressWidth as getActionProgressWidth,
  getDepthColor,
  getDepthDescription,
  getDepthWidth,
  getLogsToCopy,
  safeSuperjsonStringify,
  setDisplayContent,
  type ActionButton,
  type CopyStateReturn,
  type DepthControl,
  type DepthSetting,
  type HoverMessageHandlers,
  type PauseState,
  type ProgressControl,
  type ScrollFollowingState,
} from "@workspace/harbuz";
import React, { useCallback, useState } from "react";

export interface DebugsyActionsProps<T> {
  /**
   * Active logs to display/copy
   */
  activeLogs: T[];
  /**
   * Filtered logs (for snapshot capture)
   */
  filteredLogs: T[];
  /**
   * Copy state hook return
   */
  copyState: CopyStateReturn;
  /**
   * Pause state hook return
   */
  pauseState: PauseState<T>;
  /**
   * Scroll following state hook return
   */
  scrollFollowing: ScrollFollowingState<T>;
  /**
   * Hover message handlers
   */
  hoverMessage: HoverMessageHandlers;
}

/**
 * DebugsyActions - Action toolbar with all action logic
 *
 * Encapsulates copy, pause, and health snapshot actions.
 * Self-contained with all handlers and configuration.
 *
 * @example
 * ```tsx
 * <DebugsyActions
 *   activeLogs={activeLogs}
 *   filteredLogs={filteredLogs}
 *   copyState={copyState}
 *   pauseState={pauseState}
 *   scrollFollowing={scrollFollowing}
 *   hoverMessage={hoverMessage}
 * />
 * ```
 */
export const DebugsyActions = <T,>({
  activeLogs,
  filteredLogs,
  copyState,
  pauseState,
  scrollFollowing,
  hoverMessage,
}: DebugsyActionsProps<T>): React.ReactElement => {
  const [depthSetting, setDepthSetting] = useState<DepthSetting>("all");

  // Health Snapshot Handler
  const handleHealthSnapshot = useCallback(() => {
    const globalDebug = (globalThis as any).surfaceDebug;
    if (globalDebug?.captureHealthSnapshot) {
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
        message: "Health snapshot captured (surfaceDebug not available)",
        type: "info",
        duration: 2000,
      });
    }
  }, [filteredLogs, scrollFollowing]);

  // Copy Logs Handler with Depth Setting
  const handleCopyLogs = useCallback(() => {
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

    // Copy with depth setting
    const serialized = safeSuperjsonStringify(logsToCopy, depth);
    navigator.clipboard.writeText(serialized);

    // Advance copy state
    copyState.setState(nextState);

    setDisplayContent({
      message: `${message} (depth: ${depthSetting})`,
      type: "success",
      duration: 2000,
    });
  }, [activeLogs, copyState, depthSetting]);

  // Depth control configuration
  const depthControl: DepthControl<DepthSetting> = {
    value: depthSetting,
    options: ["str", "1", "3", "5", "10", "all"],
    onChange: (newDepth) => {
      setDepthSetting(newDepth);
      setDisplayContent({
        message: `${getDepthDescription(newDepth)}`,
        type: "info",
        duration: 2000,
      });
    },
    getDescription: getDepthDescription,
    getColor: getDepthColor,
    getWidth: getDepthWidth,
  };

  const progressControl: ProgressControl<typeof copyState.state> = {
    value: copyState.state,
    getIcon: copyState.getIcon,
    getWidth: getActionProgressWidth,
    getColor: getActionProgressColor,
  };

  // Action buttons configuration
  const actionButtons: ActionButton[] = [
    {
      icon: copyState.getIcon(),
      title:
        copyState.state === 0
          ? `Copy ${activeLogs.length} logs to clipboard`
          : copyState.state === 1
            ? "Click again to copy all"
            : "Copy complete",
      variant: copyState.getVariant(),
      onClick: handleCopyLogs,
      disabled: activeLogs.length === 0,
      ...hoverMessage.getHandlers(
        `Copy ${activeLogs.length} logs (depth: ${depthSetting})`,
        "info"
      ),
    },
    {
      icon: pauseState.isPaused ? "▶️" : "⏸",
      title: pauseState.isPaused
        ? "Resume log rendering"
        : "Pause log rendering",
      variant: pauseState.isPaused ? "paused" : "default",
      onClick: () => pauseState.toggle(filteredLogs),
      ...hoverMessage.getHandlers(
        pauseState.isPaused
          ? "Resume live log updates"
          : "Pause live log updates",
        "info"
      ),
    },
    {
      icon: "🏥",
      title: "Capture health snapshot to debug logs",
      variant: "success",
      onClick: handleHealthSnapshot,
      ...hoverMessage.getHandlers(
        "Capture health snapshot and save to debug logs",
        "info"
      ),
    },
  ];

  return (
    <ActionToolbar
      depthControl={depthControl}
      actions={actionButtons}
      progressControl={progressControl}
    />
  );
};

DebugsyActions.displayName = "DebugsyActions";
