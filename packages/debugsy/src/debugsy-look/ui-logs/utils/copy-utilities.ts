import type { DebugLogEntry } from "../../../debugsy-shared/debug-constants";
import {
  createObjectDiff,
  getDiffSummary,
  processObjectForDisplay,
  type DepthSetting,
  type DiffEntry,
} from "../../../debugsy-shared/object-depth-utils";
import { DEFAULT_COPY_CONFIG } from "../config/copy-config";
import { formatTime } from "../formatters";
import { extractComponentName, getLogTypeMetadata } from "../formatters/deps";
import { safeSuperjsonStringify } from "./json/json-core";

/**
 * Simple object display for copying (without emojis)
 */
const getSimpleObjectDisplay = (value: any): string => {
  if (value === null) return "null";
  if (value === undefined) return "undefined";

  if (typeof value === "object") {
    try {
      if (Array.isArray(value)) {
        return `Array(${value.length})`;
      }

      const constructorName = value.constructor?.name;
      if (constructorName && constructorName !== "Object") {
        return `${constructorName}{}`;
      }

      const keys = Object.keys(value);
      if (keys.length === 0) {
        return "{}";
      } else if (keys.length <= 3) {
        return `{${keys.join(", ")}}`;
      } else {
        return `{${keys.slice(0, 3).join(", ")}, +${keys.length - 3}}`;
      }
    } catch (error) {
      return "[Object]";
    }
  }

  return String(value);
};

/**
 * Format dependency change data for copying
 */
const formatDependencyDataForCopy = (data: any, logType: string) => {
  if (!data || logType !== "dependency-change" || typeof data !== "object") {
    return [];
  }

  return Object.entries(data)
    .map(([key, change]: [string, any]) => {
      if (
        change &&
        typeof change === "object" &&
        "from" in change &&
        "to" in change
      ) {
        return {
          property: key,
          from: change.from,
          to: change.to,
          type:
            typeof change.from === "function"
              ? "function"
              : typeof change.from === "object"
                ? "object"
                : "primitive",
        };
      }
      return null;
    })
    .filter(Boolean);
};

/**
 * Format diff information for copying
 */
const formatDiffForCopy = (from: any, to: any, property: string): string => {
  try {
    const diffs = createObjectDiff(from, to);
    if (diffs.length === 0) {
      const fromDisplay = getSimpleObjectDisplay(from);
      const toDisplay = getSimpleObjectDisplay(to);
      return `  ${property}: ${fromDisplay} → ${toDisplay}`;
    }

    const summary = getDiffSummary(diffs);
    let diffText = `  ${property}: ${summary}\n`;

    // Add detailed diff entries
    diffs.slice(0, 5).forEach((diffEntry: DiffEntry) => {
      const symbol =
        diffEntry.type === "added"
          ? "+"
          : diffEntry.type === "removed"
            ? "-"
            : "~";
      if (diffEntry.type === "removed") {
        const fromEnhanced = getSimpleObjectDisplay(diffEntry.from);
        diffText += `    ${symbol} ${diffEntry.key}: ${fromEnhanced}\n`;
      } else if (diffEntry.type === "added") {
        const toEnhanced = getSimpleObjectDisplay(diffEntry.to);
        diffText += `    ${symbol} ${diffEntry.key}: ${toEnhanced}\n`;
      } else {
        const fromEnhanced = getSimpleObjectDisplay(diffEntry.from);
        const toEnhanced = getSimpleObjectDisplay(diffEntry.to);
        diffText += `    ${symbol} ${diffEntry.key}: ${fromEnhanced} → ${toEnhanced}\n`;
      }
    });

    if (diffs.length > 5) {
      diffText += `    ... +${diffs.length - 5} more changes\n`;
    }

    return diffText.trim();
  } catch (error) {
    // Fallback to simple display
    const fromDisplay = getSimpleObjectDisplay(from);
    const toDisplay = getSimpleObjectDisplay(to);
    return `  ${property}: ${fromDisplay} → ${toDisplay}`;
  }
};

/**
 * Copy state - number representing current step (0 = idle, 1+ = steps completed)
 */
export type CopyState = number;

/**
 * Copy step value - can be a number, percentage string, or "All"
 */
export type CopyStepValue = number | string;

/**
 * Icon set for copy progression
 */
export interface CopyIconSet {
  idle: string;
  progress: string[]; // Icons for each step
  complete: string;
  error?: string;
}

/**
 * Color palette for copy progression
 */
export interface CopyColorPalette {
  idle: string;
  progress: string[]; // Colors for each step
  complete: string;
  error?: string;
}

/**
 * Copy theme combining icons and colors
 */
export interface CopyTheme {
  name: string;
  description: string;
  iconSet: CopyIconSet;
  colorPalette: CopyColorPalette;
}

/**
 * Enhanced configuration for copy operations with full adaptivity
 */
export interface CopyProgressionConfig {
  steps: CopyStepValue[];
  icons?: CopyIconSet;
  colors?: CopyColorPalette;
  theme?: CopyTheme;
  resetOnComplete?: boolean; // Whether clicking when progression is complete cycles back to beginning
  autoResetAfterDelay?: boolean; // Whether button auto-resets to idle after display duration
  animationDuration?: number;

  // Legacy support - will be converted to new flags
  resetAfterComplete?: boolean;
}

/**
 * Legacy interface for backward compatibility
 */
export interface CopyConfig {
  steps: CopyStepValue[];
}

/**
 * Predefined themes for different use cases
 */
