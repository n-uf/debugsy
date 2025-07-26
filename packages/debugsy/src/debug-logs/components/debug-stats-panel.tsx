"use client";

import React from "react";

export interface DebugStatsPanelProps {
  totalLogs: number;
  activePoints: number;
  panelHeight: number;
}

/**
 * Debug Stats Panel - Displays statistics about the debug state
 */
export const DebugStatsPanel: React.FC<DebugStatsPanelProps> = ({
  totalLogs,
  activePoints,
  panelHeight,
}) => {
  return (
    <div
      style={{
        padding: "8px",
        borderBottom: "1px solid #374151",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "2px",
          fontSize: "10px",
          fontFamily: "monospace",
        }}
      >
        <div
          style={{ display: "flex", justifyContent: "space-between" }}
          title="Storage limit: 10,000 | Rendering limit: 1,000"
        >
          <span style={{ color: "#6b7280" }}>Logs:</span>
          <span style={{ color: "#10b981" }}>{totalLogs}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6b7280" }}>Points:</span>
          <span style={{ color: "#60a5fa" }}>{activePoints}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ color: "#6b7280" }}>Height:</span>
          <span style={{ color: "#fbbf24" }}>{panelHeight}px</span>
        </div>
      </div>
    </div>
  );
};

DebugStatsPanel.displayName = "DebugStatsPanel";
