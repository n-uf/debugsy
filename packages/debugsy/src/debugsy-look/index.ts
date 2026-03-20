// Debug UI Components - Main entry point
export {
  DebugsyLook,
  type DebugsyLookProps,
} from "./debugsy-look";

// Sub-components (for composition and customization)
export { DebugsyActions, type DebugsyActionsProps } from "./debugsy-actions";
export {
  DebugsyShortcutsDisplay,
  type DebugsyShortcutsDisplayProps,
} from "./debugsy-shortcuts";
export { DebugsyStats, type DebugsyStatsProps } from "./debugsy-stats";
export {
  DependencyAdvancedPanel,
  type DependencyAdvancedPanelProps,
} from "./dependency-advanced-panel";
export {
  DependencyControls,
  type DependencyControlsProps,
} from "./dependency-controls";
export { ModuleNav } from "./module-nav";

// Hooks (for advanced composition)
export {
  useClear,
  type UseClearConfig,
  type UseClearReturn,
} from "./use-clear";
export {
  useDebugsyShortcuts,
  type UseDebugsyShortcutsConfig,
  type UseDebugsyShortcutsReturn,
} from "./use-debugsy-shortcuts";