export const COPY_THEMES: Record<string, CopyTheme> = {
  default: {
    name: "Default",
    description: "Standard progression with document icons",
    iconSet: {
      idle: "📋",
      progress: ["📑", "📄", "📊", "📈"],
      complete: "✅",
    },
    colorPalette: {
      idle: "#6b7280",
      progress: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
      complete: "#059669",
    },
  },

  minimal: {
    name: "Minimal",
    description: "Clean circles and dots",
    iconSet: {
      idle: "⚪",
      progress: ["🔵", "🟢", "🟡", "🟠"],
      complete: "✅",
    },
    colorPalette: {
      idle: "#9ca3af",
      progress: ["#3b82f6", "#10b981", "#f59e0b", "#ef4444"],
      complete: "#059669",
    },
  },

  professional: {
    name: "Professional",
    description: "Business-oriented icons and subdued colors",
    iconSet: {
      idle: "📄",
      progress: ["📋", "📊", "📈", "📉"],
      complete: "✅",
    },
    colorPalette: {
      idle: "#374151",
      progress: ["#1f2937", "#065f46", "#1e40af", "#7c2d12"],
      complete: "#059669",
    },
  },

  playful: {
    name: "Playful",
    description: "Fun emojis with bright colors",
    iconSet: {
      idle: "🎯",
      progress: ["🚀", "⭐", "🎉", "🏆"],
      complete: "🎊",
    },
    colorPalette: {
      idle: "#ec4899",
      progress: ["#8b5cf6", "#06b6d4", "#84cc16", "#f97316"],
      complete: "#10b981",
    },
  },
};

/**
 * Generate scalable icon set that adapts to any step count
 */
const generateScalableIconSet = (stepCount: number): CopyIconSet => {
  const iconPools = {
    documents: ["📑", "📄", "📊", "📈", "📉", "🗂️", "📚", "📝"],
    progress: ["🔵", "🟢", "🟡", "🟠", "🔴", "🟣", "🟤", "⚫"],
    objects: ["📦", "📋", "🗃️", "📁", "📄", "📇", "📰", "📓"],
  };

  let progressIcons: string[] = [];

  if (stepCount <= 4) {
    progressIcons = iconPools.documents.slice(0, stepCount);
  } else if (stepCount <= 8) {
    progressIcons = [
      ...iconPools.documents.slice(0, 4),
      ...iconPools.objects.slice(0, stepCount - 4),
    ];
  } else {
    // For very large step counts, use algorithmic generation
    progressIcons = Array(stepCount)
      .fill(0)
      .map((_, i) => {
        const pools = [
          iconPools.documents,
          iconPools.objects,
          iconPools.progress,
        ];
        const poolIndex = i % pools.length;
        const pool = pools[poolIndex]!; // Safe because pools is non-empty
        const iconIndex = Math.floor(i / pools.length) % pool.length;
        return pool[iconIndex]!; // Safe because pool is non-empty
      });
  }

  return {
    idle: "📋",
    progress: progressIcons,
    complete: "✅",
  };
};

/**
 * Generate adaptive color palette using HSL progression
 */
const generateScalableColorPalette = (stepCount: number): CopyColorPalette => {
  const progressColors: string[] = [];

  // Generate HSL-based color progression
  for (let i = 0; i < stepCount; i++) {
    const hue = (i * 300) / Math.max(stepCount - 1, 1); // 0° to 300° spread
    const saturation = 70 + (i * 20) / stepCount; // 70% to 90%
    const lightness = 50 + (i * 10) / stepCount; // 50% to 60%
    progressColors.push(
      `hsl(${Math.round(hue)}, ${Math.round(saturation)}%, ${Math.round(lightness)}%)`
    );
  }

  return {
    idle: "#6b7280", // Gray
    progress: progressColors,
    complete: "#10b981", // Green
  };
};

/**
 * Create adaptive configuration with intelligent defaults
 */
export const createAdaptiveConfig = (
  steps: CopyStepValue[],
  options?: Partial<CopyProgressionConfig>
): CopyProgressionConfig => {
  const stepCount = steps.length;

  // Auto-select appropriate theme based on step count
  let defaultTheme: CopyTheme;
  if (stepCount <= 3) {
    defaultTheme = COPY_THEMES.minimal!;
  } else if (stepCount <= 5) {
    defaultTheme = COPY_THEMES.default!;
  } else {
    defaultTheme = COPY_THEMES.professional!;
  }

  // Handle legacy resetAfterComplete flag
  let resetOnComplete = options?.resetOnComplete;
  let autoResetAfterDelay = options?.autoResetAfterDelay;

  if (options?.resetAfterComplete !== undefined) {
    // Legacy mode: resetAfterComplete controls both behaviors
    resetOnComplete = options.resetAfterComplete;
    autoResetAfterDelay = options.resetAfterComplete; // Keep as boolean
  }

  return {
    steps,
    icons: options?.icons || generateScalableIconSet(stepCount),
    colors: options?.colors || generateScalableColorPalette(stepCount),
    theme: options?.theme || defaultTheme,
    resetOnComplete: resetOnComplete ?? false, // Default: don't cycle back when complete
    autoResetAfterDelay: autoResetAfterDelay ?? true, // Default: auto-reset after display duration
    animationDuration: options?.animationDuration ?? 300,
    // Keep legacy for backward compatibility
    resetAfterComplete: options?.resetAfterComplete,
    ...options,
  };
};

// DEFAULT_COPY_CONFIG moved to ../config/copy-config.ts for better organization

/**
 * Calculate actual log count for a step value (legacy - use calculateAdaptiveStepCount for progression)
 */
export const calculateStepCount = (
  stepValue: CopyStepValue,
  totalLogs: number
): number => {
  if (stepValue === "All") {
    return totalLogs;
  }
  if (typeof stepValue === "string" && stepValue.endsWith("%")) {
    const percentage = parseInt(stepValue.slice(0, -1));
    return Math.ceil((totalLogs * percentage) / 100);
  }
  if (typeof stepValue === "number") {
    return Math.min(stepValue, totalLogs);
  }
  return totalLogs;
};

