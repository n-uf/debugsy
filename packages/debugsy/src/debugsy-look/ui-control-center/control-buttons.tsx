"use client";

import React from "react";
import {
  type DebugPoint,
  DEBUG_POINT_CONFIG,
} from "../../debugsy-shared/debug-point-config";

export interface DebugPointButtonConfig {
  key: DebugPoint;
  emoji: string;
  label: string;
}

/**
 * Transform debug point config for button components
 * Converts centralized config to button-specific format
 */
export const getDebugPointsForButtons = (pointKeys: DebugPoint[]) => {
  return pointKeys.map((key) => ({
    key,
    emoji: DEBUG_POINT_CONFIG[key].emoji,
    label: DEBUG_POINT_CONFIG[key].label,
  }));
};

export interface DebugPointButtonsProps {
  debugPoints: DebugPointButtonConfig[];
  isEnabled: (point: DebugPoint) => boolean;
  onToggle: (point: DebugPoint) => void;
  className?: string;
}

// Memoized individual button component to prevent unnecessary re-renders
const DebugPointButton = React.memo<{
  point: DebugPointButtonConfig;
  enabled: boolean;
  onToggle: (point: DebugPoint) => void;
}>(({ point, enabled, onToggle }) => (
  <button
    key={point.key}
    onClick={() => onToggle(point.key)}
    className={`
      flex items-center gap-1 px-1.5 py-0.5 rounded font-medium
      transition-colors duration-150 w-20
      bg-gray-100 text-gray-600 hover:bg-gray-200
    `}
    style={{ fontSize: "10px", lineHeight: "12px" }}
  >
    {/* Slit indicator */}
    <div
      className={`w-2 h-1 rounded-sm transition-colors duration-150 ${
        enabled ? "bg-green-500" : "bg-red-200"
      }`}
    />
    <span className="hidden sm:inline leading-none truncate">
      {point.label}
    </span>
  </button>
));

DebugPointButton.displayName = "DebugPointButton";

/**
 * Debug Point Buttons - Toggle debug points on/off in 2 compact rows with light indicators
 * OPTIMIZED: Uses React.memo to prevent unnecessary re-renders of individual buttons
 */
export const DebugPointButtons: React.FC<DebugPointButtonsProps> = ({
  debugPoints,
  isEnabled,
  onToggle,
  className = "",
}) => {
  // Split debug points into 2 rows
  const midPoint = Math.ceil(debugPoints.length / 2);
  const firstRow = debugPoints.slice(0, midPoint);
  const secondRow = debugPoints.slice(midPoint);

  const renderButtons = (points: DebugPointButtonConfig[]) =>
    points.map((point) => (
      <DebugPointButton
        key={point.key}
        point={point}
        enabled={isEnabled(point.key)}
        onToggle={onToggle}
      />
    ));

  return (
    <div
      className={`flex flex-col shrink-0 ${className}`}
      style={{ gap: "0px" }}
    >
      {/* First Row */}
      <div className="flex items-center gap-0.5 overflow-x-auto h-[20px]">
        {renderButtons(firstRow)}
      </div>

      {/* Second Row */}
      <div className="flex items-center gap-0.5 overflow-x-auto h-[20px]">
        {renderButtons(secondRow)}
      </div>
    </div>
  );
};

DebugPointButtons.displayName = "DebugPointButtons";
