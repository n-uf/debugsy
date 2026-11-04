// debugsy's own UI kit: the parts of the panel that used to come from
// @n-uf/harbuz, ported from harbuz 0.6.0 (n-uf's own code) so the library has
// no private dependency. Internal to the library: the package root
// (`index.ts`) is still its only public entry.

// Hooks
export { useClickOutside } from "./hooks/use-click-outside";
export { useCopyState, type CopyStateReturn } from "./hooks/use-copy-state";
export {
  useHoverMessage,
  type HoverMessageHandlers,
} from "./hooks/use-hover-message";
export { useKeyboardSelection } from "./hooks/use-keyboard-selection";
export {
  useKeyboardShortcuts,
  type KeyboardShortcut,
} from "./hooks/use-keyboard-shortcuts";
export { useLogFiltering } from "./hooks/use-log-filtering";
export { usePauseState, type PauseState } from "./hooks/use-pause-state";
export { useResizable } from "./hooks/use-resizable";
export {
  useScrollFollowing,
  type ScrollFollowingState,
} from "./hooks/use-scroll-following";

// Copy and display state
export {
  DEFAULT_COPY_CONFIG,
  getLogsToCopy,
  getProgressColor,
  getProgressWidth,
} from "./patterns/copy-system/copy-state";
export {
  DisplayQueueProvider,
  useDisplayQueueContext,
  useDisplayQueueFull as useDisplayQueueFullScoped,
} from "./patterns/display-system/display-queue-context";
export { useDisplayQueueHelpers } from "./patterns/display-system/display-queue-helpers-context";
export { setProgressDisplay } from "./patterns/display-system/display-state";
export { useLegacyDisplayCompat } from "./patterns/display-system/use-display-legacy-compat";

// Tokens and utilities
export { Z_INDEX } from "./tokens/z-index";
export { safeSuperjsonStringify } from "./utils/safe-stringify";

// Log entry
export { LogEntry } from "./ui-blocks/log-entry/log-entry";
export { useLogEntryCopy } from "./ui-blocks/log-entry/use-log-entry-copy";

// Action toolbar
export {
  ActionToolbar,
  type ActionButton,
  type DepthControl,
  type ProgressControl,
} from "./ui-blocks/shared/action-toolbar/action-toolbar";
export {
  getDepthColor,
  getDepthDescription,
  getDepthWidth,
  type DepthSetting,
} from "./ui-blocks/shared/action-toolbar/depth-control-helpers";

// Lists, tray, panels
export { VirtualizedList } from "./ui-blocks/shared/virtualized-list/virtualized-list";
export { Tray, TrayDisplay, TraySection } from "./ui-blocks/tray/tray";
export { TruncationPanel } from "./ui-blocks/truncation-panel/truncation-panel";
export { Banner } from "./ui-primitives/shared/banner/banner";

// Indicators
export { Indicator } from "./ui-primitives/shared/indicator/indicator";
export {
  IndicatorButtonGroup,
  type IndicatorButtonGroupItem,
  type IndicatorButtonTheme,
} from "./ui-primitives/terminal/indicator-button/indicator-button-group";
export { IndicatorButton } from "./ui-primitives/terminal/indicator-button/indicator-button";

// Terminal window (harbuz's TerminalLayout* blocks under their TerminalWindow* names)
export { TerminalLayout as TerminalWindow } from "./ui-blocks/terminal-layout/terminal-layout";
export { TerminalLayoutActions as TerminalWindowActions } from "./ui-blocks/terminal-layout/terminal-layout-actions";
export { TerminalLayoutBody as TerminalWindowBody } from "./ui-blocks/terminal-layout/terminal-layout-body";
export { TerminalLayoutContent as TerminalWindowContent } from "./ui-blocks/terminal-layout/terminal-layout-content";
export { TerminalLayoutControlPanel as TerminalWindowControlPanel } from "./ui-blocks/terminal-layout/terminal-layout-control-panel";
export { TerminalLayoutHeader as TerminalWindowHeader } from "./ui-blocks/terminal-layout/terminal-layout-header";
export { TerminalLayoutLogsContainer as TerminalWindowLogsContainer } from "./ui-blocks/terminal-layout/terminal-layout-logs-container";
export { TerminalLayoutResizeHandle as TerminalWindowResizeHandle } from "./ui-blocks/terminal-layout/terminal-layout-resize-handle";
export { TerminalLayoutResizePresets as TerminalWindowResizePresets } from "./ui-blocks/terminal-layout/terminal-layout-resize-presets";
export { TerminalLayoutSettings as TerminalWindowSettings } from "./ui-blocks/terminal-layout/terminal-layout-settings";
export { TerminalLayoutShortcut as TerminalWindowShortcut } from "./ui-blocks/terminal-layout/terminal-layout-shortcut";
export { TerminalLayoutShortcuts as TerminalWindowShortcuts } from "./ui-blocks/terminal-layout/terminal-layout-shortcuts";
export { TerminalLayoutSidebar as TerminalWindowSidebar } from "./ui-blocks/terminal-layout/terminal-layout-sidebar";
export { TerminalLayoutStatItem as TerminalWindowStatItem } from "./ui-blocks/terminal-layout/terminal-layout-stat-item";
export { TerminalLayoutStats as TerminalWindowStats } from "./ui-blocks/terminal-layout/terminal-layout-stats";
