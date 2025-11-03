"use client";

import { cn } from "@workspace/harbuz/utils";
import React from "react";

export interface DebugResizePresetsProps {
  currentHeight: number;
  maxHeight: number;
  onHeightChange: (height: number) => void;
  onClose?: () => void;
  className?: string;
}

/**
 * Debug Resize Presets - Quick resize buttons for the panel
 */
export const DebugResizePresets: React.FC<DebugResizePresetsProps> = ({
  currentHeight,
  maxHeight,
  onHeightChange,
  className,
}) => {
  const presetHeights = [0, 200, 300, 400, 600, 800];

  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid #374151",
      }}
      className={cn(className)}
    >
      <div
        style={{
          fontSize: "10px",
          fontFamily: "monospace",
          color: "#d1d5db",
          marginBottom: "4px",
          fontWeight: "bold",
        }}
      >
        Quick Resize:
      </div>
      <div
        style={{
          display: "flex",
          gap: "3px",
          flexWrap: "wrap",
        }}
      >
        {/* Regular height presets */}
        {presetHeights.map((height) => (
          <button
            key={height}
            onClick={() => onHeightChange(Math.min(height, maxHeight))}
            style={{
              backgroundColor: currentHeight === height ? "#10b981" : "#374151",
              color: currentHeight === height ? "#000000" : "#d1d5db",
              border: "none",
              borderRadius: "3px",
              padding: "3px 6px",
              fontSize: "9px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (currentHeight !== height) {
                e.currentTarget.style.backgroundColor = "#4b5563";
              }
            }}
            onMouseLeave={(e) => {
              if (currentHeight !== height) {
                e.currentTarget.style.backgroundColor = "#374151";
              }
            }}
            title={`Resize panel to ${height}px`}
          >
            {height}px
          </button>
        ))}
      </div>
    </div>
  );
};

DebugResizePresets.displayName = "DebugResizePresets";
