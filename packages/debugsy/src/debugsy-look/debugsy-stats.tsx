"use client";

import { SidebarSection, StatList } from "../ui";
import React from "react";

export interface DebugsyStatsProps {
  totalLogs: number;
  filteredLogs: number;
  activeLogs: number;
  activePoints: number;
  panelHeight: number;
}

/** The sidebar's Info block: log counts, points, panel height */
export const DebugsyStats: React.FC<DebugsyStatsProps> = ({
  totalLogs,
  filteredLogs,
  activeLogs,
  activePoints,
  panelHeight,
}) => (
  <SidebarSection title="Info">
    <StatList
      items={[
        { label: "Total", value: totalLogs },
        {
          label: "Filtered",
          value: filteredLogs,
          tone: filteredLogs !== totalLogs ? "led" : undefined,
        },
        {
          label: "Active",
          value: activeLogs,
          tone: activeLogs !== filteredLogs ? "warn" : undefined,
        },
        { label: "Points", value: activePoints, tone: "led" },
        { label: "Height", value: `${panelHeight}px` },
      ]}
    />
  </SidebarSection>
);

DebugsyStats.displayName = "DebugsyStats";
