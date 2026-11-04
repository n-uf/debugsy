"use client";

import React from "react";
import { TripleHandle } from "./triple-handle";
import { TrafficLights } from "./traffic-lights";
import { ResizeBar } from "./resize-bar";
import { MinimalLine } from "./minimal-line";

// =============================================================================
// TYPES
// =============================================================================

export type PanelControlHandleVariant =
  | "resize"
  | "traffic"
  | "traffic-center"
  | "minimal"
  | "combined"
  | "triple-handle";

export interface PanelControlHandleProps {
  /** Visual variant */
  variant?: PanelControlHandleVariant;
  /** Resize behavior - called when drag starts */
  onResizeStart?: (e: React.MouseEvent) => void;
  /** Whether currently resizing */
  isResizing?: boolean;
  /** Traffic light - close button handler */
  onClose?: () => void;
  /** Traffic light - minimize button handler */
  onMinimize?: () => void;
  /** Traffic light - maximize button handler */
  onMaximize?: () => void;
  /** Accent color for resize bar */
  color?: string;
  /** Height of the control area */
  height?: number;
  /** Traffic light colors */
  trafficColors?: {
    close?: string;
    minimize?: string;
    maximize?: string;
  };
}

/**
 * PanelControlHandle - Generic control handle for panel headers
 *
 * Supports multiple visual variants:
 * - "resize": Centered horizontal bar for drag-to-resize (default)
 * - "traffic": Left-aligned traffic light buttons (●●●)
 * - "traffic-center": Centered traffic light buttons
 * - "triple-handle": Centered mini horizontal bars (═ ═ ═) - terminal-style traffic lights
 * - "minimal": Simple horizontal line
 * - "combined": Traffic lights + resize bar
 *
 * Usage:
 * ```tsx
 * // Resize bar (terminal style)
 * <PanelControlHandle
 *   variant="resize"
 *   onResizeStart={handleResize}
 *   isResizing={isResizing}
 * />
 *
 * // Triple handle (terminal-style window controls)
 * <PanelControlHandle
 *   variant="triple-handle"
 *   onClose={handleClose}
 *   onMinimize={handleMinimize}
 *   onMaximize={handleMaximize}
 * />
 *
 * // Traffic lights (window style)
 * <PanelControlHandle
 *   variant="traffic"
 *   onClose={handleClose}
 *   onMinimize={handleMinimize}
 *   onMaximize={handleMaximize}
 * />
 * ```
 */
export const PanelControlHandle: React.FC<PanelControlHandleProps> = ({
  variant = "resize",
  onResizeStart,
  isResizing = false,
  onClose,
  onMinimize,
  onMaximize,
  color,
  height = 6,
  trafficColors,
}) => {
  const showTrafficLights = variant === "traffic" || variant === "combined";
  const showTrafficLightsCentered = variant === "traffic-center";
  const showTripleHandle = variant === "triple-handle";
  const showResizeBar = variant === "resize" || variant === "combined";
  const showMinimalLine = variant === "minimal";

  return (
    <div
      onMouseDown={showResizeBar ? onResizeStart : undefined}
      style={{
        position: "absolute",
        top: "-2px",
        left: "0",
        right: "0",
        height: `${height}px`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: showResizeBar && onResizeStart ? "ns-resize" : "default",
        zIndex: 10,
      }}
    >
      {/* Triple handle - centered mini bars */}
      {showTripleHandle && (
        <TripleHandle
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          colors={trafficColors}
        />
      )}

      {/* Traffic lights - left aligned */}
      {showTrafficLights && (
        <TrafficLights
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          colors={trafficColors}
          centered={false}
        />
      )}

      {/* Traffic lights - centered */}
      {showTrafficLightsCentered && (
        <TrafficLights
          onClose={onClose}
          onMinimize={onMinimize}
          onMaximize={onMaximize}
          colors={trafficColors}
          centered={true}
        />
      )}

      {/* Resize bar - centered */}
      {showResizeBar && (
        <ResizeBar
          onResizeStart={onResizeStart}
          isResizing={isResizing}
          color={color}
        />
      )}

      {/* Minimal line */}
      {showMinimalLine && <MinimalLine color={color} />}
    </div>
  );
};

PanelControlHandle.displayName = "PanelControlHandle";

