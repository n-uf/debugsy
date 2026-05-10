"use client";

import { useTheme, type ThemeName } from "@workspace/harbuz";
import type React from "react";

// =============================================================================
// THEME DOCK — drop-in replacement for the harbuz ThemeSwitcher.
//
// Each dot is a 3-zone color stack (accent ring → chrome band → panel
// core), built from stacked inset box-shadows so no extra DOM is needed.
// Pattern adapted from `nazax-home/src/styles/global.css` (the mobile
// `.status-left` floating palette).
//
// Two layout drop-ins are exported so the same component can serve
// multiple placements without duplicating the palette logic:
//
//   - `<ThemeSwitcherClient />`              vertical, medium dots
//                                            (LeftRail / floating dock)
//   - `<ThemeSwitcherClient orientation="horizontal" size="sm" />`
//                                            horizontal, small dots
//                                            (above the debugsy panel)
//
// Both share the same palette, the same active-pulse animation, and
// the same per-dot 3-zone composition.
//
// Why hardcoded swatches (not CSS vars)?
//   The dot for theme X must show X's colors regardless of which theme
//   is currently active. CSS variables only resolve to the active
//   theme, so we mirror canonical values from `themes.css` here.
// =============================================================================

export type ThemeSwitcherOrientation = "vertical" | "horizontal";
export type ThemeSwitcherSize = "sm" | "md";

export interface ThemeSwitcherClientProps {
  /** Lay dots out as a column ("vertical", default) or row ("horizontal"). */
  readonly orientation?: ThemeSwitcherOrientation;
  /** "sm" = 12×14 dots; "md" (default) = 16×18 dots. */
  readonly size?: ThemeSwitcherSize;
}

interface ThemeChip {
  readonly label: string;
  readonly category: "dark" | "light";
  /** Innermost fill — the theme's DOMINANT background (panel surface).
   *  This is the color users actually look at most of the time when
   *  the theme is active, so the dot's core mirrors it directly. */
  readonly panel: string;
  /** Middle band — the theme's secondary chrome surface. Picked so
   *  the dot reads as 3 distinct color zones from outer→inner. */
  readonly chrome: string;
  /** Outer ring — the theme's ACCENT, always visible. */
  readonly accent: string;
}

const THEME_ORDER: readonly ThemeName[] = [
  "ocean",
  "abyss",
  "studio",
  "midnight",
  "daylight",
  "parchment",
];

/**
 * Per-theme triple. Each row is hand-tuned so the resulting 3-zone dot
 * is unique at a glance even at the 14×16 px target size:
 *
 *   ocean    blue   ↔ light slate ↔ dark navy   (hybrid, blue accent)
 *   abyss    indigo ↔ dark slate  ↔ dark navy   (mono dark, indigo accent)
 *   studio   green  ↔ light gray  ↔ pure black  (hybrid, green accent)
 *   midnight green  ↔ dark zinc   ↔ pure black  (mono dark, green accent)
 *   daylight blue   ↔ cool gray   ↔ pure white  (mono light, cool)
 *   parchment sky   ↔ warm cream  ↔ warm cream  (mono light, warm)
 *
 * Each pair (ocean/abyss, studio/midnight, daylight/parchment) is now
 * separated on TWO axes simultaneously (chrome contrast + accent hue),
 * so they never look like the same dot at thumbnail scale.
 */
