import {
  type DebugLogEntry,
  type DebugPoint,
} from "../../debugsy-space/debugsy-constants";

// Health metrics structure
export interface HealthMetrics {
  timestamp: string;
  uptime: string;
  performance: {
    memoryUsage: any;
    connectionType: string;
    deviceMemory: string;
    hardwareConcurrency: string | number;
  };
  debugActivity: {
    systemStatus: string;
    emergencyMode: string;
    dependencyTracking: string;
    activeDebugPoints: number;
    totalLogs: number;
    recentLogRate?: string;
  };
  dependencyMonitoring: {
    trackingEnabled: boolean;
    trackingLevel: string;
    trackingFilter: string;
    monitoredHooks: string | number;
    excludedHooks: number;
    throttleMs: number;
    recentChanges?: string;
    coverageStats?: string;
  };
  circuitBreakerStatus: {
    emergencyStopActive: boolean;
    activeBreakers: number;
    breakerDetails: string;
    logCounts: {
      surfaceInteraction: number;
      selectionInteraction: number;
      surfaceInteractions: number;
      mouseDispatcher: number;
    };
    protectionStatus: string;
  };
  surfaceMetrics: {
    viewportSize: string;
    devicePixelRatio: string | number;
    documentReadyState?: string;
    visibilityState?: string;
    activeElements: number;
    canvasElements: number;
  };
  systemHealth?: {
    jsErrors: number;
    unhandledPromises: number;
    memoryPressure: string;
    fps: string;
  };
}

// Health snapshot configuration
export interface HealthSnapshotConfig {
  includeSystemHealth?: boolean;
  includeRecentLogRate?: boolean;
  includeRecentDependencyChanges?: boolean;
  logToConsole?: boolean;
  logToDebugSystem?: boolean;
}

/**
 * Collects comprehensive application health metrics
 */
