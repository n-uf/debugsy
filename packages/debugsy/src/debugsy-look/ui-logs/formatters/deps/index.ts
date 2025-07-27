/**
 * Dependency Log Formatters - Clean Exports
 *
 * Streamlined dependency logging with delta-focused architecture
 */

// Main formatter components
export {
  DependencyExpansionContent,
  DependencyLogFormatter,
  LegacyDependencyLogFormatter,
  getDependencyLogMeta,
} from "./dependency-expansion-formatter";

// Core utilities
export {
  calculateDelta,
  extractComponentName,
  formatDelta,
  formatDependencyData,
  getDependencySeverity,
  getImpactColor,
  getLogTypeMetadata,
  type DeltaInfo,
} from "./utils";

// Primary components
export { DeltaDisplay, DeltaSummary } from "./components/delta-display";
export { CompactDiffDisplay } from "./components/diff-display";
export { CompactHelpMessage } from "./components/help-message";
export { CompactValueRenderer } from "./components/value-renderers";

// Constants
export { COMPACT_JSON_STYLE, COMPONENT_NAME_REGEX } from "./constants";

// Default export
export { default } from "./dependency-expansion-formatter";
