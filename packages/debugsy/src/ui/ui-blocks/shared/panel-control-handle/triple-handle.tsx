"use client";

import React, { useState } from "react";

export interface TripleHandleProps {
  onClose?: () => void;
  onMinimize?: () => void;
  onMaximize?: () => void;
  colors?: {
    close?: string;
    minimize?: string;
    maximize?: string;
  };
}

/**
 * TripleHandle - Terminal-style traffic lights (three horizontal bars)
 *
 * Displays three horizontal bars that act as window controls:
 * - Close (red)
 * - Minimize (yellow)
 * - Maximize (green)
 *
 * Usage:
 * ```tsx
 * <TripleHandle
 *   onClose={handleClose}
 *   onMinimize={handleMinimize}
 *   onMaximize={handleMaximize}
 * />
 * ```
 */
export const TripleHandle: React.FC<TripleHandleProps> = ({
  onClose,
  onMinimize,
  onMaximize,
  colors,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Use CSS semantic colors for traffic light defaults
  const closeColor = colors?.close ?? "rgb(var(--color-error))";
  const minimizeColor = colors?.minimize ?? "rgb(var(--color-warning))";
  const maximizeColor = colors?.maximize ?? "rgb(var(--color-success))";

  const handles = [
    { color: closeColor, onClick: onClose, title: "Close" },
    { color: minimizeColor, onClick: onMinimize, title: "Minimize" },
    { color: maximizeColor, onClick: onMaximize, title: "Maximize" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
    >
      {handles.map((handle, index) => (
        <button
          key={index}
          onClick={handle.onClick}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          style={{
            width: "12px",
            height: "3px",
            borderRadius: "2px",
            backgroundColor: handle.color,
            border: "none",
            cursor: "pointer",
            padding: 0,
            opacity: hoveredIndex === index ? 1 : 0.5,
            transform: hoveredIndex === index ? "scaleY(1.5)" : "scaleY(1)",
            transition: "all 0.15s ease",
            boxShadow:
              hoveredIndex === index ? `0 0 6px ${handle.color}80` : "none",
          }}
          title={handle.title}
          type="button"
        />
      ))}
    </div>
  );
};

TripleHandle.displayName = "TripleHandle";