/**
 * Calculate adaptive step count that respects progression boundaries
 * Ensures each step copies more than the previous step and handles maximum reached
 *
 * PROBLEMS SOLVED:
 * 1. BACKWARDS PROGRESSION: Percentage steps could copy fewer logs than previous step
 *    - 116 logs: 20, 116, 58 (50%), all  ← 58 < 20 (going backwards!)
 *    - 284 logs: 20, 200, 142 (50%), all ← 142 < 200 (going backwards!)
 *
 * 2. MAXIMUM REACHED IN MIDDLE: Step copies all logs but progression continues
 *    - 150 logs: 20, 200 (copies all 150), 75 (50%), all ← unnecessary steps after max!
 *
 * SOLUTIONS:
 * 1. Returns -1 for steps that would copy fewer logs than any previous step
 * 2. Returns special value for steps that reach maximum (copy all available logs)
 * 3. Results in optimal progression that stops when maximum is reached:
 *    - 116 logs: 20 → 116 (all) [50% skipped]
 *    - 150 logs: 20 → 150 (max reached) [remaining steps finish progression]
 *    - 284 logs: 20 → 200 → 284 (all) [50% skipped]
 */
export const calculateAdaptiveStepCount = (
  stepValue: CopyStepValue,
  totalLogs: number,
  previousStepCounts: number[] = []
): number => {
  const previousMax =
    previousStepCounts.length > 0 ? Math.max(...previousStepCounts) : 0;

  if (stepValue === "All") {
    return totalLogs;
  }

  let calculatedCount: number;

  if (typeof stepValue === "string" && stepValue.endsWith("%")) {
    const percentage = parseInt(stepValue.slice(0, -1));
    calculatedCount = Math.ceil((totalLogs * percentage) / 100);

    // If percentage results in fewer logs than previous step, skip this step
    if (calculatedCount <= previousMax) {
      return -1; // Signal that this step should be skipped
    }
  } else if (typeof stepValue === "number") {
    calculatedCount = Math.min(stepValue, totalLogs);

    // If fixed number is less than or equal to previous step, skip this step
    if (calculatedCount <= previousMax) {
      return -1; // Signal that this step should be skipped
    }
  } else {
    calculatedCount = totalLogs;
  }

  // NEW: If this step would copy all available logs, signal maximum reached
  // This allows progression to finish immediately instead of continuing
  if (calculatedCount >= totalLogs) {
    return totalLogs; // This step reaches maximum - progression should finish
  }

  return calculatedCount;
};

/**
 * Format step description for tooltips and messages
 * Handles skipped steps appropriately
 */
const formatStepDescription = (
  stepValue: CopyStepValue,
  count: number
): string => {
  if (count <= 0) {
    return "step skipped (would go backwards)";
  }
  if (stepValue === "All") {
    return "all logs";
  }
  if (typeof stepValue === "string" && stepValue.endsWith("%")) {
    return `${count} logs (${stepValue})`;
  }
  return `${count} newest logs`;
};

/**
 * Formats a log entry for copying - provides detailed multiline format for health logs
 * UNIFIED: Uses safeSuperjsonStringify to handle all problematic objects consistently
 */
export const formatLogForCopy = (
  log: DebugLogEntry,
  depthSetting: DepthSetting = "all"
): string => {
  const time = formatTime(log.timestamp);

  // Special formatting for health logs
  if (log.point === "health" && log.data?.fullMetrics) {
    const metrics = log.data.fullMetrics;
    return `[${time}] 🏥 HEALTH SNAPSHOT:
📊 Summary: ${log.data.summary || "Health snapshot"}
⏱️ Uptime: ${metrics.uptime} | Timestamp: ${metrics.timestamp}

⚡ Performance:
  Memory: ${metrics.performance?.memoryUsage?.used || "N/A"}/${metrics.performance?.memoryUsage?.limit || "N/A"}
  Connection: ${metrics.performance?.connectionType || "unknown"}
  CPU Cores: ${metrics.performance?.hardwareConcurrency || "unknown"}
  Device RAM: ${metrics.performance?.deviceMemory || "unknown"}

🎯 Debug Activity:
  Enabled Points: ${metrics.debugActivity?.enabledPoints || "0"}
  Total Logs: ${metrics.debugActivity?.totalLogs || "0"}
  Memory Usage: ${metrics.debugActivity?.memoryUsage || "N/A"}

📋 Component Health:
  Surface Components: ${metrics.componentMetrics?.surfaceComponents || "0"}
  Frame Elements: ${metrics.componentMetrics?.frameElements || "0"}
  Selection State: ${metrics.componentMetrics?.selectionActive ? "Active" : "Inactive"}

🧠 Memory Details:
  Used: ${metrics.performance?.memoryUsage?.used || "N/A"}
  Total: ${metrics.performance?.memoryUsage?.total || "N/A"}
  Percentage: ${metrics.performance?.memoryUsage?.percentage || "N/A"}%

---
Full Metrics (Safe JSON):
${safeSuperjsonStringify(processObjectForDisplay(metrics, depthSetting))}`;
  }

  // Special formatting for dependency logs with diff information
  if (log.point === "dependencies") {
    const componentName = extractComponentName(log.message);
    const logTypeMeta = getLogTypeMetadata(log);
    const logType = logTypeMeta.type;

    if (logType === "dependency-change" && log.data) {
      const dependencyChanges = formatDependencyDataForCopy(log.data, logType);

      if (dependencyChanges.length > 0) {
        let output = `[${time}] DEPENDENCY CHANGE - ${componentName}:\n`;

        dependencyChanges.forEach((change: any) => {
          const diffInfo = formatDiffForCopy(
            change.from,
            change.to,
            change.property
          );
          output += `${diffInfo}\n`;
        });

        return output.trim();
      }
    }

    // Fallback for other dependency log types
    const data = log.data
      ? ` | ${safeSuperjsonStringify(processObjectForDisplay(log.data, depthSetting))}`
      : "";
    return `[${time}] DEPENDENCY - ${componentName}: ${log.message}${data}`;
  }

  // For regular logs, use safe superjson to handle any complex objects
  const data = log.data
    ? ` | ${safeSuperjsonStringify(processObjectForDisplay(log.data, depthSetting))}`
    : "";
  return `[${time}] ${log.point}: ${log.message}${data}`;
};

