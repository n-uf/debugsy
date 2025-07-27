"use client";

import React from "react";
import {
  clearDebugDisplayContent,
  setDebugDisplayContent,
} from "../../../debugsy-logs/hooks/debug-notifications";
import type { DebugLogEntry } from "../../../debugsy-logs/hooks/use-debugsy";
import { type DepthSetting } from "../../../shared/object-depth-utils";
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
 * Actions Panel Component - right sidebar with copy, pause, health buttons and depth switcher
 */
export interface ActionsPanelProps {
  activeLogs: DebugLogEntry[];
  copyState: CopyState;
  isPaused: boolean;
  depthSetting: DepthSetting;
  onCopyLogs: () => void;
  onPauseResume: () => void;
  onHealthSnapshot: () => void;
  onDepthChange: (setting: DepthSetting) => void;
  onButtonMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onButtonMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export const ActionsPanel: React.FC<ActionsPanelProps> = React.memo(
  ({
    activeLogs,
    copyState,
    isPaused,
    depthSetting,
    onCopyLogs,
    onPauseResume,
    onHealthSnapshot,
    onDepthChange,
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
        {/* Depth Switcher - Horizontal Progress Bar Style */}
        <div
          onClick={() => {
            const depths: DepthSetting[] = ["str", "1", "3", "5", "10", "all"];
            const currentIndex = depths.indexOf(depthSetting);
            const nextIndex = (currentIndex + 1) % depths.length;
            const nextDepth = depths[nextIndex];
            if (nextDepth) {
              onDepthChange(nextDepth);
            }
          }}
          style={{
            width: "24px",
            height: "8px", // Thin horizontal bar
            backgroundColor: "#1f2937",
            border: "1px solid #374151",
            borderRadius: "4px",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            transition: `all ${getButtonTransitionDuration()}ms ease`,
            marginTop: "2px",
            marginBottom: "2px",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scaleY(1.5)";
            (e.currentTarget as HTMLDivElement).style.height = "10px";

            const description = (() => {
              switch (depthSetting) {
                case "all":
                  return "Full depth (no limits)";
                case "10":
                  return "10 levels deep";
                case "5":
                  return "5 levels deep";
                case "3":
                  return "3 levels deep";
                case "1":
                  return "1 level only";
                case "str":
                  return "String format (1000 chars)";
                default:
                  return "Unknown setting";
              }
            })();

            setDebugDisplayContent({
              message: `Object depth: ${description}`,
              type: "info",
              duration: 0,
            });
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.transform = "scaleY(1)";
            (e.currentTarget as HTMLDivElement).style.height = "8px";

            clearDebugDisplayContent();
          }}
          title={`Object depth: ${(() => {
            switch (depthSetting) {
              case "all":
                return "Full depth (no limits)";
              case "10":
                return "10 levels deep";
              case "5":
                return "5 levels deep";
              case "3":
                return "3 levels deep";
              case "1":
                return "1 level only";
              case "str":
                return "String format (1000 chars)";
              default:
                return "Unknown setting";
            }
          })()} (click to increase)`}
        >
          {/* Progress Fill */}
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              height: "100%",
              backgroundColor: (() => {
                switch (depthSetting) {
                  case "all":
                    return "#10b981"; // Green - full depth
                  case "10":
                    return "#3b82f6"; // Blue - high depth
                  case "5":
                    return "#8b5cf6"; // Purple - medium depth
                  case "3":
                    return "#f59e0b"; // Orange - low depth
                  case "1":
                    return "#ef4444"; // Red - minimal depth
                  case "str":
                    return "transparent"; // String mode - border only, no fill
                  default:
                    return "#6b7280";
                }
              })(),
              width: (() => {
                // String mode gets full border, others use progression
                if (depthSetting === "str") return "100%";

                const depths: DepthSetting[] = [
                  "str",
                  "1",
                  "3",
                  "5",
                  "10",
                  "all",
                ];
                const currentIndex = depths.indexOf(depthSetting);
                return `${((currentIndex + 1) / depths.length) * 100}%`;
              })(),
              borderRadius: "3px",
              transition: `all ${getButtonTransitionDuration()}ms ease`,
              boxShadow:
                depthSetting !== "str"
                  ? `0 0 4px ${(() => {
                      switch (depthSetting) {
                        case "all":
                          return "#10b98140";
                        case "10":
                          return "#3b82f640";
                        case "5":
                          return "#8b5cf640";
                        case "3":
                          return "#f59e0b40";
                        case "1":
                          return "#ef444440";
                        default:
                          return "#6b728040";
                      }
                    })()}`
                  : "none",
              // String mode gets a colored border instead of fill
              border: depthSetting === "str" ? "1px solid #ec4899" : "none",
            }}
          />

          {/* Depth Indicator Text - only show for non-infinity modes and non-string modes */}
          {depthSetting !== "all" && depthSetting !== "str" && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontSize: "6px",
                fontWeight: "bold",
                color: "#ffffff",
                textShadow: "0 0 2px rgba(0,0,0,0.8)",
                fontFamily: "monospace",
                zIndex: 2,
              }}
            >
              {depthSetting}
            </div>
          )}
        </div>

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
