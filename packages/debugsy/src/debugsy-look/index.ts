// Debug UI Components - Main entry point (V1/V2 Switcher)
export {
  DebugsyLook,
  type DebugsyLookProps,
  type UIVersion,
} from "./debugsy-look-switcher";

// V1 Components (for advanced usage)
export {
  DebugsyLook as DebugsyLookV1,
  type DebugsyLookProps as DebugsyLookV1Props,
} from "../debugsy-look-v1/debugsy-look";

// V2 Components (for advanced usage)
export {
  DebugsyLook as DebugsyLookV2,
  type DebugsyLookProps as DebugsyLookV2Props,
} from "./debugsy-look";

// V2 Sub-components (for composition and customization)
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

// V1 UI Components (legacy, may be deprecated)
export {
  DebugPointButtons,
  type DebugPointButtonConfig,
  type DebugPointButtonsProps,
} from "../debugsy-look-v1/ui-control-center/control-buttons";
export {
  DebugControlPanel,
  StandaloneDebugControlPanel,
  type DebugControlPanelProps,
} from "../debugsy-look-v1/ui-control-center/control-panel";
export {
  DebugPanelHeader,
  type DebugPanelHeaderProps,
} from "../debugsy-look-v1/ui-control-center/header";
export {
  DebugPanelResizeHandle,
  type DebugPanelResizeHandleProps,
} from "../debugsy-look-v1/ui-control-center/resize-handle";
export {
  DebugResizePresets,
  type DebugResizePresetsProps,
} from "../debugsy-look-v1/ui-control-center/resize-presets";
export {
  DebugDependencyControls,
  type DebugDependencyControlsProps,
} from "../debugsy-look-v1/ui-dependency/dependency-controls";
export {
  DebugDisplayPanel,
  type DebugDisplayPanelProps,
} from "../debugsy-look-v1/ui-display";
export {
  DebugLogsList,
  type DebugLogsListProps,
} from "../debugsy-look-v1/ui-logs/logs-list";
export {
  DebugStatsPanel,
  type DebugStatsPanelProps,
} from "../debugsy-look-v1/ui-stats-center/stats-panel";

// Logs components (V1)
export * from "../debugsy-look-v1/ui-logs";
