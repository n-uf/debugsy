"use client";

import React, { forwardRef } from "react";

export interface TerminalLayoutSidebarProps {
  /** Child components to render in sidebar */
  children: React.ReactNode;
  /** Sidebar position - "right" (default) or "left" */
  position?: "left" | "right";
  /** Sidebar width */
  width?: string;
  /** Background color */
  backgroundColor?: string;
  /** Border color */
  borderColor?: string;
}

/**
 * TerminalLayoutSidebar - Sidebar wrapper for composable content
 *
 * Supports both left and right positioning:
 * - position="right" (default): Border on left side, typical for terminal stats
 * - position="left": Border on right side, useful for thumbnails/navigation
 *
 * Accepts a ref for scroll-into-view functionality.
 *
 * Usage:
 * ```tsx
 * // Right sidebar (default - terminal style)
 * <TerminalLayoutSidebar width="220px">
 *   <TerminalLayoutStats>
 *     <TerminalLayoutStatItem label="Logs" value={2742} />
 *   </TerminalLayoutStats>
 *   <TerminalLayoutShortcuts>
 *     <TerminalLayoutShortcut keys="⌘+D" description="Compact" />
 *   </TerminalLayoutShortcuts>
 *   <TerminalLayoutResizePresets presets={[0, 200, 400]} />
 * </TerminalLayoutSidebar>
 *
 * // Left sidebar with ref (PDF thumbnails style)
 * <TerminalLayoutSidebar ref={sidebarRef} position="left" width="100px">
 *   <TerminalLayoutStats title="Pages">
 *     <TerminalLayoutStatItem label="01" value={<Thumbnail />} />
 *   </TerminalLayoutStats>
 * </TerminalLayoutSidebar>
 * ```
 */
export const TerminalLayoutSidebar = forwardRef<
  HTMLDivElement,
  TerminalLayoutSidebarProps
>(
  (
    {
      children,
      position = "right",
      width = "220px",
      backgroundColor,
      borderColor,
    },
    ref
  ) => {
    const borderStyle = `1px solid ${borderColor ?? "rgb(var(--color-border-primary))"}`;

    return (
      <div
        ref={ref}
        className="terminal-sidebar-scroll"
        style={{
          width,
          height: "100%",
          borderLeft: position === "right" ? borderStyle : undefined,
          borderRight: position === "left" ? borderStyle : undefined,
          backgroundColor: backgroundColor ?? "rgb(var(--color-bg-secondary))",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          flexShrink: 0,
          overflowY: "auto",
          overflowX: "hidden",
          order: position === "left" ? -1 : 1,
        }}
      >
        {children}
      </div>
    );
  }
);

TerminalLayoutSidebar.displayName = "TerminalLayoutSidebar";
