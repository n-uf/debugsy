"use client";

/**
 * Single Content Mode Renderer
 *
 * Renders single content/toast message with optional progress bar.
 */

import React from "react";
import type { DisplayContent } from "../../../../patterns/display-system/display-state";
import {
  formatTime,
  getContentColor,
  getContentEmoji,
} from "../display-helpers";
import { ProgressBar } from "./progress-bar";

export interface SingleModeProps {
  /** Content to display */
  content: DisplayContent;
  /** Animate progress bars with pulse effect? */
  animateProgress?: boolean;
}

/**
 * SingleMode - Single content/toast renderer
 *
 * Features:
 * - Single line message
 * - Optional progress bar below
 * - Type-based color and emoji
 */
export const SingleMode: React.FC<SingleModeProps> = ({
  content,
  animateProgress = false,
}) => {
  const hasProgress = content.progress !== undefined;
  const isLoading = hasProgress && content.progress?.loading === true;
  const mode: "loading" | "progress" = isLoading ? "loading" : "progress";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "4px",
        fontSize: "10px",
        fontFamily: "monospace",
        lineHeight: "1.2",
        width: "100%",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <span
        style={{
          color: "#6b7280",
          flexShrink: 0,
          fontSize: "9px",
        }}
      >
        {formatTime(content.timestamp)}
      </span>
      <span style={{ flexShrink: 0, fontSize: "10px" }}>
        {getContentEmoji(content.type)}
      </span>
      <span
        style={{
          color: getContentColor(content.type),
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {content.message}
      </span>

      {/* Progress Bar - Below message */}
      {content.progress && (
        <ProgressBar
          progress={content.progress}
          type={content.type}
          mode={mode}
          renderMode="below"
          animateProgress={animateProgress}
        />
      )}
    </div>
  );
};

SingleMode.displayName = "SingleMode";