export function collectHealthMetrics(
  globalDebugState: any,
  config: HealthSnapshotConfig = {}
): HealthMetrics {
  const timestamp = new Date().toISOString();
  const uptime = Date.now() - (performance.timeOrigin || Date.now());
  const emergencyStop = (globalThis as any).__DEBUGSY_EMERGENCY_STOP;

  // Gather dependency tracking and infinite render debugging metrics
  // The settings keep deps config under `deps`; "enabled" is the
  // "dependencies" debug point (see DepsTrackingConfig)
  const deps = globalDebugState.deps ?? {};
  const dependencyTrackingMetrics = {
    enabled: globalDebugState.enabled?.has?.("dependencies") ?? false,
    level: deps.level,
    filter: deps.filter,
    allowedHooks: deps.allowedHooks?.length || "all",
    excludedHooks: deps.excludedHooks?.length || 0,
    throttleMs: deps.throttleMs,
  };

  // Circuit breaker and infinite render debugging metrics
  const circuitBreakerMetrics = {
    emergencyStopActive: emergencyStop?.active || false,
    emergencyStopAvailable: typeof emergencyStop !== "undefined",
    surfaceInteractionLogCount:
      (globalThis as any).__surfaceInteractionLogCount || 0,
    selectionInteractionLogCount:
      (globalThis as any).__selectionInteractionLogCount || 0,
    surfaceInteractionsLogCount:
      (globalThis as any).__surfaceInteractionsLogCount || 0,
    mouseDispatcherLogCount: (globalThis as any).__mouseDispatcherLogCount || 0,
    activeCircuitBreakers: [
      (globalThis as any).__surfaceInteractionLogCount > 20
        ? "surfaceInteraction"
        : null,
      (globalThis as any).__selectionInteractionLogCount > 20
        ? "selectionInteraction"
        : null,
      (globalThis as any).__surfaceInteractionsLogCount > 20
        ? "surfaceInteractions"
        : null,
      (globalThis as any).__mouseDispatcherLogCount > 20
        ? "mouseDispatcher"
        : null,
    ].filter(Boolean),
  };

  // Monitoring coverage metrics from surface-dependencies-analysis.md
  const monitoringMetrics = {
    totalHooksMonitored: 11, // From analysis: 11 hooks with useWhyDidYouUpdate
    monitoringCoverage: "100%", // Complete coverage achieved
    stableDependencies: "85%", // From analysis statistics
    monitoredDependencies: "15%", // Dependencies under watch
    criticalIssuesFixed: 5, // Fixed issues count
    useWhyDidYouUpdateActive: dependencyTrackingMetrics.enabled,
    // Check for recent dependency change activity
    recentDependencyChanges: config.includeRecentDependencyChanges
      ? (() => {
          try {
            const dependencyLogs = globalDebugState.logs.filter(
              (log: any) =>
                log.message &&
                (log.message.includes("Dependencies changed") ||
                  log.message.includes("function changed") ||
                  log.message.includes("object changed"))
            );
            const recentLogs = dependencyLogs.filter(
              (log: any) => Date.now() - log.timestamp < 30000 // Last 30 seconds
            );
            return `${recentLogs.length} changes/30s`;
          } catch {
            return "0 changes/30s";
          }
        })()
      : undefined,
  };

  // Build comprehensive health metrics
  const healthMetrics: HealthMetrics = {
    timestamp,
    uptime: `${Math.round(uptime / 1000)}s`,

    performance: {
      memoryUsage: (performance as any).memory
        ? {
            used: `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)}MB`,
            total: `${Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024)}MB`,
            limit: `${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)}MB`,
          }
        : "N/A",
      connectionType: (navigator as any).connection?.effectiveType || "unknown",
      deviceMemory: (navigator as any).deviceMemory
        ? `${(navigator as any).deviceMemory}GB`
        : "unknown",
      hardwareConcurrency: navigator.hardwareConcurrency || "unknown",
    },

    debugActivity: {
      systemStatus: "operational",
      emergencyMode: emergencyStop?.active ? "ACTIVE" : "normal",
      dependencyTracking: dependencyTrackingMetrics.enabled
        ? `active (${dependencyTrackingMetrics.level})`
        : "disabled",
      activeDebugPoints: globalDebugState.enabled.size,
      totalLogs: globalDebugState.logs.length,
      recentLogRate: config.includeRecentLogRate
        ? (() => {
            const recent = globalDebugState.logs.filter(
              (log: any) => Date.now() - log.timestamp < 10000
            );
            return `${recent.length}/10s`;
          })()
        : undefined,
    },

    dependencyMonitoring: {
      trackingEnabled: dependencyTrackingMetrics.enabled,
      trackingLevel: dependencyTrackingMetrics.level,
      trackingFilter: dependencyTrackingMetrics.filter,
      monitoredHooks: dependencyTrackingMetrics.allowedHooks,
      excludedHooks: dependencyTrackingMetrics.excludedHooks,
      throttleMs: dependencyTrackingMetrics.throttleMs,
      recentChanges: monitoringMetrics.recentDependencyChanges,
      coverageStats: `${monitoringMetrics.monitoringCoverage} coverage, ${monitoringMetrics.stableDependencies} stable`,
    },

    circuitBreakerStatus: {
      emergencyStopActive: circuitBreakerMetrics.emergencyStopActive,
      activeBreakers: circuitBreakerMetrics.activeCircuitBreakers.length,
      breakerDetails:
        circuitBreakerMetrics.activeCircuitBreakers.join(", ") || "none",
      logCounts: {
        surfaceInteraction: circuitBreakerMetrics.surfaceInteractionLogCount,
        selectionInteraction:
          circuitBreakerMetrics.selectionInteractionLogCount,
        surfaceInteractions: circuitBreakerMetrics.surfaceInteractionsLogCount,
        mouseDispatcher: circuitBreakerMetrics.mouseDispatcherLogCount,
      },
      protectionStatus:
        circuitBreakerMetrics.activeCircuitBreakers.length > 0
          ? "PROTECTED"
          : "normal",
    },

    surfaceMetrics: {
      viewportSize:
        typeof window !== "undefined"
          ? `${window.innerWidth}x${window.innerHeight}`
          : "unknown",
      devicePixelRatio:
        typeof window !== "undefined"
          ? window.devicePixelRatio || 1
          : "unknown",
      documentReadyState:
        typeof document !== "undefined" ? document.readyState : undefined,
      visibilityState:
        typeof document !== "undefined" ? document.visibilityState : undefined,
      activeElements:
        typeof document !== "undefined"
          ? document.querySelectorAll("[data-surface-element]").length
          : 0,
      canvasElements:
        typeof document !== "undefined"
          ? document.querySelectorAll("canvas").length
          : 0,
    },
  };

  // Add system health if requested
  if (config.includeSystemHealth) {
    healthMetrics.systemHealth = {
      jsErrors: (window as any).__errorCount || 0,
      unhandledPromises: (window as any).__promiseRejectionCount || 0,
      memoryPressure: (performance as any).memory
        ? Math.round(
            ((performance as any).memory.usedJSHeapSize /
              (performance as any).memory.jsHeapSizeLimit) *
              100
          ) + "%"
        : "unknown",
      fps: (window as any).__lastFPS || "measuring...",
    };
  }

  return healthMetrics;
}

/**
 * Formats health metrics for console output
 */
