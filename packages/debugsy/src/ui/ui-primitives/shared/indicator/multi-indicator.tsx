"use client";

import React from "react";
import { Indicator } from "./indicator";

export interface MultiIndicatorProps {
  /**
   * Array of indicator states (true = active, false = inactive)
   */
  indicators: boolean[];
  /**
   * Size of each indicator
   */
  size?: "sm" | "md" | "lg";
  /**
   * Active variant
   */
  activeVariant?: "success" | "error" | "warning" | "info" | "neutral";
  /**
   * Inactive variant
   */
  inactiveVariant?: "error" | "neutral";
  /**
   * Whether all indicators are disabled
   */
  disabled?: boolean;
  /**
   * Gap between indicators (Tailwind class)
   */
  gap?: string;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Multi Indicator - Multiple indicators in a row
 *
 * Displays multiple LED-style indicators in a row, useful for showing
 * multi-level status or progress states.
 *
 * Extracted from showcase control-buttons ThreeDotIndicator pattern.
 *
 * @example
 * ```tsx
 * // Three-dot indicator for level 2 out of 3
 * <MultiIndicator indicators={[true, true, false]} activeVariant="success" />
 *
 * // Filter status (all or specific options)
 * <MultiIndicator indicators={[true, false, true]} />
 * ```
 */
export const MultiIndicator: React.FC<MultiIndicatorProps> = ({
  indicators,
  size = "sm",
  activeVariant = "success",
  inactiveVariant = "neutral",
  disabled = false,
  gap = "gap-0.5",
  className = "",
}) => {
  // If disabled or all inactive, show all as inactive/error
  if (disabled || indicators.every((state) => !state)) {
    return (
      <div className={`flex items-center ${gap} ${className}`}>
        {indicators.map((_, index) => (
          <Indicator
            key={index}
            size={size}
            shape="vertical-slit"
            variant="error"
            active={false}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      {indicators.map((isActive, index) => (
        <Indicator
          key={index}
          size={size}
          shape="vertical-slit"
          variant={isActive ? activeVariant : inactiveVariant}
          active={isActive}
        />
      ))}
    </div>
  );
};

MultiIndicator.displayName = "MultiIndicator";

