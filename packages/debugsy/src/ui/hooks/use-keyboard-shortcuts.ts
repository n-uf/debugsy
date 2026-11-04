"use client";

import { useEffect } from "react";

/**
 * Keyboard shortcut definition
 * Combines display properties (for UI) with behavior properties (for handlers)
 */
export interface KeyboardShortcut {
  // Display properties (for TerminalLayoutShortcut)
  keys: string; // Display format: "⌘+D", "Esc", "⌘+K"
  description: string; // Human-readable description

  // Behavior properties (for event handler)
  key: string; // Actual key to match: "d", "Escape", "k"
  meta?: boolean; // Cmd (Mac) / Ctrl (Windows/Linux)
  ctrl?: boolean; // Explicit Ctrl key
  shift?: boolean; // Shift key
  alt?: boolean; // Alt/Option key

  // Handler
  handler: (event: KeyboardEvent) => void;

  // Conditional behavior
  enabled?: boolean; // Whether this shortcut is active (default: true)
  preventDefault?: boolean; // Whether to prevent default (default: true)
}

export interface UseKeyboardShortcutsConfig {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean; // Master enable/disable (default: true)
}

/**
 * useKeyboardShortcuts - Generic keyboard shortcuts hook
 *
 * Handles keyboard events and executes handlers based on shortcut definitions.
 * Designed to work with TerminalLayoutShortcut for unified display + behavior.
 *
 * @example
 * ```tsx
 * const shortcuts: KeyboardShortcut[] = [
 *   {
 *     keys: "⌘+D",
 *     description: "Toggle panel",
 *     key: "d",
 *     meta: true,
 *     handler: () => togglePanel(),
 *   },
 *   {
 *     keys: "Esc",
 *     description: "Close",
 *     key: "Escape",
 *     handler: () => close(),
 *     enabled: isOpen,
 *   },
 * ];
 *
 * useKeyboardShortcuts({ shortcuts });
 * ```
 */
export function useKeyboardShortcuts(config: UseKeyboardShortcutsConfig): void {
  const { shortcuts, enabled = true } = config;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      for (const shortcut of shortcuts) {
        // Skip if shortcut is explicitly disabled
        if (shortcut.enabled === false) continue;

        // Match key
        if (event.key !== shortcut.key) continue;

        // Match modifiers
        const metaMatch = shortcut.meta ? event.metaKey || event.ctrlKey : true;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey : true;
        const shiftMatch = shortcut.shift ? event.shiftKey : true;
        const altMatch = shortcut.alt ? event.altKey : true;

        // If no modifiers specified, ensure no modifiers pressed (except for special keys)
        const noModifiersSpecified =
          !shortcut.meta && !shortcut.ctrl && !shortcut.shift && !shortcut.alt;
        const isSpecialKey = ["Escape", "Enter", "Tab"].includes(shortcut.key);
        const noModifiersPressed =
          !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;

        const modifiersMatch =
          metaMatch &&
          ctrlMatch &&
          shiftMatch &&
          altMatch &&
          (isSpecialKey ||
            !noModifiersSpecified ||
            (noModifiersSpecified && noModifiersPressed));

        if (modifiersMatch) {
          // Prevent default unless explicitly disabled
          if (shortcut.preventDefault !== false) {
            event.preventDefault();
          }

          // Execute handler
          shortcut.handler(event);

          // Stop checking other shortcuts (first match wins)
          break;
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts, enabled]);
}
