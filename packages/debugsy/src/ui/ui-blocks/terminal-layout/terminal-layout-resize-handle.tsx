"use client";

import React from "react";
import { PanelControlHandle } from "../shared/panel-control-handle/panel-control-handle";

// =============================================================================
// BACKWARDS COMPATIBILITY ALIAS
// =============================================================================

export interface TerminalLayoutResizeHandleProps {
  onResizeStart: (e: React.MouseEvent) => void;
  isResizing?: boolean;
  color?: string;
}

/**
 * TerminalLayoutResizeHandle - Drag handle for resizing panel
 *
 * @deprecated Use PanelControlHandle with variant="resize" instead
 *
 * Usage:
 * ```tsx
 * <TerminalLayoutResizeHandle
 *   onResizeStart={handleResizeStart}
 *   isResizing={isResizing}
 * />
 * ```
 */
export const TerminalLayoutResizeHandle: React.FC<TerminalLayoutResizeHandleProps> = ({
  onResizeStart,
  isResizing = false,
  color,
}) => {
  return (
    <PanelControlHandle
      variant="resize"
      onResizeStart={onResizeStart}
      isResizing={isResizing}
      color={color}
    />
  );
};

TerminalLayoutResizeHandle.displayName = "TerminalLayoutResizeHandle";

// =============================================================================
// RE-EXPORT PANEL CONTROL HANDLE (for convenience)
// =============================================================================

export {
  PanelControlHandle,
  type PanelControlHandleProps,
  type PanelControlHandleVariant,
} from "../shared/panel-control-handle";

