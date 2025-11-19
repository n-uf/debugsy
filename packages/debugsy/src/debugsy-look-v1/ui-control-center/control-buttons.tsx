"use client";

import { Button, Indicator } from "@workspace/harbuz";
import React from "react";
import {
  type DebugPoint,
  DEBUG_POINT_CONFIG,
} from "../../debugsy-space/debugsy-point";

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

// Memoized individual button component using harbuz primitives
const DebugPointButton = React.memo<{
  point: DebugPointButtonConfig;
  enabled: boolean;
  onToggle: (point: DebugPoint) => void;
}>(({ point, enabled, onToggle }) => (
  <Button
    key={point.key}
    onClick={() => onToggle(point.key)}
    variant="ghost"
    size="xs"
    className="flex items-center justify-start gap-1 px-1.5 py-0.5 w-20 h-auto rounded font-medium transition-colors duration-150 bg-gray-100 text-gray-600 hover:bg-gray-200"
    style={{ fontSize: "10px", lineHeight: "12px" }}
  >
    {/* Slit indicator using harbuz Indicator */}
    <Indicator
      size="md"
      shape="slit"
      variant={enabled ? "success" : "error"}
      active={enabled}
      inactiveVariant="error"
    />
    <span className="hidden sm:inline leading-none truncate">
      {point.label}
    </span>
  </Button>
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
