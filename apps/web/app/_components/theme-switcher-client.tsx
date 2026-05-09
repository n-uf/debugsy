"use client";

import { ThemeSwitcher } from "@workspace/harbuz";
import type React from "react";

/**
 * Client wrapper for the harbuz ThemeSwitcher so the rest of the page
 * (layout, hero, modules table) can stay server-rendered for SEO.
 */
export function ThemeSwitcherClient(): React.ReactElement {
  return <ThemeSwitcher variant="compact" />;
}
