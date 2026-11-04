"use client";

import React from "react";

export interface ResizeBarProps {
  onResizeStart?: (e: React.MouseEvent) => void;
  isResizing?: boolean;
  color?: string;
}

/**
 * ResizeBar - Horizontal bar for resizing panels
 *
 * A draggable horizontal bar that triggers resize operations.
 *
 * Usage:
 * ```tsx
 * <ResizeBar
 *   onResizeStart={handleResizeStart}
 *   isResizing={isResizing}
 *   color="rgb(var(--color-accent))"
 * />
 * ```
 */
export const ResizeBar: React.FC<ResizeBarProps> = ({
  onResizeStart,
  isResizing = false,
  color,
}) => {
  const resolvedColor = color ?? "rgb(var(--color-accent))";
  return (
    <div
      onMouseDown={onResizeStart}
      style={{
        position: "absolute",
        left: "50%",
        transform: "translateX(-50%)",
        width: "40px",
        height: "3px",
        backgroundColor: resolvedColor,
        borderRadius: "2px",
        opacity: isResizing ? 1 : 0.5,
        transition: "opacity 0.2s ease",
        cursor: onResizeStart ? "ns-resize" : "default",
      }}
    />
  );
};

ResizeBar.displayName = "ResizeBar";

