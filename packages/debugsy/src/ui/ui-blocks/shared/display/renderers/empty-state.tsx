"use client";

/**
 * Empty State Renderer
 *
 * Renders a dim message when the readout has nothing to show.
 */

import React from "react";

export interface EmptyStateProps {
  /** Empty state message */
  message: string;
}

/**
 * EmptyState - Empty state renderer
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return <div className="dbg-readout-empty">{message}</div>;
};

EmptyState.displayName = "EmptyState";
