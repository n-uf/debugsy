"use client";

/**
 * Configuration of the display alert's detail banner (concept C): where it
 * docks, the widths at which its layout changes, and its fixed labels
 * (translatable). Set it per Display (`alertBanner` prop) or once for a
 * subtree with `DisplayAlertBannerProvider`; the prop wins over the provider,
 * the provider over the defaults.
 */

import React, { createContext, useContext, useMemo } from "react";

/** Banner layout, picked from the banner's measured width. */
export type AlertBannerLayout = "wide" | "medium" | "narrow";

export interface DisplayAlertBannerLabels {
  /** Heading of the numbered steps. */
  howToFix: string;
  /** Lead-in of the support row. */
  stillStuck: string;
  /** Copy button. */
  copyErrorId: string;
  /** Copy button after a successful copy. */
  copied: string;
  /** Default label of the support link (when `support.label` is not set). */
  emailSupport: string;
  /** Accessible name of the close (x) button. */
  close: string;
}

export const DEFAULT_DISPLAY_ALERT_BANNER_LABELS: DisplayAlertBannerLabels = {
  howToFix: "How to fix",
  stillStuck: "Still stuck?",
  copyErrorId: "Copy error ID",
  copied: "Copied",
  emailSupport: "Email support",
  close: "Close details",
};

/** Default layout breakpoints (banner width in px). */
export const DISPLAY_ALERT_BANNER_BREAKPOINTS = { wide: 960, narrow: 620 } as const;

export interface DisplayAlertBannerConfig {
  /**
   * `tray` (default): dock full-width on top of the enclosing harbuz Tray
   * (falls back to floating when there is none). `display`: always float
   * above the display.
   */
  dock?: "tray" | "display";
  /** Width thresholds: >= `wide` is one row; < `narrow` stacks. */
  breakpoints?: { wide?: number; narrow?: number };
  /** Label overrides (e.g. translations). */
  labels?: Partial<DisplayAlertBannerLabels>;
}

export interface ResolvedDisplayAlertBannerConfig {
  dock: "tray" | "display";
  breakpoints: { wide: number; narrow: number };
  labels: DisplayAlertBannerLabels;
}

/** Merge configs left to right (later wins) over the defaults. */
export function resolveDisplayAlertBannerConfig(
  ...configs: Array<DisplayAlertBannerConfig | null | undefined>
): ResolvedDisplayAlertBannerConfig {
  const resolved: ResolvedDisplayAlertBannerConfig = {
    dock: "tray",
    breakpoints: { ...DISPLAY_ALERT_BANNER_BREAKPOINTS },
    labels: { ...DEFAULT_DISPLAY_ALERT_BANNER_LABELS },
  };
  for (const config of configs) {
    if (!config) continue;
    if (config.dock) resolved.dock = config.dock;
    // Explicit `undefined` entries keep the value below them
    if (config.breakpoints) Object.assign(resolved.breakpoints, defined(config.breakpoints));
    if (config.labels) Object.assign(resolved.labels, defined(config.labels));
  }
  return resolved;
}

function defined<T extends object>(values: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

/** Layout for a banner of `width` px. */
export function alertBannerLayout(
  width: number,
  breakpoints: { wide: number; narrow: number } = DISPLAY_ALERT_BANNER_BREAKPOINTS,
): AlertBannerLayout {
  if (width >= breakpoints.wide) return "wide";
  if (width < breakpoints.narrow) return "narrow";
  return "medium";
}

const BannerConfigContext = createContext<DisplayAlertBannerConfig | null>(null);

/** App- or subtree-wide banner configuration. */
export const DisplayAlertBannerProvider: React.FC<{
  config: DisplayAlertBannerConfig;
  children: React.ReactNode;
}> = ({ config, children }) => (
  <BannerConfigContext.Provider value={config}>{children}</BannerConfigContext.Provider>
);

/** Resolved config: defaults < provider < `override` (the Display prop). */
export function useDisplayAlertBannerConfig(
  override?: DisplayAlertBannerConfig,
): ResolvedDisplayAlertBannerConfig {
  const provided = useContext(BannerConfigContext);
  return useMemo(
    () => resolveDisplayAlertBannerConfig(provided, override),
    [provided, override],
  );
}
