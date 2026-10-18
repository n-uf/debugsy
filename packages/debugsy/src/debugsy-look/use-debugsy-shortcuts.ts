"use client";

import { type KeyboardShortcut, useKeyboardShortcuts } from "@n-uf/harbuz";
import { useMemo } from "react";

export interface UseDebugsyShortcutsConfig {
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

export interface UseDebugsyShortcutsReturn {
  /**
   * Keyboard shortcuts definition (for display purposes)
   */
  shortcuts: KeyboardShortcut[];
}

/**
 * Hook to register DebugsyLook keyboard shortcuts
 *
 * Separates keyboard handler registration from UI display.
 * Always registers handlers (especially ⌘+D for global toggle).
 *
 * ⌘+D behavior:
 * - First click (from hidden): Show compact mode (controls only)
 * - Second click: Show extended mode (full logs)
 * - Subsequent clicks: Toggle between compact ↔ extended
 * - Esc: Close completely (back to hidden)
 *
 * @example
 * ```tsx
 * const { shortcuts } = useDebugsyShortcuts({
 *   onToggleCompactExtended: handleToggle,
 *   onClear: handleSmartClear,
 *   onClose: handleClose,
 *   enabled: isVisible && !isResizing,
 * });
 * ```
 */
export function useDebugsyShortcuts(
  config: UseDebugsyShortcutsConfig
): UseDebugsyShortcutsReturn {
  const { onToggleCompactExtended, onClear, onClose, enabled = true } = config;

  // Define all shortcuts with handlers
  const shortcuts: KeyboardShortcut[] = useMemo(
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

  // Register keyboard shortcuts (always active)
  useKeyboardShortcuts({
    shortcuts,
    enabled: true,
  });

  return { shortcuts };
}
