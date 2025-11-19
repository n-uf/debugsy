"use client";

import {
  type KeyboardShortcut,
  TerminalLayoutShortcut,
  TerminalLayoutShortcuts,
  useKeyboardShortcuts,
} from "@workspace/harbuz";
import React from "react";

export interface DebugsyShortcutsProps {
  /**
   * Callback to toggle between compact and extended modes
   */
  onToggleCompactExtended: () => void;
  /**
   * Callback to handle smart clear
   */
  onClear: () => void;
  /**
   * Callback to close the panel
   */
  onClose: () => void;
  /**
   * Whether the panel is enabled (visible and ready for interaction)
   * - ⌘+D (toggle) is always globally active
   * - ⌘+K (clear) and Esc (close) only work when enabled
   */
  enabled?: boolean;
}

/**
 * DebugsyShortcuts - Self-contained keyboard shortcuts component
 *
 * Handles both display and behavior of keyboard shortcuts.
 * Encapsulates all shortcut logic for DebugsyLook.
 *
 * @example
 * ```tsx
 * <DebugsyShortcuts
 *   onToggleCompactExtended={handleToggle}
 *   onClear={handleSmartClear}
 *   onClose={handleClose}
 *   enabled={isVisible && !isResizing}
 * />
 * ```
 */
export const DebugsyShortcuts: React.FC<DebugsyShortcutsProps> = ({
  onToggleCompactExtended,
  onClear,
  onClose,
  enabled = true,
}) => {
  // Define all shortcuts with handlers
  const shortcuts: KeyboardShortcut[] = React.useMemo(
    () => [
      {
        keys: "⌘+D",
        description: "Compact/Extended",
        key: "d",
        meta: true,
        handler: onToggleCompactExtended,
        // Always globally active (not affected by enabled prop)
      },
      {
        keys: "⌘+A",
        description: "Select logs",
        key: "a",
        meta: true,
        enabled: false, // Handled by useKeyboardSelection hook
        handler: () => {}, // No-op (handled elsewhere)
      },
      {
        keys: "⌘+K",
        description: "Clear logs",
        key: "k",
        meta: true,
        enabled, // Only active when panel is enabled
        handler: onClear,
      },
      {
        keys: "Esc",
        description: "Close panel",
        key: "Escape",
        enabled, // Only active when panel is enabled
        handler: onClose,
      },
    ],
    [onToggleCompactExtended, onClear, onClose, enabled]
  );

  // Register keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  // Display shortcuts
  return (
    <TerminalLayoutShortcuts title="Shortcuts">
      {shortcuts.map((shortcut, index) => (
        <TerminalLayoutShortcut
          key={`${shortcut.key}-${index}`}
          keys={shortcut.keys}
          description={shortcut.description}
        />
      ))}
    </TerminalLayoutShortcuts>
  );
};

DebugsyShortcuts.displayName = "DebugsyShortcuts";
