"use client";

import { TerminalLayoutStatItem, TerminalLayoutStats } from "@workspace/harbuz";
import React from "react";

export interface DebugsyStatsProps {
  /**
   * Total number of logs
   */
  totalLogs: number;
  /**
   * Number of filtered logs
   */
  filteredLogs: number;
  /**
   * Number of active logs (displayed)
   */
  activeLogs: number;
  /**
   * Number of active debug points
   */
  activePoints: number;
  /**
   * Current panel height
   */
  panelHeight: number;
}

/**
 * DebugsyStats - Statistics display component
 *
 * Displays key statistics about the debug panel state.
 * Self-contained with all stat calculation and display logic.
 *
 * @example
 * ```tsx
 * <DebugsyStats
 *   totalLogs={logs.length}
 *   filteredLogs={filteredLogs.length}
 *   activeLogs={activeLogs.length}
 *   activePoints={activePoints}
 *   panelHeight={panelHeight}
 * />
 * ```
 */
export const DebugsyStats: React.FC<DebugsyStatsProps> = ({
  totalLogs,
  filteredLogs,
  activeLogs,
  activePoints,
  panelHeight,
}) => {
  return (
    <TerminalLayoutStats title="Info">
      <TerminalLayoutStatItem label="Total" value={totalLogs} color="#10b981" />
      <TerminalLayoutStatItem
        label="Filtered"
        value={filteredLogs}
        color="#3b82f6"
      />
      <TerminalLayoutStatItem
        label="Active"
        value={activeLogs}
        color="#f59e0b"
      />
      <TerminalLayoutStatItem
        label="Points"
        value={activePoints}
        color="#60a5fa"
      />
      <TerminalLayoutStatItem
        label="Height"
        value={`${panelHeight}px`}
        color="#fbbf24"
      />
    </TerminalLayoutStats>
  );
};

DebugsyStats.displayName = "DebugsyStats";
