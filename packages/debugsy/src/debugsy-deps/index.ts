/**
 * Debug Dependencies Module
 *
 * REFACTORED: Split into focused responsibility modules with extracted utilities
 *
 * ARCHITECTURE: Dependencies as Debugsy Extension
 * - Core debugsy handles all logging, state management, and UI integration
 * - Dependencies module focuses only on React-specific tracking logic
 * - Clean separation of concerns with modular design and utility extraction
 *
 * MODULE ORGANIZATION:
 * - dependency-logger.ts: Unified logging system delegation
 * - dependency-state.ts: State access and management
 * - change-tracking.ts: Frequency detection and initialization tracking
 * - dependency-filters.ts: Filtering logic for what to log
 * - dependency-utilities.ts: Utility functions for change analysis and logging
 * - debug-deps.ts: Main React hooks orchestration
 *
 * Provides React hook dependency tracking and performance monitoring tools
 * to debug circular re-rendering, ineffective memoization, and render loops.
 */

// Core dependency tracking functionality
export { useRenderTracker, useWhyDidYouUpdate } from "./debug-deps";

// Logging system
export {
  dependencyLogger,
  logErrorToDebugSystem,
  logToDebugSystem,
  logWarnToDebugSystem,
} from "./dependency-logger";

// State management
export { getDependencyState, type DependencyState } from "./dependency-state";

// Change tracking and frequency detection
export {
  initializationPhase,
  trackDependencyChange,
  type ChangeTrackingInfo,
} from "./change-tracking";

// Filtering logic
export { shouldLogDependency } from "./dependency-filters";

// Utility functions for change analysis and logging
export {
  analyzeChanges,
  detectChangeType,
  getChangeIndicators,
  logDependencyChanges,
  logPropChange,
  type PropChange,
} from "./dependency-utilities";

// UI state management and controls (for backward compatibility)
export { useDependencySettings as useDependencyState } from "../debugsy-shared/debug-settings";

// Types (re-export for convenience)
export type {
  DebugLogEntry,
  DependencyFilter,
  DependencyLogLevel,
} from "../debugsy-shared/debug-constants";

/**
 * ✅ UTILITY EXTRACTION COMPLETE: Extracted Complex Logic from useWhyDidYouUpdate
 *
 * ACCOMPLISHED:
 * 1. ✅ Created dependency-utilities.ts with extracted utility functions
 * 2. ✅ Simplified useWhyDidYouUpdate by 80+ lines to focus on React logic only
 * 3. ✅ Improved testability with isolated utility functions
 * 4. ✅ Enhanced code reusability across different hook implementations
 * 5. ✅ Better separation between React hooks and analysis logic
 * 6. ✅ Maintained all existing functionality and behavior
 * 7. ✅ Added comprehensive type definitions for better TypeScript support
 * 8. ✅ Created focused utility functions with single responsibilities
 *
 * UTILITY FUNCTIONS:
 * - detectChangeType(): Determine change type (function/object/primitive)
 * - analyzeChanges(): Analyze all prop changes and filter what to log
 * - getChangeIndicators(): Generate severity and indicator information
 * - logPropChange(): Log a single prop change with formatting
 * - logDependencyChanges(): Log all changes with summary and details
 *
 * MODULE RESPONSIBILITIES:
 * - dependency-logger.ts (75 lines): Logging delegation to unified debugsy
 * - dependency-state.ts (53 lines): State access and management
 * - change-tracking.ts (126 lines): Frequency detection and phase tracking
 * - dependency-filters.ts (98 lines): Filtering and decision logic
 * - dependency-utilities.ts (175 lines): Utility functions for change analysis
 * - debug-deps.ts (95 lines): Clean React hooks orchestration
 *
 * BENEFITS:
 * - 🎯 Cleaner React hooks focused only on React-specific logic
 * - 🧹 Better testability with isolated utility functions
 * - 🔄 Improved code reusability and maintainability
 * - 📚 Enhanced documentation with focused responsibilities
 * - ⚡ Easier debugging and development with clear separation
 */
