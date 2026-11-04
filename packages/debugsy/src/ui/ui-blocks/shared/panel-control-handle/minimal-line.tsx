"use client";

import React from "react";

export interface MinimalLineProps {
  color?: string;
}

/**
 * MinimalLine - Simple horizontal line divider
 *
 * A minimal horizontal line used as a visual divider in panel controls.
 *
 * Usage:
 * ```tsx
 * <MinimalLine color="rgb(var(--color-border-primary))" />
 * ```
 */
export const MinimalLine: React.FC<MinimalLineProps> = ({ color }) => {
  const resolvedColor = color ?? "rgb(var(--color-border-primary))";
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: "50%",
        height: "1px",
        backgroundColor: resolvedColor,
      }}
    />
  );
};

MinimalLine.displayName = "MinimalLine";

