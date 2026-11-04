"use client";

import React, { createContext, useContext } from "react";

/**
 * The panel's frame (replaces harbuz's TerminalLayout family): a dark chassis
 * at the bottom of the viewport with a resize edge, a body (logs, action
 * rail, sidebar) and the control tray. Styled by `styles/window.ts`.
 */

interface WindowContextValue {
  bodyHeight: number;
}

const WindowContext = createContext<WindowContextValue>({ bodyHeight: 0 });

export interface WindowProps {
  /** Height of the body (the log viewport), in px */
  bodyHeight: number;
  isResizing?: boolean;
  /** Compact: the control tray only */
  isCompact?: boolean;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ bodyHeight, isResizing = false, isCompact = false, children }) => (
  <WindowContext.Provider value={{ bodyHeight }}>
    <div
      className="dbg-window"
      data-compact={isCompact ? "true" : undefined}
      data-resizing={isResizing ? "true" : undefined}
    >
      {children}
    </div>
  </WindowContext.Provider>
);

export interface WindowEdgeProps {
  onResizeStart: (event: React.MouseEvent) => void;
  isResizing?: boolean;
}

/** The top edge: drag it to resize the panel */
export const WindowEdge: React.FC<WindowEdgeProps> = ({ onResizeStart, isResizing = false }) => (
  <div
    className="dbg-edge"
    role="separator"
    aria-orientation="horizontal"
    aria-label="Resize panel"
    title="Drag to resize"
    data-active={isResizing ? "true" : undefined}
    onMouseDown={onResizeStart}
  />
);

/** Logs, action rail and sidebar, side by side, at the body height */
export const WindowBody: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bodyHeight } = useContext(WindowContext);
  return (
    <div className="dbg-body" style={{ height: `${bodyHeight}px` }}>
      {children}
    </div>
  );
};

/** The log area */
export const WindowContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dbg-content">{children}</div>
);

/** The narrow column of actions between the logs and the sidebar */
export const WindowRail: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dbg-rail">{children}</div>
);

/** The raised sidebar on the right */
export const WindowSidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dbg-sidebar dbg-scroll">{children}</div>
);

/** The control tray at the bottom */
export const WindowControl: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="dbg-control">{children}</div>
);

// ─── Sidebar sections ─────────────────────────────────────────────────────────

export interface SidebarSectionProps {
  title?: React.ReactNode;
  /** Words at the right end of the title line */
  aside?: React.ReactNode;
  noBorder?: boolean;
  children: React.ReactNode;
}

/** A titled block of the sidebar, divided from the next by a hairline */
export const SidebarSection: React.FC<SidebarSectionProps> = ({ title, aside, noBorder, children }) => (
  <section className="dbg-section" data-border={noBorder ? "none" : undefined}>
    {(title || aside) && (
      <div className="dbg-section-title">
        <span>{title}</span>
        {aside}
      </div>
    )}
    {children}
  </section>
);

export type StatTone = "led" | "ok" | "warn" | "caution";

export interface StatItem {
  label: string;
  value: React.ReactNode;
  tone?: StatTone;
}

/** Label / value pairs in two aligned columns, tabular numerals */
export const StatList: React.FC<{ items: readonly StatItem[] }> = ({ items }) => (
  <div className="dbg-stats">
    {items.map((item) => (
      <React.Fragment key={item.label}>
        <span className="dbg-stat-label">{item.label}</span>
        <span className="dbg-stat-value" data-tone={item.tone}>
          {item.value}
        </span>
      </React.Fragment>
    ))}
  </div>
);

export interface ShortcutItem {
  /** Display form of the keys, e.g. "⌘+D" */
  keys: string;
  description: string;
  onClick?: () => void;
}

/** Keycaps and what they do */
export const ShortcutList: React.FC<{ items: readonly ShortcutItem[] }> = ({ items }) => (
  <div className="dbg-shortcuts">
    {items.map((item, i) => {
      const parts = (
        <>
          <span className="dbg-keycap">{item.keys}</span>
          <span>{item.description}</span>
        </>
      );
      return item.onClick ? (
        <button key={`${item.keys}-${i}`} type="button" onClick={item.onClick}>
          {parts}
        </button>
      ) : (
        <React.Fragment key={`${item.keys}-${i}`}>{parts}</React.Fragment>
      );
    })}
  </div>
);
