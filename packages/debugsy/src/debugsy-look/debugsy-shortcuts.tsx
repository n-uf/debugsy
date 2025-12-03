"use client";

import {
  type KeyboardShortcut,
  TerminalWindowShortcut,
  TerminalWindowShortcuts,
} from "@workspace/harbuz";
import React from "react";

export interface DebugsyShortcutsDisplayProps {
  /**
   * Keyboard shortcuts to display
   */
  shortcuts: KeyboardShortcut[];
}

/**
 * DebugsyShortcutsDisplay - Display keyboard shortcuts in sidebar
 *
 * Pure presentational component - only displays shortcuts.
 * Keyboard handler registration is handled by useDebugsyShortcuts hook.
 *
 * @example
 * ```tsx
 * const { shortcuts } = useDebugsyShortcuts({ ... });
 * <DebugsyShortcutsDisplay shortcuts={shortcuts} />
 * ```
 */
export const DebugsyShortcutsDisplay: React.FC<
  DebugsyShortcutsDisplayProps
> = ({ shortcuts }) => {
  return (
    <TerminalWindowShortcuts title="Shortcuts">
      {shortcuts.map((shortcut, index) => (
        <TerminalWindowShortcut
          key={`${shortcut.key}-${index}`}
          keys={shortcut.keys}
          description={shortcut.description}
        />
      ))}
    </TerminalWindowShortcuts>
  );
};

DebugsyShortcutsDisplay.displayName = "DebugsyShortcutsDisplay";