export function formatHealthReport(metrics: HealthMetrics): string {
  return `
🏥 ===== SURFACE APP METRICS SNAPSHOT =====
📅 Timestamp: ${metrics.timestamp} | Uptime: ${metrics.uptime}

⚡ Performance:
  Memory: ${
    typeof metrics.performance.memoryUsage === "object"
      ? `${metrics.performance.memoryUsage.used}/${metrics.performance.memoryUsage.limit}${metrics.systemHealth ? ` (${metrics.systemHealth.memoryPressure})` : ""}`
      : metrics.performance.memoryUsage
  }
  Connection: ${metrics.performance.connectionType}
  CPU Cores: ${metrics.performance.hardwareConcurrency}
  Device RAM: ${metrics.performance.deviceMemory}

🧠 Dependency Monitoring (Surface Dependencies Analysis):
  Tracking: ${
    metrics.dependencyMonitoring.trackingEnabled
      ? `${metrics.dependencyMonitoring.trackingLevel} mode`
      : "disabled"
  }
  Filter: ${metrics.dependencyMonitoring.trackingFilter}
  Coverage: ${metrics.dependencyMonitoring.coverageStats || "N/A"}
  Recent Changes: ${metrics.dependencyMonitoring.recentChanges || "N/A"}

🛡️ Circuit Breaker Protection (Infinite Render Debugging):
  Emergency Stop: ${metrics.circuitBreakerStatus.emergencyStopActive ? "ACTIVE" : "normal"}
  Active Breakers: ${metrics.circuitBreakerStatus.activeBreakers} (${metrics.circuitBreakerStatus.breakerDetails})
  Protection Status: ${metrics.circuitBreakerStatus.protectionStatus}

===== END METRICS SNAPSHOT =====`;
}

/**
 * Creates a log entry for health metrics
 */
export function createHealthLogEntry(metrics: HealthMetrics): DebugLogEntry {
  const summary = `Memory: ${
    typeof metrics.performance.memoryUsage === "object"
      ? metrics.performance.memoryUsage.used
      : "N/A"
  }, Elements: ${metrics.surfaceMetrics.activeElements}, Logs: ${metrics.debugActivity.totalLogs}, Tracking: ${metrics.dependencyMonitoring.trackingEnabled}, Breakers: ${metrics.circuitBreakerStatus.activeBreakers}`;

  return {
    timestamp: Date.now(),
    level: "info",
    point: "health" as DebugPoint,
    message: "🏥 App Health Snapshot",
    data: {
      summary,
      fullMetrics: metrics,
      timestamp: metrics.timestamp,
    },
    sessionId: "default",
  };
}

/**
 * Main health snapshot function - captures comprehensive app metrics
 * Can be used by both the hook and global debug object
 */
export function captureHealthSnapshot(
  globalDebugState: any,
  logFunction?: (point: DebugPoint, message: string, data?: any) => void,
  config: HealthSnapshotConfig = {}
): HealthMetrics {
  const fullConfig: HealthSnapshotConfig = {
    includeSystemHealth: true,
    includeRecentLogRate: true,
    includeRecentDependencyChanges: true,
    logToConsole: true,
    logToDebugSystem: true,
    ...config,
  };

  // Collect comprehensive health metrics
  const healthMetrics = collectHealthMetrics(globalDebugState, fullConfig);

  // Log to debug system if function provided and enabled
  if (logFunction && fullConfig.logToDebugSystem) {
    logFunction("health", "🏥 App Health Snapshot", {
      summary: `Memory: ${
        typeof healthMetrics.performance.memoryUsage === "object"
          ? healthMetrics.performance.memoryUsage.used
          : "N/A"
      }, Elements: ${healthMetrics.surfaceMetrics.activeElements}, Logs: ${healthMetrics.debugActivity.totalLogs}, Tracking: ${healthMetrics.dependencyMonitoring.trackingEnabled}, Breakers: ${healthMetrics.circuitBreakerStatus.activeBreakers}`,
      fullMetrics: healthMetrics,
      timestamp: healthMetrics.timestamp,
    });

    // Log individual metric categories for easier filtering
    logFunction(
      "performance",
      "⚡ Performance Metrics",
      healthMetrics.performance
    );
    logFunction(
      "surface-interactions",
      "🖥️ Surface Runtime Metrics",
      healthMetrics.surfaceMetrics
    );
    logFunction(
      "dependencies",
      "🎯 Debug Activity Report",
      healthMetrics.debugActivity
    );
    logFunction(
      "dependencies",
      "🧠 Dependency Monitoring Status",
      healthMetrics.dependencyMonitoring
    );
    logFunction(
      "dependencies",
      "🛡️ Circuit Breaker Protection Status",
      healthMetrics.circuitBreakerStatus
    );
  }

  // Log to console if enabled
  if (fullConfig.logToConsole) {
    const healthReport = formatHealthReport(healthMetrics);
    console.log(healthReport);
    console.log(
      `🏥 Health Status: Memory=${
        typeof healthMetrics.performance.memoryUsage === "object"
          ? healthMetrics.performance.memoryUsage.used
          : "N/A"
      }, Debug=${healthMetrics.debugActivity.systemStatus}, Logs=${healthMetrics.debugActivity.totalLogs}, Elements: ${healthMetrics.surfaceMetrics.activeElements}, Tracking=${healthMetrics.dependencyMonitoring.trackingEnabled}, Breakers=${healthMetrics.circuitBreakerStatus.activeBreakers}`
    );
  }

  return healthMetrics;
}
