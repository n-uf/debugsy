/**
 * The home page demo's debug points and sample log: the Auth module from the page's own example, so
 * what the panel shows matches the code the page shows. The Perf and DeBugsy modules are registered
 * by `@n-uf/debugsy` itself on first import.
 *
 * The sample is logged here, when the browser loads this module, before any panel mounts: a panel
 * reads the logs already stored when it mounts, but logs written between its mount and its
 * subscription were missed (the panel came up empty after a reload).
 */

import type { DebugModuleDef } from "@n-uf/debugsy";
import { exposeConsole, getDebugsy, registerModule } from "@n-uf/debugsy";

const AUTH_MODULE: DebugModuleDef = {
  label: "Auth",
  emoji: "🔐",
  description: "session · refresh",
  points: {
    session: { emoji: "🔑", label: "Session", description: "token state" },
    refresh: { emoji: "↻", label: "Refresh", description: "token renewal" },
  },
};

registerModule("auth", AUTH_MODULE);

interface SeedLog {
  readonly point: string;
  readonly message: string;
  readonly level: "info" | "warn" | "error" | "critical";
  readonly data?: Record<string, unknown>;
}

/**
 * The sample log, following the page's own example: the Auth module's session and refresh points,
 * logged with the calls the page shows (debug.log, dsy.warn, getDebugsy().error, window.debugsy.critical).
 */
const SEED_LOGS: readonly SeedLog[] = [
  { point: "session", message: "synced", level: "info", data: { userId: 42 } },
  { point: "refresh", message: "renewed", level: "info", data: { expiresIn: 3600 } },
  { point: "session", message: "expired", level: "warn", data: { ttl: 0 } },
  { point: "refresh", message: "5xx", level: "error", data: { status: 503 } },
  { point: "refresh", message: "failed", level: "critical" },
];

/** How many lines the sample logs: what the panel holds when the page loads (the server's view too). */
export const SAMPLE_LOG_COUNT = SEED_LOGS.length;

/** Turns on the demo's points and logs the sample, once per page load, in the browser only. */
function seedSample(): void {
  const debug = getDebugsy();
  debug.enable("session");
  debug.enable("refresh");
  debug.enable("dependencies");
  // The sample's error lines would otherwise be mirrored to the browser console as errors.
  const mirrored = debug.isConsoleEnabled();
  debug.setConsoleEnabled(false);
  try {
    for (const e of SEED_LOGS) debug.log(e.point, e.message, e.data, e.level, ["auth"]);
  } finally {
    debug.setConsoleEnabled(mirrored);
  }
}

if (typeof window !== "undefined") {
  // The site is the demo: its pages show `window.debugsy…` in the console, which production builds leave off
  exposeConsole(true);
  seedSample();
}