const CHIPS: Record<ThemeName, ThemeChip> = {
  ocean: {
    label: "ocean",
    category: "dark",
    panel: "#0f172a", // slate-900
    chrome: "#cbd5e1", // slate-300 (LIGHT — visible on dark panel)
    accent: "#60a5fa", // blue-400
  },
  abyss: {
    label: "abyss",
    category: "dark",
    panel: "#0f172a", // slate-900
    chrome: "#475569", // slate-600 (DARK — distinct from ocean's light)
    accent: "#818cf8", // indigo-400
  },
  studio: {
    label: "studio",
    category: "dark",
    panel: "#0a0a0a", // near-black
    chrome: "#cbd5e1", // slate-300 (LIGHT)
    accent: "#10b981", // emerald-500
  },
  midnight: {
    label: "midnight",
    category: "dark",
    panel: "#000000", // pure black
    chrome: "#3f3f46", // zinc-700 (DARK — distinct from studio's light)
    accent: "#34d399", // emerald-400 (slightly brighter than studio)
  },
  daylight: {
    label: "daylight",
    category: "light",
    panel: "#ffffff", // pure white
    chrome: "#9ca3af", // gray-400 (cool, visible on white)
    accent: "#3b82f6", // blue-500
  },
  parchment: {
    label: "parchment",
    category: "light",
    panel: "#fefcf7", // warm cream
    chrome: "#c8b99c", // warm tan-300 (warm, visible on cream)
    accent: "#0ea5e9", // sky-500
  },
};

/**
 * Drop-in theme dock, layout-flexible.
 *   `orientation`: "vertical" (default, column) | "horizontal" (row)
 *   `size`:        "md" (default, 16×18) | "sm" (12×14)
 *
 * Server-renders with the default theme highlighted; reconciles in
 * place once `useTheme` hydrates the persisted choice — no layout
 * shift, just an attribute swap.
 */
export function ThemeSwitcherClient({
  orientation = "vertical",
  size = "md",
}: ThemeSwitcherClientProps = {}): React.ReactElement {
  const { theme, setTheme } = useTheme();

  // Keyframe shadow stacks differ by size so the resting 3-zone
  // composition (accent ring + chrome band) scales proportionally
  // with the dot itself — never balloons over the panel core.
  const dims = size === "sm" ? SM_DIMS : MD_DIMS;

  return (
    <>
      {/* Pulse keyframes scoped to this size. The animation always
          carries the resting inset stack (accent ring + chrome band),
          then layers an OUTER glow on top — so the 3 zones stay
          readable while the active dot "breathes". */}
      <style>{`
        @keyframes ${dims.pulseName} {
          0%, 100% {
            box-shadow:
              inset 0 0 0 ${dims.ringPx}px var(--theme-accent),
              inset 0 0 0 ${dims.ringPx + dims.bandPx}px var(--theme-chrome);
          }
          50% {
            box-shadow:
              inset 0 0 0 ${dims.ringPx}px var(--theme-accent),
              inset 0 0 0 ${dims.ringPx + dims.bandPx}px var(--theme-chrome),
              0 0 ${dims.glowPx}px 1px var(--theme-accent);
          }
        }
      `}</style>

      <ul
        role="radiogroup"
        aria-label="theme"
        className={[
          "flex items-center",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          // Smaller dots want a tighter gap so the row reads as a
          // coherent palette strip rather than spaced-out radio buttons.
          // MD keeps the original 6 px breathing room.
          size === "sm" ? "gap-0.5" : "gap-1.5",
        ].join(" ")}
      >
        {THEME_ORDER.map((name) => (
          <ThemeDot
            key={name}
            name={name}
            isActive={theme === name}
            onActivate={() => setTheme(name)}
            dims={dims}
          />
        ))}
      </ul>
    </>
  );
}

interface DotDims {
  readonly w: number;
  readonly h: number;
  /** Outer ring (accent) thickness in px. */
  readonly ringPx: number;
  /** Middle band (chrome) thickness in px, MEASURED FROM THE RING'S
   *  INNER EDGE. The total inset is `ringPx + bandPx`. */
  readonly bandPx: number;
  /** Outer glow radius for the active pulse, px. */
  readonly glowPx: number;
  /** Unique keyframe name per size — multiple instances on the page
   *  must not stomp on each other's @keyframes registration. */
  readonly pulseName: string;
}

// Ring + band are deliberately FAT relative to the dot footprint so
// the accent + chrome zones dominate the visual signature; the panel
// core is just a small inner dot. Earlier proportions made the core
// look like the dominant element, which inverted the intent.
//
//   MD (16×18): ring 2.5 + band 3.5 = 6 px inset → 4×6 px panel core
//   SM (12×14): ring 2   + band 2.5 = 4.5 px inset → 3×5 px panel core

