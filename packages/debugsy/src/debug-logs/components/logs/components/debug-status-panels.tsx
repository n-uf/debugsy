"use client";

import React from "react";
import { LOG_STYLES } from "../utils/log-utilities";

/**
 * Debug Status Panels Component - groups all sticky status panels
 */
export interface DebugStatusPanelsProps {
  isPaused: boolean;
  pausedLogsCount: number;
  isFollowing: boolean;
  snapshotLogsCount: number;
  onReturnToFollowing: () => void;
}

export const DebugStatusPanels: React.FC<DebugStatusPanelsProps> = React.memo(
  ({
    isPaused,
    pausedLogsCount,
    isFollowing,
    snapshotLogsCount,
    onReturnToFollowing,
  }) => {
    // Calculate sticky panel positions for proper stacking
    const panelHeight = 40;
    const pausedPanelTop = 0;
    const followingPanelTop = isPaused ? panelHeight : 0;

    return (
      <>
        {isPaused && (
          <div
            style={{
              ...LOG_STYLES.truncationWarning,
              backgroundColor: "#fbbf2422",
              borderColor: "#f59e0b44",
              color: "#f59e0b",
              fontWeight: "bold",
              position: "sticky",
              top: `${pausedPanelTop}px`,
              zIndex: 11,
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid #f59e0b44",
              marginBottom: "2px",
            }}
          >
            ⏸️ Log rendering paused - {pausedLogsCount} logs frozen
          </div>
        )}

        {!isPaused && !isFollowing && (
          <div
            onClick={onReturnToFollowing}
            style={{
              ...LOG_STYLES.truncationWarning,
              backgroundColor: "#3b82f622",
              borderColor: "#3b82f644",
              color: "#60a5fa",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              userSelect: "none",
              position: "sticky",
              top: `${followingPanelTop}px`,
              zIndex: 10,
              backdropFilter: "blur(8px)",
              borderBottom: "1px solid #3b82f644",
              marginBottom: "2px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f633";
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#3b82f622";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Click to return to following live logs"
          >
            📌 Viewing snapshot at {snapshotLogsCount} logs - Click to return to
            live stream
          </div>
        )}
      </>
    );
  }
);

DebugStatusPanels.displayName = "DebugStatusPanels";
