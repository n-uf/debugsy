"use client";

import { type KeyboardShortcut, ShortcutList, SidebarSection } from "../ui";
import React from "react";

export interface DebugsyShortcutsDisplayProps {
  shortcuts: KeyboardShortcut[];
}

/** The sidebar's Shortcuts block: keycaps and what they do */
export const DebugsyShortcutsDisplay: React.FC<DebugsyShortcutsDisplayProps> = ({ shortcuts }) => (
  <SidebarSection title="Shortcuts">
    <ShortcutList
      items={shortcuts.map((shortcut) => ({
        keys: shortcut.keys,
        description: shortcut.description,
      }))}
    />
  </SidebarSection>
);

DebugsyShortcutsDisplay.displayName = "DebugsyShortcutsDisplay";
