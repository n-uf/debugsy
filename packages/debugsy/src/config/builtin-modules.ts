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
  label: "System",
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
      logTypes: {
        "dependency-change": {
          icon: "🔄",
          description: "Dependencies changed in a component",
        },
        "function-recreation": {
          icon: "📝",
          description: "Function reference changed",
        },
        "object-recreation": {
          icon: "📦",
          description: "Object reference changed",
        },
        "primitive-change": {
          icon: "🔧",
          description: "Primitive value changed",
        },
        "render-warning": {
          icon: "⚠️",
          description: "High render count detected",
        },
        "mount-warning": {
          icon: "🔄",
          description: "High mount/unmount cycle count detected",
        },
        "circuit-breaker": {
          icon: "🚨",
          description: "Circuit breaker activated",
        },
        "emergency-stop": {
          icon: "🛑",
          description: "Emergency stop activated",
        },
        "hook-execution": {
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

registerModule("system", SYSTEM_MODULE);
registerModule("perf", PERF_MODULE);
