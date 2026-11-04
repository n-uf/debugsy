"use client";

import React from "react";
import type { DisplayContent } from "../../patterns/display-system/display-state";
import type { DisplayQueueItem } from "../../patterns/display-system/display-queue-state";
import { Display, type DisplayAction } from "../shared/display/display";
import type { DisplayEntry } from "../shared/display/renderers/entries-mode";

export interface TraySectionProps {
  children: React.ReactNode;
  /**
   * Whether to show left border separator
   */
  separator?: boolean;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * TraySection - Section within a tray
 *
 * A generic section component for organizing elements within a tray.
 * Can be used at any position (top, bottom, or middle of a layout).
 */
export const TraySection: React.FC<TraySectionProps> = ({
  children,
  separator = false,
  className = "",
}) => {
  return (
    <div
      className={className}
      style={
        separator
          ? { borderLeft: "1px solid rgb(var(--color-chrome-border))" }
          : undefined
      }
    >
      {children}
    </div>
  );
};

TraySection.displayName = "TraySection";

export interface TrayProps {
  /**
   * Tray sections (left to right)
   */
  children: React.ReactNode;
  /**
   * Background color
   */
  backgroundColor?: string;
  /**
   * Border color
   */
  borderColor?: string;
  /**
   * Gap between sections (Tailwind class, e.g., "gap-2", "gap-4"). Default: "gap-4"
   */
  gap?: string;
  /**
   * Additional className
   */
  className?: string;
}

/**
 * Tray - Horizontal container with sections
 *
 * A generic layout component for organizing elements in a horizontal bar.
 * Can be used at any position (top, bottom, or middle of a layout).
 * Supports multiple sections with separators and display integration.
 *
 * @example
 * ```tsx
 * <Tray>
 *   <TraySection>
 *     <IndicatorButtonGroup buttons={buttons} />
 *   </TraySection>
 *
 *   <TraySection separator>
 *     <MyControls />
 *   </TraySection>
 *
 *   <TraySection separator className="flex-1">
 *     <Display entries={entries} />
 *   </TraySection>
 * </Tray>
 * ```
 */
export const Tray: React.FC<TrayProps> = ({
  children,
  backgroundColor,
  borderColor,
  gap = "gap-4",
  className = "",
}) => {
  return (
    <div
      data-harbuz-tray=""
      className={`backdrop-blur border-t shadow-sm ${className}`}
      style={{
        backgroundColor: backgroundColor ?? "rgb(var(--color-chrome-bg))",
        borderTopColor: borderColor ?? "rgb(var(--color-chrome-border))",
      }}
    >
      <div className={`flex items-stretch ${gap} px-4 py-1`}>{children}</div>
    </div>
  );
};

Tray.displayName = "Tray";

export interface TrayDisplayProps {
  /**
   * Queue items for multi-row display (NEW - highest priority)
   */
  queueItems?: DisplayQueueItem[];
  /**
   * Memorized items (not visible but kept in memory)
   */
  memorizedItems?: DisplayQueueItem[];
  /**
   * Display entries
   */
  entries?: DisplayEntry[];
  /**
   * Display content (active message)
   */
  content?: DisplayContent | null;
  /**
   * Actions for display
   */
  actions?: DisplayAction[];
  /**
   * Additional className
   */
  className?: string;
  /**
   * Custom empty state message (when no entries and no content)
   */
  emptyMessage?: string;
}

/**
 * TrayDisplay - Pre-configured display section for trays
 *
 * A convenience component that wraps Display in a tray section.
 */
export const TrayDisplay: React.FC<TrayDisplayProps> = ({
  queueItems,
  memorizedItems,
  entries = [],
  content,
  actions = [],
  className = "",
  emptyMessage,
}) => {
  return (
    <TraySection separator className={`flex-1 min-w-0 pl-4 ${className}`}>
      <Display
        queueItems={queueItems}
        memorizedItems={memorizedItems}
        entries={entries}
        content={content ?? undefined}
        actions={actions}
        emptyMessage={emptyMessage}
      />
    </TraySection>
  );
};

TrayDisplay.displayName = "TrayDisplay";
