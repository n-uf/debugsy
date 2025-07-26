"use client";

import React from "react";
import type { DebugLogEntry } from "../../../hooks/use-debug";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../../../hooks/use-debug";
import {
  DEFAULT_COPY_CONFIG,
  getButtonTransitionDuration,
  getProgressBarDuration,
} from "../config/copy-config";
import type { CopyState } from "../utils/copy-utilities";
import {
  getCopyIcon,
  getProgressColor,
  getProgressWidth,
} from "../utils/copy-utilities";

/**
 * Actions Panel Component - right sidebar with copy, pause, and health buttons
 */
export interface ActionsPanelProps {
  activeLogs: DebugLogEntry[];
  copyState: CopyState;
  isPaused: boolean;
  onCopyLogs: () => void;
  onPauseResume: () => void;
  onHealthSnapshot: () => void;
  onButtonMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onButtonMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = React.memo(
  ({
    activeLogs,
    copyState,
    isPaused,
    onCopyLogs,
    onPauseResume,
    onHealthSnapshot,
    onButtonMouseEnter,
    onButtonMouseLeave,
  }) => {
    return (
      <div
        style={{
          width: "32px",
          backgroundColor: "#ffffff08",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "4px 2px",
          gap: "4px",
          flexShrink: 0,
        }}
      >
        {/* Copy Button */}
        <button
          onClick={onCopyLogs}
          disabled={activeLogs.length === 0}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: activeLogs.length === 0 ? "#1a1a1a" : "#2d3748",
            color: activeLogs.length === 0 ? "#4a5568" : "#e2e8f0",
            border: "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            cursor: activeLogs.length === 0 ? "not-allowed" : "pointer",
            opacity: activeLogs.length === 0 ? 0.4 : 0.9,
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            boxShadow:
              activeLogs.length === 0
                ? "0 1px 2px rgba(0, 0, 0, 0.2)"
                : "0 2px 4px rgba(0, 0, 0, 0.4)",
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={onButtonMouseEnter}
          onMouseLeave={onButtonMouseLeave}
        >
          {/* Progress Bar Background */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              left: "0",
              width: "100%",
              height: "2px",
              backgroundColor: "#1f2937",
              borderRadius: "0 0 3px 3px",
            }}
          >
            {/* Progress Bar Fill */}
            <div
              style={{
                position: "absolute",
                bottom: "0",
                left: "0",
                width: getProgressWidth(
                  copyState,
                  activeLogs.length,
                  DEFAULT_COPY_CONFIG
                ),
                height: "100%",
                backgroundColor: getProgressColor(
                  copyState,
                  DEFAULT_COPY_CONFIG
                ),
                borderRadius: "0 0 3px 3px",
                transition: `all ${getProgressBarDuration()}ms ease`,
                boxShadow: `0 0 3px ${getProgressColor(copyState, DEFAULT_COPY_CONFIG)}40`,
              }}
            />
          </div>

          {/* Button Icon */}
          <span style={{ zIndex: 1 }}>
            {getCopyIcon(copyState, DEFAULT_COPY_CONFIG)}
          </span>
        </button>

        {/* Pause/Resume Button */}
        <button
          onClick={onPauseResume}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: isPaused ? "#fbbf24" : "#2d3748",
            color: isPaused ? "#1f2937" : "#e2e8f0",
            border: isPaused ? "2px solid #f59e0b" : "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "11px",
            cursor: "pointer",
            opacity: 0.9,
            transition: "all 0.2s ease",
            boxShadow: isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)"
              : "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 2px 8px rgba(251, 191, 36, 0.8)"
              : "0 2px 4px rgba(0, 0, 0, 0.4)";

            setDebugDisplayContent({
              message: isPaused
                ? "Resume log rendering"
                : "Pause log rendering",
              type: "info",
              duration: 0,
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow = isPaused
              ? "0 0 6px rgba(251, 191, 36, 0.6)"
              : "0 1px 2px rgba(0, 0, 0, 0.3)";

            clearDebugDisplayContent();
          }}
          title={isPaused ? "Resume log rendering" : "Pause log rendering"}
        >
          {isPaused ? "▶️" : "⏸️"}
        </button>

        {/* Health Snapshot Button */}
        <button
          onClick={onHealthSnapshot}
          style={{
            width: "24px",
            height: "24px",
            backgroundColor: "#2d3748",
            color: "#68d391",
            border: "none",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            cursor: "pointer",
            opacity: 0.9,
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            boxShadow: "0 1px 2px rgba(0, 0, 0, 0.3)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.08)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 2px 4px rgba(0, 0, 0, 0.4)";

            setDebugDisplayContent({
              message: "Capture application health metrics",
              type: "info",
              duration: 0,
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
            (e.currentTarget as HTMLButtonElement).style.boxShadow =
              "0 1px 2px rgba(0, 0, 0, 0.3)";

            clearDebugDisplayContent();
          }}
          title="Capture health snapshot to debug logs"
        >
          🏥
        </button>

        {/* Bottom Separator */}
        <div
          style={{
            width: "16px",
            height: "1px",
            backgroundColor: "#334155",
            marginTop: "auto",
            marginBottom: "2px",
            opacity: 0.6,
          }}
        />
      </div>
    );
  }
);

ActionsPanel.displayName = "ActionsPanel";
