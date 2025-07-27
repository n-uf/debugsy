import { useCallback } from "react";
import type {
  DebugLogEntry,
  DependencyFilter,
  DependencyLogLevel,
} from "../shared/debug-constants";

// Import notification system for real-time UI updates
let notifySubscribers: (() => void) | null = null;
let useDebugSubscription: (() => void) | null = null;

// Initialize notification system when available
const initializeNotificationSystem = () => {
  if (!notifySubscribers || !useDebugSubscription) {
    try {
      // Dynamically import to avoid circular dependencies
      import("../debug-logs/hooks/debug-notifications")
        .then((module) => {
          notifySubscribers = module.notifySubscribers;
          useDebugSubscription = module.useDebugSubscription;
        })
        .catch(() => {
          // Notification system not available - UI updates will be manual
        });
    } catch {
      // Fallback - no real-time UI updates
    }
  }
};

// Get dependency state controls from debug state
const getDependencyStateControls = () => {
  try {
    const {
      dependencySettingsControls,
      getGlobalDebugState,
    } = require("../shared/debug-settings");
    return { dependencySettingsControls, getGlobalDebugState };
  } catch {
    // Fallback if debug state is not available
    return null;
  }
};

/**
 * Unified dependency state hook - UI control interface for dependency tracking
 * Separated from core tracking logic for better architectural clarity
 * UNIFIED: Now uses debug point system for enabled state
 */
export const useDependencyState = () => {
  // Initialize systems
  initializeNotificationSystem();

  // Subscribe to debug state changes
  if (useDebugSubscription) {
    useDebugSubscription();
  }

  const stateControls = getDependencyStateControls();

  if (!stateControls) {
    // Fallback state when debug system is not available
    return {
      enabled: false,
      logLevel: "normal" as DependencyLogLevel,
      filter: "all" as DependencyFilter,
      logs: [] as Array<DebugLogEntry & { point: "dependencies" }>,
      enable: () => {},
      disable: () => {},
      setLogLevel: () => {},
      setFilter: () => {},
    };
  }

  const { dependencySettingsControls, getGlobalDebugState } = stateControls;
  const globalDebugState = getGlobalDebugState();

  const getDependencyLogs = useCallback(() => {
    return globalDebugState.logs.filter(
      (log: DebugLogEntry) => log.point === "dependencies"
    ) as Array<DebugLogEntry & { point: "dependencies" }>;
  }, [globalDebugState.logs]);

  const setFilter = useCallback(
    (filter: DependencyFilter) => {
      dependencySettingsControls.setFilter(filter);
      if (notifySubscribers) {
        notifySubscribers();
      }
    },
    [dependencySettingsControls]
  );

  const setLogLevel = useCallback(
    (level: DependencyLogLevel) => {
      dependencySettingsControls.setLevel(level);
      if (notifySubscribers) {
        notifySubscribers();
      }
    },
    [dependencySettingsControls]
  );

  const enable = useCallback(() => {
    dependencySettingsControls.setEnabled(true);
    if (notifySubscribers) {
      notifySubscribers();
    }
  }, [dependencySettingsControls]);

  const disable = useCallback(() => {
    dependencySettingsControls.setEnabled(false);
    if (notifySubscribers) {
      notifySubscribers();
    }
  }, [dependencySettingsControls]);

  return {
    // State - now unified through debug point system
    enabled: dependencySettingsControls.getEnabled(),
    logLevel: dependencySettingsControls.getLevel(),
    filter: dependencySettingsControls.getFilter(),
    logs: getDependencyLogs(),

    // Controls - same interface, unified implementation
    enable,
    disable,
    setLogLevel,
    setFilter,
  };
};

// Initialize notification system on module load
initializeNotificationSystem();
