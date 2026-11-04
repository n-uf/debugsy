"use client";

import React from "react";

export interface TrafficLightsProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  colors?: {
    close?: string;
    minimize?: string;
    maximize?: string;
  };
  centered?: boolean;
}

/**
 * TrafficLights - macOS-style window control buttons (three circular dots)
 *
 * Displays three circular buttons that act as window controls:
 * - Close (red)
 * - Minimize (yellow)
 * - Maximize (green)
 *
 * Usage:
 * ```tsx
 * <TrafficLights
 *   onClose={handleClose}
 *   onMinimize={handleMinimize}
 *   onMaximize={handleMaximize}
 *   centered={false}
 * />
 * ```
 */
export const TrafficLights: React.FC<TrafficLightsProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  colors,
  centered = false,
}) => {
  // Use CSS semantic colors for traffic light defaults
  const closeColor = colors?.close ?? "rgb(var(--color-error))";
  const minimizeColor = colors?.minimize ?? "rgb(var(--color-warning))";
  const maximizeColor = colors?.maximize ?? "rgb(var(--color-success))";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        ...(centered && {
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
        }),
        ...(!centered && {
          position: "absolute",
          left: "8px",
        }),
      }}
    >
      <button
        onClick={onClose}
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: closeColor,
          border: "none",
          cursor: "pointer",
          padding: 0,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        title="Close"
        type="button"
      />
      <button
        onClick={onMinimize}
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: minimizeColor,
          border: "none",
          cursor: "pointer",
          padding: 0,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        title="Minimize"
        type="button"
      />
      <button
        onClick={onMaximize}
        style={{
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          backgroundColor: maximizeColor,
          border: "none",
          cursor: "pointer",
          padding: 0,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        title="Maximize"
        type="button"
      />
    </div>
  );
};

TrafficLights.displayName = "TrafficLights";