/**
 * Calculate progression history to ensure monotonic increasing steps
 */
const calculateProgressionHistory = (
  steps: CopyStepValue[],
  totalLogs: number,
  upToIndex: number
): number[] => {
  const history: number[] = [];

  for (let i = 0; i < upToIndex && i < steps.length; i++) {
    const stepValue = steps[i];
    if (!stepValue) continue; // Skip undefined steps
    const count = calculateAdaptiveStepCount(stepValue, totalLogs, history);

    if (count > 0) {
      // Only add valid (non-skipped) steps
      history.push(count);
    }
  }

  return history;
};

/**
 * Determines which logs to copy based on copy state and configuration (fully adaptive)
 */
export const getLogsToCopy = (
  logs: DebugLogEntry[],
  copyState: CopyState,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): { logs: DebugLogEntry[]; newState: CopyState; message: string } => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);
  const currentStepIndex = copyState; // 0 = idle, 1+ = steps completed

  // If we've completed all steps, start over (if resetOnComplete enabled) or stay at final
  if (currentStepIndex >= adaptiveConfig.steps.length) {
    if (adaptiveConfig.resetOnComplete) {
      const firstStep = adaptiveConfig.steps[0];
      if (!firstStep)
        return { logs: [], newState: 0, message: "No steps configured" };
      const count = calculateAdaptiveStepCount(firstStep, logs.length, []);
      if (count <= 0) {
        return { logs: [], newState: 0, message: "No valid steps" };
      }
      return {
        logs: [...logs].slice(-count),
        newState: 1,
        message: `Copied ${count} newest logs`,
      };
    } else {
      return { logs: [], newState: currentStepIndex, message: "Copy complete" };
    }
  }

  // Calculate progression history up to current step
  const progressionHistory = calculateProgressionHistory(
    adaptiveConfig.steps,
    logs.length,
    currentStepIndex
  );

  // Find the next valid step (skip steps that would go backwards)
  let nextStepIndex = currentStepIndex;
  let stepValue: CopyStepValue | undefined;
  let count = -1;

  while (nextStepIndex < adaptiveConfig.steps.length && count <= 0) {
    stepValue = adaptiveConfig.steps[nextStepIndex];
    if (!stepValue) break;

    count = calculateAdaptiveStepCount(
      stepValue as CopyStepValue, // Safe assertion after null check
      logs.length,
      progressionHistory
    );

    if (count <= 0) {
      // This step would go backwards, skip it
      nextStepIndex++;
    }
  }

  // If no valid step found, go to "All"
  if (count <= 0 || !stepValue) {
    return {
      logs: [...logs],
      newState: adaptiveConfig.steps.length,
      message: `Copied all ${logs.length} logs`,
    };
  }

  // NEW: If this step copies all available logs, finish progression immediately
  // instead of continuing to subsequent steps that would be redundant
  const isMaximumReached = count >= logs.length;
  const finalState = isMaximumReached
    ? adaptiveConfig.steps.length
    : nextStepIndex + 1;

  return {
    logs: [...logs].slice(-count),
    newState: finalState,
    message:
      stepValue === "All" || isMaximumReached
        ? `Copied all ${logs.length} logs`
        : `Copied ${count} newest logs`,
  };
};

/**
 * Performs the actual copy operation to clipboard
 */
export const copyLogsToClipboard = async (
  logs: DebugLogEntry[],
  depthSetting: DepthSetting = "all"
): Promise<void> => {
  const copyText = logs
    .map((log) => formatLogForCopy(log, depthSetting))
    .join("\n");
  await navigator.clipboard.writeText(copyText);
};

/**
 * Get copy button icon based on state (fully adaptive)
 */
export const getCopyIcon = (
  state: CopyState,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);
  const iconSet =
    adaptiveConfig.icons ||
    generateScalableIconSet(adaptiveConfig.steps.length);

  if (state === 0) return iconSet.idle;

  if (state >= adaptiveConfig.steps.length) return iconSet.complete;

  const progressIndex = Math.min(state - 1, iconSet.progress.length - 1);
  return iconSet.progress[progressIndex] || iconSet.complete;
};

/**
 * Generate idle tooltip for initial state
 */
const generateIdleTooltip = (
  config: CopyProgressionConfig,
  totalLogs: number
): string => {
  const firstStep = config.steps[0];
  if (!firstStep) return "Copy logs";

  const count = calculateStepCount(firstStep, totalLogs);
  const stepDescription = formatStepDescription(firstStep, count);

  return `Copy ${stepDescription}`;
};

/**
 * Generate progress tooltip for active states
 */
const generateProgressTooltip = (
  state: CopyState,
  config: CopyProgressionConfig,
  totalLogs: number
): string => {
  const nextStepIndex = state;

  if (nextStepIndex >= config.steps.length) {
    return config.resetOnComplete ? "Start over" : "Copy complete";
  }

  const nextStep = config.steps[nextStepIndex];
  if (!nextStep) return "Copy logs";

  const count = calculateStepCount(nextStep, totalLogs);
  const stepDescription = formatStepDescription(nextStep, count);

  return `Copy ${stepDescription}`;
};

