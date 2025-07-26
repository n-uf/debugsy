"use client";

import React from "react";

export interface DebugStatusProps {
  enabledCount: number;
  className?: string;
}

/**
 * Debug Status - Shows count of enabled debug points
 */
export const DebugStatus: React.FC<DebugStatusProps> = ({
  enabledCount,
  className = "",
}) => {
  return (
    <div
      className={`flex items-center gap-2 text-xs text-gray-500 ${className}`}
    >
      <div
        className={`w-1.5 h-1.5 rounded-full ${
          enabledCount > 0 ? "bg-blue-600" : "bg-gray-300"
        }`}
      />
      <span>{enabledCount}</span>
    </div>
  );
};

DebugStatus.displayName = "DebugStatus";
