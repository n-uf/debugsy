/**
 * Builtin Debug Modules
 *
 * Modules that ship with debugsy itself — always registered,
 * independent of any consuming application.
 *
 * - system: debugsy self-diagnostics, error tracking, health
 * - perf:   performance monitoring and React dependency tracking
 */

import type { DebugModuleDef } from "./types";
import { registerModule } from "./registry";

// =============================================================================
// System module
// =============================================================================

const SYSTEM_MODULE: DebugModuleDef = {
  label: "DeBugsy",
  emoji: "⚙️",
  description: "Debugsy internals and system diagnostics",
  points: {
    debugsy: {
      emoji: "🔧",
      label: "Self",
      description: "Debugsy self-diagnostics and internal logging",
    },
    errors: {
      emoji: "💥",
      label: "Errors",
      description: "Uncaught errors and unhandled rejections",
    },
    health: {
      emoji: "🏥",
      label: "Health",
      description: "System health snapshots and metrics",
    },
  },
};

// =============================================================================
// Performance module
// =============================================================================

const PERF_MODULE: DebugModuleDef = {
  label: "Perf",
  emoji: "⚡",
  description: "Performance monitoring and optimization",
  points: {
    performance: {
      emoji: "⚡",
      label: "Throughput",
      description: "Event throughput, timing, and efficiency",
    },
    dependencies: {
      emoji: "🧠",
      label: "Deps",
      description: "React hook dependency tracking and optimization",
      tags: {
        "dep-change": {
          icon: "🔄",
          description: "Dependencies changed in a component",
        },
        "fn-recreation": {
          icon: "📝",
          description: "Function reference changed",
        },
        "obj-recreation": {
          icon: "📦",
          description: "Object reference changed",
        },
        "prim-change": {
          icon: "🔧",
          description: "Primitive value changed",
        },
        "render-warn": {
          icon: "⚠️",
          description: "High render count detected",
        },
        "mount-warn": {
          icon: "🔄",
          description: "High mount/unmount cycle count detected",
        },
        "circuit-break": {
          icon: "🚨",
          description: "Circuit breaker activated",
        },
        "emergency-stop": {
          icon: "🛑",
          description: "Emergency stop activated",
        },
        "hook-exec": {
          icon: "🪝",
          description: "Hook execution tracking",
        },
      },
    },
  },
};

// =============================================================================
// Auto-register on import
// =============================================================================

registerModule("system", SYSTEM_MODULE, { builtin: true });
registerModule("perf", PERF_MODULE, { builtin: true });