/**
 * Get copy button tooltip based on state (fully adaptive)
 */
export const getCopyTooltip = (
  state: CopyState,
  totalLogs: number,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);

  if (state === 0) {
    return generateIdleTooltip(adaptiveConfig, totalLogs);
  }

  return generateProgressTooltip(state, adaptiveConfig, totalLogs);
};

/**
 * Get progress bar width based on copied records vs total records (data-driven progress)
 */
export const getProgressWidth = (
  state: CopyState,
  totalLogs: number,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);

  if (state === 0 || totalLogs === 0) return "0%";

  // Calculate how many logs would be copied at the current state
  let copiedLogs = 0;

  if (state >= adaptiveConfig.steps.length) {
    // Final state or beyond - all logs copied
    copiedLogs = totalLogs;
  } else {
    // Calculate progression history to determine current log count
    const progressionHistory = calculateProgressionHistory(
      adaptiveConfig.steps,
      totalLogs,
      state - 1 // Previous steps completed
    );

    // Get the count for the current step
    const currentStep = adaptiveConfig.steps[state - 1];
    if (currentStep) {
      const stepCount = calculateAdaptiveStepCount(
        currentStep,
        totalLogs,
        progressionHistory
      );
      copiedLogs = stepCount > 0 ? stepCount : totalLogs;
    }
  }

  // Calculate percentage based on actual data copied
  const progressPercent = Math.min((copiedLogs / totalLogs) * 100, 100);
  return `${Math.round(progressPercent)}%`;
};

/**
 * Get progress bar color based on copy state (fully adaptive)
 */