/** Standard size — used by the floating right-edge dock. */
const MD_DIMS: DotDims = {
  w: 16,
  h: 18,
  ringPx: 2.5,
  bandPx: 3.5,
  glowPx: 8,
  pulseName: "debugsy-theme-pulse-md",
};

/** Compact size — used by the strip in LeftRail above the wordmark. */
const SM_DIMS: DotDims = {
  w: 12,
  h: 14,
  ringPx: 2,
  bandPx: 2.5,
  glowPx: 6,
  pulseName: "debugsy-theme-pulse-sm",
};

interface ThemeDotProps {
  readonly name: ThemeName;
  readonly isActive: boolean;
  readonly onActivate: () => void;
  readonly dims: DotDims;
}

const REST_OPACITY = 0.7;
const HOVER_OPACITY = 1;

/**
 * Single theme dot. Three concentric color zones, all visible at rest:
 *
 *   ┌─────────────────┐  ← outer 2px ring  → ACCENT  (theme identity hue)
 *   │ ┌─────────────┐ │
 *   │ │ ┌─────────┐ │ │  ← middle 3px band → CHROME  (secondary surface)
 *   │ │ │█████████│ │ │  ← inner core      → PANEL   (dominant bg)
 *   │ │ └─────────┘ │ │
 *   │ └─────────────┘ │
 *   └─────────────────┘
 *
 * Active state animates an outer glow in the same accent ("pulse")
 * without disturbing the resting 3 layers — so the user can still
 * read the theme's full color profile while one dot breathes.
 *
 * CSS variables `--theme-accent` and `--theme-chrome` are set per
 * element so the keyframe animation can pull the right colors without
 * prop interpolation.
 */
function ThemeDot({
  name,
  isActive,
  onActivate,
  dims,
}: ThemeDotProps): React.ReactElement {
  const c = CHIPS[name];

  // Stacked inset shadows scaled to the current dot size. Earlier
  // shadows render on top, so the (smaller) accent ring sits on top
  // of the (larger) chrome band — exactly the visual we want.
  const restingShadow =
    `inset 0 0 0 ${dims.ringPx}px ${c.accent}, ` +
    `inset 0 0 0 ${dims.ringPx + dims.bandPx}px ${c.chrome}`;

  return (
    <li>
      <button
        type="button"
        role="radio"
        aria-checked={isActive}
        onClick={onActivate}
        title={`${c.label} (${c.category})`}
        aria-label={c.label}
        className="block transition-[opacity,transform] duration-150 will-change-transform"
        style={{
          // Pulse keyframes pull from these.
          ["--theme-accent" as string]: c.accent,
          ["--theme-chrome" as string]: c.chrome,
          width: `${dims.w}px`,
          height: `${dims.h}px`,
          borderRadius: "3px",
          // Innermost layer = panel (the theme's dominant bg).
          backgroundColor: c.panel,
          // Resting state: 3 zones via stacked inset shadows.
          // Active: keyframe takes over (it includes the same insets).
          boxShadow: isActive ? undefined : restingShadow,
          animation: isActive
            ? `${dims.pulseName} 2s ease-in-out infinite`
            : "none",
          opacity: isActive ? 1 : REST_OPACITY,
          cursor: "pointer",
          padding: 0,
          border: "none",
        }}
        onMouseEnter={(e) => {
          if (isActive) return;
          e.currentTarget.style.opacity = String(HOVER_OPACITY);
          e.currentTarget.style.transform = "scale(1.15)";
        }}
        onMouseLeave={(e) => {
          if (isActive) return;
          e.currentTarget.style.opacity = String(REST_OPACITY);
          e.currentTarget.style.transform = "scale(1)";
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = `1px solid ${c.accent}`;
          e.currentTarget.style.outlineOffset = "2px";
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = "none";
        }}
      />
    </li>
  );
}
