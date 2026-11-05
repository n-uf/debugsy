/**
 * The panel's stylesheet: every fragment concatenated into one string,
 * rendered as a React 19 hoisted style (`<style href precedence>`). React
 * moves it into `<head>` and renders it once however many components ask for
 * it, during server rendering too. A changed stylesheet gets a new `href`
 * (a content hash), so React swaps it.
 *
 * Components that can render on their own (the panel, `ModuleNav`) render
 * `<DebugsyStyles />` themselves: the app imports no CSS.
 */

import type React from "react";
import { BASE_CSS } from "./base";
import { CONTROLS_CSS } from "./controls";
import { LOG_CSS } from "./log";
import { PRIMITIVES_CSS } from "./primitives";
import { THEMES_CSS } from "./themes";
import { TRAY_CSS } from "./tray";
import { WINDOW_CSS } from "./window";

/** Every fragment, by part (for tests) */
export const DEBUGSY_CSS_FRAGMENTS = {
  base: BASE_CSS,
  themes: THEMES_CSS,
  primitives: PRIMITIVES_CSS,
  window: WINDOW_CSS,
  controls: CONTROLS_CSS,
  log: LOG_CSS,
  tray: TRAY_CSS,
} as const;

export const DEBUGSY_CSS = Object.values(DEBUGSY_CSS_FRAGMENTS).join("");

/** Short content hash (djb2), base 36 */
export function hashText(text: string): string {
  let h = 5381;
  for (let i = 0; i < text.length; i++) h = ((h << 5) + h + text.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

const HREF = `debugsy-${hashText(DEBUGSY_CSS)}`;

/** Renders the panel's stylesheet (React dedupes it by `href`) */
export function DebugsyStyles(): React.ReactElement {
  return (
    <style href={HREF} precedence="default">
      {DEBUGSY_CSS}
    </style>
  );
}