export const getProgressColor = (
  state: CopyState,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);
  const colorPalette =
    adaptiveConfig.colors ||
    generateScalableColorPalette(adaptiveConfig.steps.length);

  if (state === 0) return colorPalette.idle;

  if (state >= adaptiveConfig.steps.length) return colorPalette.complete;

  const progressIndex = Math.min(state - 1, colorPalette.progress.length - 1);
  return colorPalette.progress[progressIndex] || colorPalette.complete;
};

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
const getOrdinalSuffix = (num: number): string => {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

/**
 * Get detailed hover message for copy button (fully adaptive)
 */
export const getHoverMessage = (
  state: CopyState,
  totalLogs: number,
  config: CopyProgressionConfig | CopyConfig = DEFAULT_COPY_CONFIG
): string => {
  // Handle legacy CopyConfig interface
  const adaptiveConfig =
    "icons" in config ? config : createAdaptiveConfig(config.steps);

  if (totalLogs === 0) {
    return "Copy Logs • Debug logging inactive - enable debug points to generate entries";
  }

  const totalSteps = adaptiveConfig.steps.length;

  if (state === 0) {
    // Idle state - explain the full progression
    const stepDescriptions = adaptiveConfig.steps
      .map((step, index) => {
        const count = calculateStepCount(step, totalLogs);
        const stepDesc = formatStepDescription(step, count);
        return `${index + 1}${getOrdinalSuffix(index + 1)} click exports ${stepDesc}`;
      })
      .join(", ");

    return `Copy Logs • Progressive copy: ${stepDescriptions} (${totalSteps} clicks total)`;
  }

  // Show current progress and what's next
  if (state >= totalSteps) {
    const message = adaptiveConfig.resetOnComplete
      ? `Progressive copy complete - ${totalLogs} debug entries processed (click to restart)`
      : `Progressive copy complete - ${totalLogs} debug entries processed`;
    return `Copy Logs • ${message}`;
  }

  const completedSteps = state;
  const nextStepIndex = state;
  const nextStep = adaptiveConfig.steps[nextStepIndex];

  if (!nextStep) {
    return `Copy Logs • Step ${completedSteps} complete - cycle complete`;
  }

  const nextCount = calculateStepCount(nextStep, totalLogs);
  const nextStepDesc = formatStepDescription(nextStep, nextCount);
  const remainingSteps = totalSteps - completedSteps;

  return `Copy Logs • Step ${completedSteps} complete - click again to export ${nextStepDesc} (${remainingSteps} clicks remaining)`;
};

/**
 * Validation and error handling for configurations
 */
export const validateConfig = (config: CopyProgressionConfig): string[] => {
  const errors: string[] = [];

  if (!config.steps || config.steps.length === 0) {
    errors.push("Steps array cannot be empty");
  }

  if (config.icons && config.icons.progress.length < config.steps.length) {
    errors.push("Not enough progress icons for all steps");
  }

  if (config.colors && config.colors.progress.length < config.steps.length) {
    errors.push("Not enough progress colors for all steps");
  }

  return errors;
};

// ============================================================================
// ADAPTIVE SYSTEM DEMONSTRATION
// ============================================================================

/**
 * Example configurations demonstrating the adaptive system's flexibility
 */
export const EXAMPLE_CONFIGS = {
  // Minimal 2-step progression
  simple: createAdaptiveConfig([10, "All"]),

  // Standard 4-step progression (current default)
  standard: createAdaptiveConfig([20, 200, "50%", "All"]),

  // Extended 6-step progression with percentages
  extended: createAdaptiveConfig([10, 50, 100, "25%", "75%", "All"]),

  // Large scale progression (10 steps)
  massive: createAdaptiveConfig([
    5,
    10,
    25,
    50,
    100,
    250,
    500,
    "25%",
    "75%",
    "All",
  ]),

  // Custom themed progression
  playful: createAdaptiveConfig([20, 100, "All"], {
    theme: COPY_THEMES.playful,
  }),

  // Professional themed with custom behavior
  business: createAdaptiveConfig([50, 200, 500, "All"], {
    theme: COPY_THEMES.professional,
    autoResetAfterDelay: false, // Don't auto-reset after display duration
  }),
} as const;

/**
 * Test function to verify adaptive behavior across different configurations
 */
export const testAdaptiveSystem = () => {
  const testResults: Record<string, any> = {};

  Object.entries(EXAMPLE_CONFIGS).forEach(([name, config]) => {
    testResults[name] = {
      stepCount: config.steps.length,
      icons: {
        idle: getCopyIcon(0, config),
        progress: config.steps.map((_, i) => getCopyIcon(i + 1, config)),
        complete: getCopyIcon(config.steps.length, config),
      },
      colors: {
        idle: getProgressColor(0, config),
        progress: config.steps.map((_, i) => getProgressColor(i + 1, config)),
        complete: getProgressColor(config.steps.length, config),
      },
      validation: validateConfig(config),
    };
  });

  return testResults;
};

/**
 * Console helper to preview adaptive configurations
 */
export const previewAdaptiveConfig = (config: CopyProgressionConfig) => {
  console.group(`🎯 Adaptive Copy Config Preview`);
  console.log(`📋 Steps: [${config.steps.join(", ")}]`);
  console.log(`🎨 Theme: ${config.theme?.name || "Custom"}`);
  console.log(`🔄 Reset on complete: ${config.resetOnComplete}`);
  console.log(`⏰ Auto-reset after delay: ${config.autoResetAfterDelay}`);

  console.group("🎭 Icon progression:");
  console.log(`Idle: ${getCopyIcon(0, config)}`);
  config.steps.forEach((step, i) => {
    console.log(`Step ${i + 1} (${step}): ${getCopyIcon(i + 1, config)}`);
  });
  console.log(`Complete: ${getCopyIcon(config.steps.length, config)}`);
  console.groupEnd();

  console.group("🌈 Color progression:");
  console.log(`Idle: ${getProgressColor(0, config)}`);
  config.steps.forEach((step, i) => {
    console.log(`Step ${i + 1} (${step}): ${getProgressColor(i + 1, config)}`);
  });
  console.log(`Complete: ${getProgressColor(config.steps.length, config)}`);
  console.groupEnd();

  const validation = validateConfig(config);
  if (validation.length > 0) {
    console.group("⚠️ Validation Issues:");
    validation.forEach((error) => console.warn(error));
    console.groupEnd();
  } else {
    console.log("✅ Configuration is valid");
  }

  console.groupEnd();
};

/**
 * Test function to verify corrected copy progression logic
 * This can be called from the browser console to test the adaptive boundaries
 */
export const testCopyProgression = (totalLogs: number = 284) => {
  console.group(`🧪 Copy Progression Test - ${totalLogs} logs`);

  const config = DEFAULT_COPY_CONFIG;
  console.log(`📋 Steps: [${config.steps.join(", ")}]`);
  console.log(`🎯 Total logs: ${totalLogs}`);

  let copyState = 0;
  const progressionResults: string[] = [];

  // Simulate clicking through all steps
  for (let i = 0; i < config.steps.length + 1; i++) {
    const mockLogs = Array(totalLogs)
      .fill(null)
      .map((_, idx) => ({
        timestamp: Date.now(),
        point: "test" as any,
        message: `Log ${idx + 1}`,
        data: null,
        level: "info" as any,
        sessionId: "test-session",
        severity: "info" as any,
      }));

    const result = getLogsToCopy(mockLogs, copyState, config);
    const stepName =
      copyState < config.steps.length ? config.steps[copyState] : "complete";

    progressionResults.push(
      `Step ${copyState + 1} (${stepName}): ${result.logs.length} logs`
    );
    console.log(
      `✅ ${progressionResults[progressionResults.length - 1]} - ${result.message}`
    );

    copyState = result.newState;

    if (copyState >= config.steps.length) break;
  }

  console.log("\n📊 Complete progression:", progressionResults.join(" → "));
  console.log(
    "\n💡 Each step should copy more logs than the previous (monotonically increasing)"
  );
  console.log(
    "   Percentage steps that would go backwards are automatically skipped!"
  );

  console.groupEnd();

  return progressionResults;
};

/**
 * Test function for specific problematic cases mentioned by user
 */
export const testProblematicCases = () => {
  console.group("🐛 Testing Previously Problematic Cases");

  console.log("Case 1: 116 logs");
  const case1 = testCopyProgression(116);

  console.log("\nCase 2: 284 logs");
  const case2 = testCopyProgression(284);

  console.log("\n🎯 Expected behavior:");
  console.log("  - 116 logs: 20 → 116 (all) [50% skipped because 58 < 20]");
  console.log(
    "  - 284 logs: 20 → 200 → 284 (all) [50% skipped because 142 < 200]"
  );
  console.log(
    "  - 150 logs: 20 → 150 (max reached) [progression finishes immediately]"
  );
  console.log(
    "  - Copy button will NOT cycle back when complete (resetOnComplete: false)"
  );
  console.log(
    "  - BUT will auto-reset after 3 seconds (autoResetAfterDelay: true)"
  );
  console.log(
    "  - Progress display duration synchronized with button animations"
  );

  console.groupEnd();

  return { case1, case2 };
};

/**
 * Test the new no-reset behavior at final state
 */
export const testNoResetBehavior = (totalLogs: number = 100) => {
  console.group(`🔒 Testing No-Reset Behavior - ${totalLogs} logs`);

  const config = DEFAULT_COPY_CONFIG;
  console.log(`📋 Steps: [${config.steps.join(", ")}]`);
  console.log(`🔄 Reset on complete: ${config.resetOnComplete}`);
  console.log(`⏰ Auto-reset after delay: ${config.autoResetAfterDelay}`);

  let copyState = 0;
  const mockLogs = Array(totalLogs)
    .fill(null)
    .map((_, idx) => ({
      timestamp: Date.now(),
      point: "test" as any,
      message: `Log ${idx + 1}`,
      data: null,
      level: "info" as any,
      sessionId: "test-session",
      severity: "info" as any,
    }));

  // Click through all steps to reach the final state
  console.log("🔄 Clicking through progression:");
  for (let i = 0; i < config.steps.length + 2; i++) {
    const result = getLogsToCopy(mockLogs, copyState, config);
    const stepName =
      copyState < config.steps.length ? config.steps[copyState] : "final";

    console.log(
      `  Click ${i + 1}: State ${copyState} (${stepName}) → ${result.logs.length} logs → New State ${result.newState}`
    );

    const oldState = copyState;
    copyState = result.newState;

    // If we're at the final state and no reset occurs, break
    if (oldState >= config.steps.length && copyState >= config.steps.length) {
      console.log("  ✅ Final state reached - no reset to head!");
      break;
    }
  }

  console.log(
    `\n🎯 Final copy state: ${copyState} (should stay at final state)`
  );
  console.log(
    "💡 With resetAfterComplete: false, the button stays in final state"
  );
  console.log("   instead of cycling back to the beginning!");

  console.groupEnd();

  return copyState;
};

/**
 * Test the new maximum-reached behavior in middle of progression
 */
export const testMaximumReachedBehavior = () => {
  console.group("🏁 Testing Maximum Reached in Middle of Progression");

  const config = DEFAULT_COPY_CONFIG;
  console.log(`📋 Steps: [${config.steps.join(", ")}]`);

  // Test case where step 2 (200) reaches maximum with 150 logs
  console.log("\n🧪 Test Case: 150 logs (step 2 should reach maximum)");
  let copyState = 0;
  const mockLogs = Array(150)
    .fill(null)
    .map((_, idx) => ({
      timestamp: Date.now(),
      point: "test" as any,
      message: `Log ${idx + 1}`,
      data: null,
      level: "info" as any,
      sessionId: "test-session",
      severity: "info" as any,
    }));

  console.log("🔄 Expected progression:");
  console.log("  Step 1: 20 logs");
  console.log("  Step 2: 200 → 150 (maximum reached) → FINISH");
  console.log("  Result: No more steps, progression complete");

  console.log("\n🔄 Actual progression:");
  for (let i = 0; i < 5; i++) {
    const result = getLogsToCopy(mockLogs, copyState, config);
    const stepName =
      copyState < config.steps.length ? config.steps[copyState] : "finished";
    const isMaxReached = result.logs.length >= mockLogs.length;

    console.log(
      `  Click ${i + 1}: State ${copyState} (${stepName}) → ${result.logs.length} logs → New State ${result.newState}${isMaxReached ? " 🏁 MAX" : ""}`
    );

    const oldState = copyState;
    copyState = result.newState;

    // If we've reached final state or no change, break
    if (copyState >= config.steps.length || copyState === oldState) {
      console.log("  ✅ Progression finished - maximum reached in middle!");
      break;
    }
  }

  console.log(
    `\n🎯 Final state: ${copyState} (should be at final state: ${config.steps.length})`
  );
  console.log(
    "💡 When a step copies all available logs, progression finishes immediately"
  );
  console.log("   instead of continuing to redundant subsequent steps!");

  console.groupEnd();

  return copyState;
};

/**
 * Comprehensive test suite for all copy progression features
 */
export const testCopyProgressionSuite = () => {
  console.group("🧪 Comprehensive Copy Progression Test Suite");

  console.log("🔄 Testing backwards progression prevention...");
  testProblematicCases();

  console.log("\n🔒 Testing no-reset behavior...");
  testNoResetBehavior(100);

  console.log("\n🏁 Testing maximum reached in middle...");
  testMaximumReachedBehavior();

  console.log("\n🎛️ Testing dual-flag reset behavior...");
  testDualFlagResetBehavior();

  console.log("\n📊 Testing data-driven progress calculation...");
  testProgressCalculation();

  console.log("\n⚙️ Testing unified auto-reset configuration...");
  testUnifiedAutoReset();

  console.log("\n✅ All tests completed!");
  console.groupEnd();
};

/**
 * Test the new dual-flag reset behavior (resetOnComplete vs autoResetAfterDelay)
 */
export const testDualFlagResetBehavior = () => {
  console.group("🎛️ Testing Dual-Flag Reset Behavior");

  console.log("🎯 NEW BEHAVIOR EXPLAINED:");
  console.log(
    "  - resetOnComplete: false = Clicking when complete doesn't cycle back"
  );
  console.log(
    "  - autoResetAfterDelay: true = Button auto-resets to idle after 3 seconds"
  );
  console.log("  - Result: No annoying cycling + convenient auto-reset ✅");

  const config = DEFAULT_COPY_CONFIG;
  console.log(
    `\n📋 Config: resetOnComplete=${config.resetOnComplete}, autoResetAfterDelay=${config.autoResetAfterDelay}`
  );

  console.log("\n🔄 Click Behavior Test:");
  console.log("  1. Progress through steps: 20 → 200 → All");
  console.log(
    "  2. At final state, click again → stays at final (no cycle back)"
  );
  console.log("  3. Wait 3 seconds → auto-resets to idle for convenience");

  // Test the click behavior
  const mockLogs = Array(300)
    .fill(null)
    .map((_, idx) => ({
      timestamp: Date.now(),
      point: "test" as any,
      message: `Log ${idx + 1}`,
      data: null,
      level: "info" as any,
      sessionId: "test-session",
      severity: "info" as any,
    }));

  let copyState = 0;
  console.log("\n🧪 Simulating clicks:");

  // Click through to final state
  for (let i = 0; i < 4; i++) {
    const result = getLogsToCopy(mockLogs, copyState, config);
    const stepName =
      copyState < config.steps.length ? config.steps[copyState] : "final";

    console.log(
      `  Click ${i + 1}: State ${copyState} (${stepName}) → ${result.logs.length} logs → New State ${result.newState}`
    );

    const oldState = copyState;
    copyState = result.newState;

    // If we're at final state and try to click again
    if (oldState >= config.steps.length && copyState >= config.steps.length) {
      console.log(
        "  ✅ At complete state - click doesn't cycle back (resetOnComplete: false)"
      );
      break;
    }
  }

  console.log(
    `\n💡 Current state: ${copyState} (final state: ${config.steps.length})`
  );
  console.log(
    "🕐 In real usage: button would auto-reset to state 0 after 3 seconds"
  );
  console.log("   (controlled by autoResetAfterDelay: true)");

  console.groupEnd();

  return copyState;
};

/**
 * Test the new data-driven progress calculation
 */
export const testProgressCalculation = () => {
  console.group("📊 Testing Data-Driven Progress Calculation");

  console.log(
    "🎯 NEW BEHAVIOR: Progress based on copied records vs total records"
  );
  console.log("  (Not based on completed steps)");

  const config = DEFAULT_COPY_CONFIG;
  console.log(`📋 Steps: [${config.steps.join(", ")}]`);

  // Test with different log counts
  const testCases = [
    { totalLogs: 100, description: "Small dataset" },
    { totalLogs: 500, description: "Medium dataset" },
    { totalLogs: 1000, description: "Large dataset" },
  ];

  testCases.forEach(({ totalLogs, description }) => {
    console.log(`\n📈 ${description}: ${totalLogs} total logs`);
    console.log("State | Step      | Copied | Progress | vs Old Method");
    console.log("------|-----------|--------|----------|---------------");

    for (let state = 0; state <= config.steps.length + 1; state++) {
      const stepName =
        state === 0
          ? "idle"
          : state <= config.steps.length
            ? (config.steps[state - 1] ?? "unknown")
            : "final";

      // Calculate actual copied logs for this state
      let copiedLogs = 0;
      if (state > 0 && state <= config.steps.length) {
        const progressionHistory = calculateProgressionHistory(
          config.steps,
          totalLogs,
          state - 1
        );
        const currentStep = config.steps[state - 1];
        if (currentStep) {
          const stepCount = calculateAdaptiveStepCount(
            currentStep,
            totalLogs,
            progressionHistory
          );
          copiedLogs = stepCount > 0 ? stepCount : totalLogs;
        }
      } else if (state > config.steps.length) {
        copiedLogs = totalLogs;
      }

      // New data-driven progress
      const newProgress = getProgressWidth(state, totalLogs, config);

      // Old step-based progress (for comparison)
      const oldProgress =
        state === 0
          ? "0%"
          : `${Math.round(Math.min((state / config.steps.length) * 100, 100))}%`;

      const stateStr = state.toString().padStart(5);
      const stepStr = stepName.toString().padEnd(9);
      const copiedStr = copiedLogs.toString().padStart(6);
      const newProgressStr = newProgress.padStart(8);
      const oldProgressStr = oldProgress.padStart(8);

      console.log(
        `${stateStr} | ${stepStr} | ${copiedStr} | ${newProgressStr} | ${oldProgressStr}`
      );
    }
  });

  console.log("\n🎯 Key Differences:");
  console.log(
    "  ✅ NEW: Progress reflects actual data copied (meaningful to users)"
  );
  console.log("  ❌ OLD: Progress only reflected step completion (arbitrary)");
  console.log(
    "  📊 Example: 200 logs of 1000 total = 20% progress (not 50% for step 2/4)"
  );

  console.groupEnd();
};

/**
 * Test the new unified auto-reset configuration
 */
export const testUnifiedAutoReset = () => {
  console.group("⚙️ Testing Unified Auto-Reset Configuration");

  console.log("🎯 Timing: DISPLAY_DURATION controls when to reset");
  console.log(
    "🎯 Control: autoResetAfterDelay boolean enables/disables auto-reset"
  );
  console.log("  - autoResetAfterDelay: true = Reset after DISPLAY_DURATION");
  console.log("  - autoResetAfterDelay: false = No auto-reset");
  console.log("  - DISPLAY_DURATION = 3000ms for all states");

  // Test different configurations
  console.log("\n🧪 Testing different auto-reset configurations:");

  const testConfigs = [
    { enabled: false, description: "Disabled" },
    { enabled: true, description: "Enabled (resets after 3000ms)" },
  ];

  testConfigs.forEach(({ enabled, description }) => {
    const config = createAdaptiveConfig([20, "All"], {
      resetOnComplete: false,
      autoResetAfterDelay: enabled,
    });

    const status = enabled
      ? "✅ Auto-reset after DISPLAY_DURATION"
      : "❌ No auto-reset";
    console.log(`  ${description}: ${status}`);
    console.log(
      `    Config: autoResetAfterDelay=${config.autoResetAfterDelay}`
    );
  });

  console.log("\n✨ Benefits of boolean + DISPLAY_DURATION approach:");
  console.log("  ✅ Clear separation: timing vs enable/disable");
  console.log("  ✅ Consistent timing - DISPLAY_DURATION for all states");
  console.log("  ✅ Simple control - boolean flag easy to understand");
  console.log("  ✅ Predictable behavior - same timing regardless of state");

  console.groupEnd();
};
