/**
 * register-real-modules — side-effect import that mirrors what
 * `pdfized.com` does on boot:
 *
 *   import "@workspace/surface/devtools";
 *   import "@workspace/pdf-surface/src/debug/register";
 *
 * We can't depend on those packages directly (they bring konva, pdfjs,
 * yjs, supabase, etc.), so we inline byte-for-byte copies of their
 * `DebugModuleDef` objects. The `system` and `perf` modules are already
 * auto-registered by `@workspace/debugsy` on first import.
 *
 * Source of truth (kept in lock-step with the real package):
 *   packages/surface/src/debug/debug-module.ts
 *   packages/pdf-surface/src/debug/debug-module.ts
 */

import type { DebugModuleDef } from "@workspace/debugsy";
import { registerModule } from "@workspace/debugsy";

const SURFACE_DEBUG_MODULE: DebugModuleDef = {
  label: "Surface",
  emoji: "🌍",
  description: "Surface framework internals",
  points: {
    "visual-debug": {
      emoji: "👁️",
      label: "Visual",
      description: "Visual debug overlays and priority zones",
    },
    mouse: {
      emoji: "🎯",
      label: "Mouse",
      description: "Mouse event handling and coordination",
    },
    "hit-testing": {
      emoji: "🔍",
      label: "Hit Test",
      description: "Priority-based hit test routing and decisions",
    },
    routing: {
      emoji: "🔗",
      label: "Routing",
      description: "Event routing decisions with conflict resolution",
    },
    surface: {
      emoji: "🌍",
      label: "Surface",
      description: "Surface component lifecycle",
    },
    "surface-interactions": {
      emoji: "🏠",
      label: "Surface.io",
      description: "Surface component coordination",
    },
    "surface-dock": {
      emoji: "🚢",
      label: "Dock",
      description: "SurfaceDock component lifecycle",
    },
    "surface-interaction": {
      emoji: "🌍",
      label: "Viewport",
      description: "Viewport pan/zoom interactions",
    },
    "frame-interaction": {
      emoji: "📦",
      label: "Frame",
      description: "Frame drag/resize interactions",
    },
    "frame-coordination": {
      emoji: "🎯",
      label: "Frame Co.",
      description: "Frame selection coordination and callback flow",
    },
    "frame-metrics": {
      emoji: "📏",
      label: "Metrics",
      description: "Frame positioning and sizing state",
    },
    swarm: {
      emoji: "🐝",
      label: "Swarm",
      description: "Swarm cluster management and multi-selection",
    },
    "swarm-manager": {
      emoji: "🎪",
      label: "Swarm Mgr",
      description: "SwarmManager lifecycle and registry",
    },
    transform: {
      emoji: "🔄",
      label: "Transform",
      description: "Transform operations and geometry",
    },
  },
};

const PDF_SURFACE_DEBUG_MODULE: DebugModuleDef = {
  label: "PDF Surf",
  emoji: "📄",
  description: "PDF Surface application layer",
  points: {
    realtime: {
      emoji: "📡",
      label: "Realtime",
      description: "Realtime broadcasts, connection lifecycle, and room events",
      tags: {
        conn: {
          icon: "🔌",
          description:
            "Connection lifecycle (connect / disconnect / synced / auth)",
        },
        room: {
          icon: "🚪",
          description: "Room acquire / release",
        },
        broadcast: {
          icon: "📨",
          description: "Broadcast event received (channel/action)",
        },
      },
    },
    "pdf-surface": {
      emoji: "📎",
      label: "Core",
      description: "PDF Surface main component lifecycle and state",
    },
    explorer: {
      emoji: "🗂️",
      label: "Explorer",
      description: "Document explorer panel and navigation",
    },
    dossier: {
      emoji: "📋",
      label: "Dossier",
      description: "Document dossier view and interactions",
    },
  },
};

registerModule("surface", SURFACE_DEBUG_MODULE);
registerModule("pdf-surf", PDF_SURFACE_DEBUG_MODULE);
