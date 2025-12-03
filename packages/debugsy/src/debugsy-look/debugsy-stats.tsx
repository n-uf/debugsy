"use client";

import { TerminalWindowStatItem, TerminalWindowStats } from "@workspace/harbuz";
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
    <TerminalWindowStats title="Info">
      <TerminalWindowStatItem label="Total" value={totalLogs} color="#10b981" />
      <TerminalWindowStatItem
        label="Filtered"
        value={filteredLogs}
        color="#3b82f6"
      />
      <TerminalWindowStatItem
        label="Active"
        value={activeLogs}
        color="#f59e0b"
      />
      <TerminalWindowStatItem
        label="Points"
        value={activePoints}
        color="#60a5fa"
      />
      <TerminalWindowStatItem
        label="Height"
        value={`${panelHeight}px`}
        color="#fbbf24"
      />
    </TerminalWindowStats>
  );
};

DebugsyStats.displayName = "DebugsyStats";
