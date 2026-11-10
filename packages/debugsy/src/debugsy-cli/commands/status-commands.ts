/**
 * Status command implementations for the Debugsy CLI
 */

import { readSpace } from "../../debugsy-space/space-holder";

export const statusCommands = {
  status: (): void => {
    const debugsy = readSpace();
    if (!debugsy) {
      console.log("❌ Debugsy system not initialized");
      return;
    }

    console.log("🔍 Debugsy System Status:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    // Get current state from unified system
    const state = debugsy.getDebugState();
    const depState = debugsy?.getDepsSettings?.() || {};

    console.log("📊 Debug Points:", Array.from(state.enabled));
    console.log("🖥️  Console Logging:", state.console ? "✅ ON" : "❌ OFF");
    console.log("👁️  Visual Debugging:", state.visual ? "✅ ON" : "❌ OFF");
    console.log("⚡ Performance Mode:", state.performance ? "✅ ON" : "❌ OFF");

    console.log("\n🔧 Dependency Tracking:");
    console.log("  Enabled:", depState.enabled ? "✅ ON" : "❌ OFF");
    if (depState.enabled) {
      console.log("  Level:", depState.level || "normal");
      console.log("  Filter:", depState.filter || "none");
      console.log("  Throttle:", `${depState.throttleMs || 100}ms`);
    }

    console.log(`\n📝 Stored Logs: ${state.logs?.length || 0}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  },

  list: (): void => {
    const debugsy = readSpace();
    if (!debugsy) {
      console.log("❌ Debugsy system not initialized");
      return;
    }

    const state = debugsy.getDebugState();
    const enabledPoints = Array.from(state.enabled);

    console.log("📋 Debug Points Status:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (enabledPoints.length === 0) {
      console.log("❌ No debug points enabled");
      return;
    }

    enabledPoints.forEach((point) => {
      const visual = debugsy.showVisual(point as any) ? "👁️" : "🚫";
      console.log(`  ✅ ${point} ${visual}`);
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  },

  deps: (): void => {
    const debugsy = readSpace();
    if (!debugsy) {
      console.log("❌ Debugsy system not initialized");
      return;
    }

    const depState = debugsy?.getDepsSettings?.();

    if (!depState) {
      console.log("❌ Dependency tracking not available");
      return;
    }

    console.log("🔗 Dependency Tracking Status:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("Status:", depState.enabled ? "✅ ENABLED" : "❌ DISABLED");

    if (depState.enabled) {
      console.log("Level:", depState.level || "normal");
      console.log("Filter:", depState.filter || "none");
      console.log("Throttle:", `${depState.throttleMs || 100}ms`);

      if (depState.allowedHooks?.length) {
        console.log("Allowed hooks:", depState.allowedHooks.join(", "));
      }

      if (depState.excludedHooks?.length) {
        console.log("Excluded hooks:", depState.excludedHooks.join(", "));
      }
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  },

  logs: (count: number = 10): void => {
    const debugsy = readSpace();
    if (!debugsy) {
      console.log("❌ Debugsy system not initialized");
      return;
    }

    const logs = debugsy.getLogs();
    const recentLogs = logs.slice(-count);

    console.log(`📝 Recent Logs (${recentLogs.length}/${logs.length}):`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (recentLogs.length === 0) {
      console.log("📭 No logs found");
      return;
    }

    recentLogs.forEach((log) => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const level = log.level === "error" ? "❌" : "ℹ️";
      console.log(`[${timestamp}] ${level} [${log.point}] ${log.message}`);
      if (log.data) {
        console.log("   Data:", log.data);
      }
    });

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  },
};
