// Debug UI Components - Main entry point
export {
  DebugsyLook,
  type DebugsyLookProps,
  type UIVersion,
} from "./debugsy-look";

// V1 Components (for advanced usage)
export {
  DebugsyLook as DebugsyLookV1,
  type DebugsyLookProps as DebugsyLookV1Props,
} from "../debugsy-look-v1/debugsy-look";

// V2 Components (for advanced usage)
export {
  DebugsyLook as DebugsyLookV2,
  type DebugsyLookProps as DebugsyLookV2Props,
} from "./debugsy-look-impl";

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
