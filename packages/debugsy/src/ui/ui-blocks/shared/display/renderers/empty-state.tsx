"use client";

/**
 * Empty State Renderer
 *
 * Renders empty state message when no content is available.
 */

import React from "react";

export interface EmptyStateProps {
  /** Empty state message */
  message: string;
}

/**
 * EmptyState - Empty state renderer
 *
 * Shows centered message when display has no content.
 */
export const EmptyState: React.FC<EmptyStateProps> = ({ message }) => {
  return (
    <div
      style={{
        color: "#6b7280",
        fontSize: "11px",
        fontFamily: "monospace",
        textAlign: "center",
        width: "100%",
      }}
    >
      {message}
    </div>
  );
};

EmptyState.displayName = "EmptyState";

