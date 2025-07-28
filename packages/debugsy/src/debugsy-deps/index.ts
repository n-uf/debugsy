/**
 * Dependency Tracking Module - Enhanced Debug System
 *
 * RESPONSIBILITY: Comprehensive dependency tracking and analysis
 * - Intelligent frequency detection with app phase awareness
 * - Smart filtering to reduce noise during initialization
 * - Detailed change analysis with type discrimination
 * - Performance-conscious rendering with configurable throttling
 * - Throttled logging to prevent UI blocking
 * - Clean separation between React logic and analysis utilities
 *
 * ARCHITECTURE: Modular design for maintainability
 * - use-deps.ts: React hooks orchestration
 * - logic/change-utils.ts: Core analysis utilities
 * - logic/change-tracking.ts: Frequency detection algorithms
 * - deps-filters.ts: Filtering logic
 * - deps-logger.ts: Unified logging system
 * - deps-settings.ts: State management
 * - deps-config.ts: Centralized threshold configuration
 */

// === REACT HOOKS ===
export {
  useRenderTracker,
  useWhyDidYouUpdate,
  type DependencyChangeInfo,
  type RenderRateInfo,
} from "./use-deps";

// === CORE LOGIC ===
export {
  analyzeChanges,
  getChangeIndicators,
  logDependencyChanges,
  type PropChange,
} from "./logic/change-utils";

export {
  initializationPhase,
  trackDependencyChange,
  type ChangeTrackingInfo,
} from "./logic/change-tracking";

// === CONFIGURATION ===
export {
  DEPS_CONFIG_DEFAULTS,
  getFrequencyThreshold,
  getRenderRateSeverity,
  validateDepsConfig,
  type DepsConfigThresholds,
} from "./deps-config";

// === UTILITIES ===
export {
  shouldLogChangeType,
  shouldLogLevel,
  shouldTrackHook,
} from "./deps-filters";
export {
  logErrorToDebugSystem,
  logToDebugSystem,
  logWarnToDebugSystem,
} from "./deps-logger";
export { getDepsSettings } from "./deps-settings";
