/**
 * Dependency Log Formatters - Centralized Exports
 *
 * Enhanced dependency logging with modular component structure
 */

// Main formatter components
export {
  DependencyExpansionContent,
  DependencyLogFormatter,
  LegacyDependencyLogFormatter,
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";

// Utility functions
export {
  calculateDelta,
  extractComponentName,
  formatDelta,
  formatDependencyData,
  getDependencySeverity,
  getEnhancedObjectDisplay,
  getImpactColor,
  getLogTypeMetadata,
  type DeltaInfo,
} from "./utils";

// Sub-components (for advanced usage)
export { DeltaDisplay, DeltaSummary } from "./components/delta-display";
export {
  CompactDiffDisplay,
  CompactDiffEntry,
} from "./components/diff-display";
export { CompactHelpMessage } from "./components/help-message";
export {
  CompactValueRenderer,
  EnhancedDependencyValueRenderer,
  ModernValueDisplay,
} from "./components/value-renderers";

// Constants
export { COMPACT_JSON_STYLE, COMPONENT_NAME_REGEX } from "./constants";

// Default export
export { default } from "./dependency-expansion-formatter";
