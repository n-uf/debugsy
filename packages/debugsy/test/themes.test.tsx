import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { DebugsyLook } from "../src/debugsy-look";
import { DEBUGSY_CSS, DEBUGSY_CSS_FRAGMENTS } from "../src/ui/styles/sheet";
import { THEME_TOKENS } from "../src/ui/styles/themes";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// ─── WCAG 2 contrast ─────────────────────────────────────────────────────────

type Rgb = readonly [number, number, number];

const rgb = (triplet: string): Rgb => {
  const [r = 0, g = 0, b = 0] = triplet.split("/")[0]!.trim().split(/\s+/).map(Number);
  return [r, g, b];
};
const alphaOf = (triplet: string): number => Number(triplet.split("/")[1] ?? 1);
const channel = (c: number): number => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]: Rgb): number =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const contrast = (a: Rgb, b: Rgb): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** `top` at `alpha` over `under` */
const over = (top: Rgb, alpha: number, under: Rgb): Rgb =>
  [0, 1, 2].map((i) => top[i]! * alpha + under[i]! * (1 - alpha)) as unknown as Rgb;

describe("theme tokens", () => {
  const names = Object.keys(THEME_TOKENS) as (keyof typeof THEME_TOKENS)[];

  it.each(names)("%s: dim text is at least 4.5:1 on every surface it sits on", (name) => {
    const t = THEME_TOKENS[name];
    const canvas = rgb(t.canvas);
    const surfaces: Record<string, Rgb> = {
      bg: rgb(t.bg),
      canvas,
      raised: rgb(t.raised),
      "expanded row": over(rgb(t.raised), 0.6, canvas),
      "alternate row": over(rgb(t.text), 0.025, canvas),
      "hovered chrome": over(rgb(t.hover), alphaOf(t.hover), rgb(t.bg)),
      "warn row": over(rgb(t.warn), 0.06, canvas),
      "error row": over(rgb(t.error), 0.08, canvas),
      "critical row": over(rgb(t.error), 0.16, canvas),
    };
    for (const [surface, colour] of Object.entries(surfaces)) {
      expect(contrast(rgb(t.dim), colour), `dim on ${surface}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it.each(names)("%s: log levels, accents and JSON colours are at least 4.5:1 on the canvas", (name) => {
    const t = THEME_TOKENS[name];
    const canvas = rgb(t.canvas);
    const expanded = over(rgb(t.raised), 0.6, canvas);
    const text = { warn: t.warn, error: t.error, ok: t.ok, led: t.led, caution: t.caution };
    for (const [role, colour] of Object.entries(text)) {
      expect(contrast(rgb(colour), canvas), `${role} on canvas`).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(rgb(t.error), over(rgb(t.error), 0.16, canvas)), "error on a critical row")
      .toBeGreaterThanOrEqual(4.5);
    const json = { key: t.jsonKey, number: t.jsonNumber, string: t.jsonString, literal: t.jsonLiteral };
    for (const [role, colour] of Object.entries(json)) {
      expect(contrast(rgb(colour), expanded), `JSON ${role}`).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("stylesheet", () => {
  it("has a rule for every named theme, and for system under a light preference", () => {
    for (const name of Object.keys(THEME_TOKENS)) {
      expect(DEBUGSY_CSS).toContain(`.dbg-root:where([data-dbg-theme="${name}"])`);
    }
    expect(DEBUGSY_CSS).toMatch(
      /@media \(prefers-color-scheme:light\)\{\s*\.dbg-root:where\(\[data-dbg-theme="system"\]\)/,
    );
  });

  it("declares every token it uses", () => {
    const used = new Set([...DEBUGSY_CSS.matchAll(/var\((--dbg-[\w-]+)/g)].map((m) => m[1]!));
    const declared = new Set([...DEBUGSY_CSS.matchAll(/(--dbg-[\w-]+):/g)].map((m) => m[1]!));
    // `--dbg-rows` is set inline by the grid's component, with a fallback
    used.delete("--dbg-rows");
    expect([...used].filter((token) => !declared.has(token))).toEqual([]);
  });

  it("fades no text: text colours are tokens at full strength", () => {
    expect(DEBUGSY_CSS).not.toMatch(/(?<![\w-])color:rgb\(var\(--dbg-[\w-]+\) \//);
    // Opacity is for icons and disabled controls only
    const faded = [...DEBUGSY_CSS.matchAll(/([^{}]+)\{[^}]*(?<![\w-])opacity:\.\d/g)]
      .map((m) => m[1]!.trim())
      .filter((selector) => !/^(\d+%|from|to)$/.test(selector)); // keyframes
    expect(faded).toEqual([
      ".dbg-word:disabled",
      ".dbg-root .json-view .jv-chevron",
      ".dbg-root .json-view .jv-chevron:hover,.dbg-root .json-view .jv-size:hover+.jv-chevron",
    ]);
    // react18-json-view's own stylesheet, if the app loads it, fades the size hint to .4
    expect(DEBUGSY_CSS).toMatch(/\.dbg-root \.json-view \.jv-size\{[^}]*opacity:1;/);
  });

  it("keeps literal shadows and colours in the themes fragment", () => {
    const { themes: _themes, ...rest } = DEBUGSY_CSS_FRAGMENTS;
    for (const [part, css] of Object.entries(rest)) {
      expect(css, part).not.toMatch(/rgb\(\d/);
      expect(css, part).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    }
  });
});

// ─── The prop ────────────────────────────────────────────────────────────────

describe("DebugsyLook's theme prop", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const panelRoot = () => container.querySelector<HTMLElement>(".dbg-root");

  it("is dark by default", () => {
    act(() => root.render(<DebugsyLook initialVisible />));
    expect(panelRoot()?.dataset.dbgTheme).toBe("dark");
  });

  it.each(["light", "system", "paper"] as const)("sets data-dbg-theme=%s on the panel's root", (theme) => {
    act(() => root.render(<DebugsyLook initialVisible initialIsCompact={false} theme={theme} />));
    expect(panelRoot()?.dataset.dbgTheme).toBe(theme);
    // The tray's module navigation is a nested root: it inherits, so it carries no theme
    const nested = container.querySelectorAll<HTMLElement>(".dbg-root .dbg-root");
    expect(nested.length).toBeGreaterThan(0);
    for (const el of nested) expect(el.dataset.dbgTheme).toBeUndefined();
  });
});
