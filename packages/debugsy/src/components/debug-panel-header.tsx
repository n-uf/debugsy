"use client";

import React from "react";

export interface DebugPanelHeaderProps {
  onClear: (e: React.MouseEvent) => void;
  onClose: () => void;
}

/**
 * Debug Panel Header - Title and action buttons
 */
export const DebugPanelHeader: React.FC<DebugPanelHeaderProps> = ({
  onClear,
  onClose,
}) => {
  return (
    <div
      style={{
        padding: "6px 16px",
        borderBottom: "1px solid #374151",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        flexShrink: 0,
        backgroundColor: "#f8fafc",
      }}
    ></div>
  );
};

DebugPanelHeader.displayName = "DebugPanelHeader";
