"use client";

/**
 * Progress Bar Renderer
 *
 * Renders progress bar for both loading (indeterminate) and progress (determinate) modes.
 */

import React from "react";
import type { DisplayContent } from "../../../../patterns/display-system/display-state";
import { getContentColor } from "../display-helpers";

export interface ProgressBarProps {
  /** Progress configuration */
  progress: {
    value: number;
    color?: string;
    height?: number;
    loading?: boolean;
  };
  /** Content type for default color */
  type: DisplayContent["type"];
  /** Mode: loading or progress */
  mode: "loading" | "progress";
  /** Render mode */
  renderMode?: "inline" | "below";
  /** Width for inline mode */
  inlineWidth?: string;
  /** Animate progress bars like loading (non-standard, cool effect, default: false) */
  animateProgress?: boolean;
}

/**
 * ProgressBar - Progress/Loading bar renderer
 *
 * Supports two render modes:
 * - Inline: Progress bar integrated into content row (compact for queue mode)
 * - Below: Progress bar below message (comfortable for single mode)
 *
 * Supports two progress modes:
 * - Loading: Indeterminate animated bar
 * - Progress: Determinate percentage bar (0-100%)
 *
 * Optional animation:
 * - animateProgress: Makes progress bars pulse/shimmer (cool effect)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  type,
  mode,
  renderMode = "below",
  inlineWidth = "80px",
  animateProgress = false,
}) => {
  const isLoading = mode === "loading";
  const isComplete = mode === "progress" && progress.value >= 100;
  const shouldAnimate =
    isLoading || (mode === "progress" && animateProgress && !isComplete);
  const backgroundColor = progress.color ?? getContentColor(type);
  const barHeight = progress.height ?? (renderMode === "inline" ? 10 : 2);

  if (renderMode === "inline") {
    // Inline mode - progress bar as part of content row
    return (
      <div
        style={{
          width: inlineWidth,
          height: `${barHeight}px`,
          backgroundColor: "#1f2937",
          borderRadius: "2px",
          overflow: "hidden",
          flexShrink: 0,
          position: "relative",
        }}
      >
        {isLoading ? (
          // Loading - animated sliding bar (indeterminate)
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: "30%",
              height: "100%",
              backgroundColor,
              borderRadius: "2px",
              animation: "slideProgress 1.5s ease-in-out infinite",
              boxShadow: `0 0 2px ${backgroundColor}80`,
            }}
          />
        ) : shouldAnimate ? (
          // Progress with animation (determinate but animated - cool effect!)
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
              height: "100%",
              backgroundColor,
              borderRadius: "2px",
              transition: "width 300ms ease",
              animation: "progressPulse 2s ease-in-out infinite",
              boxShadow: `0 0 2px ${backgroundColor}80`,
            }}
          />
        ) : (
          // Progress - standard determinate bar
          <div
            style={{
              position: "absolute",
              top: "0",
              left: "0",
              width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
              height: "100%",
              backgroundColor,
              borderRadius: "2px",
              transition: "width 300ms ease",
              boxShadow: `0 0 2px ${backgroundColor}80`,
            }}
          />
        )}
      </div>
    );
  }

  // Below mode - progress bar positioned below message
  return (
    <div
      style={{
        position: "absolute",
        bottom: "-6px",
        left: "0",
        width: "100%",
        height: `${barHeight}px`,
        backgroundColor: "#1f2937",
        borderRadius: "0 0 4px 4px",
        overflow: "hidden",
      }}
    >
      {isLoading ? (
        // Loading mode - indeterminate animated progress
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: "30%",
            height: "100%",
            backgroundColor,
            borderRadius: "0 0 4px 4px",
            animation: "slideProgress 1.5s ease-in-out infinite",
            boxShadow: `0 0 4px ${backgroundColor}40`,
          }}
        />
      ) : shouldAnimate ? (
        // Progress with animation (determinate but animated - cool effect!)
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
            height: "100%",
            backgroundColor,
            borderRadius: "0 0 4px 4px",
            transition: "width 300ms ease",
            animation: "progressPulse 2s ease-in-out infinite",
            boxShadow: `0 0 4px ${backgroundColor}40`,
          }}
        />
      ) : (
        // Progress mode - standard determinate fixed progress
        <div
          style={{
            position: "absolute",
            bottom: "0",
            left: "0",
            width: `${Math.min(Math.max(progress.value, 0), 100)}%`,
            height: "100%",
            backgroundColor,
            borderRadius: "0 0 4px 4px",
            transition: "width 300ms ease",
            boxShadow: `0 0 4px ${backgroundColor}40`,
          }}
        />
      )}
    </div>
  );
};

ProgressBar.displayName = "ProgressBar";
