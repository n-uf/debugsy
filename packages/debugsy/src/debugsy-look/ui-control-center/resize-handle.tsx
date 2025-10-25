"use client";

import { Z_INDEX } from "@workspace/harbuz";
import React from "react";

export interface DebugPanelResizeHandleProps {
  onResizeStart: (event: React.MouseEvent) => void;
  isResizing: boolean;
}

/**
 * Debug Panel Resize Handle - Draggable handle for resizing the panel
 */
export const DebugPanelResizeHandle: React.FC<DebugPanelResizeHandleProps> = ({
  onResizeStart,
  isResizing,
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: "-2px",
        left: "0",
        right: "0",
        height: "6px",
        cursor: "ns-resize",
        backgroundColor: "transparent",
        zIndex: Z_INDEX.DEBUG_RESIZE_HANDLE,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onMouseDown={onResizeStart}
    >
      <div
        style={{
          width: "60px",
          height: "4px",
          backgroundColor: "#10b981",
          borderRadius: "2px",
          opacity: isResizing ? 1 : 0.6,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          if (!isResizing) e.currentTarget.style.opacity = "0.6";
        }}
      />
    </div>
  );
};

DebugPanelResizeHandle.displayName = "DebugPanelResizeHandle";
