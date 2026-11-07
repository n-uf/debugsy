/**
 * The home page demo's debug points: the Auth module from the page's own example, so what the
 * panel shows matches the code the page shows. The Perf and DeBugsy modules are registered by
 * `@n-uf/debugsy` itself on first import.
 */

import type { DebugModuleDef } from "@n-uf/debugsy";
import { registerModule } from "@n-uf/debugsy";

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
