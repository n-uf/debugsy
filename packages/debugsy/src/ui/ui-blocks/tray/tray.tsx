"use client";

import React from "react";
import type { DisplayContent } from "../../patterns/display-system/display-state";
import type { DisplayQueueItem } from "../../patterns/display-system/display-queue-state";
import { Display, type DisplayAction } from "../shared/display/display";
import type { DisplayEntry } from "../shared/display/renderers/entries-mode";

const withClass = (base: string, extra?: string): string =>
  extra ? `${base} ${extra}` : base;

export interface TraySectionProps {
  children: React.ReactNode;
  /**
   * Whether to show a hairline on the left, between this section and the
   * previous one
   */
  separator?: boolean;
  /**
   * Additional className (appended to the section's own)
   */
  className?: string;
}

/**
 * TraySection - Section within a tray
 *
 * A generic section component for organizing elements within a tray.
 * Its items stretch to the strip's height.
 */
export const TraySection: React.FC<TraySectionProps> = ({
  children,
  separator = false,
  className,
}) => {
  return (
    <div
      className={withClass("dbg-tray-section", className)}
      data-separator={separator ? "true" : undefined}
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
   * Additional className (appended to the tray's own)
   */
  className?: string;
}

/**
 * Tray - the panel's bottom control strip
 *
 * A horizontal strip on the panel background with a hairline on top. Its
 * sections run left to right, stretched to the strip's height, with hairlines
 * between those that ask for one.
 *
 * @example
 * ```tsx
 * <Tray>
 *   <TraySection>
 *     <ModuleNav />
 *   </TraySection>
 *
 *   <TraySection separator>
 *     <MyControls />
 *   </TraySection>
 *
 *   <TrayDisplay entries={entries} actions={actions} />
 * </Tray>
 * ```
 */
export const Tray: React.FC<TrayProps> = ({ children, className }) => {
  return (
    <div data-dbg-tray="" className={withClass("dbg-tray", className)}>
      <div className="dbg-tray-row">{children}</div>
    </div>
  );
};

Tray.displayName = "Tray";

export interface TrayDisplayProps {
  /**
   * Queue items for multi-row display (highest priority)
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
   * Action words at the right end of the display
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
 * Wraps the readout in a tray section that fills the rest of the strip.
 */
export const TrayDisplay: React.FC<TrayDisplayProps> = ({
  queueItems,
  memorizedItems,
  entries = [],
  content,
  actions = [],
  className,
  emptyMessage,
}) => {
  return (
    <TraySection className={withClass("dbg-tray-display", className)}>
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
