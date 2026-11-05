// debugsy's own UI kit. The logic came from harbuz 0.6.0 (n-uf's own code);
// the look is kavun's, as debugsy's own scoped `dbg-` stylesheet, so the
// panel needs no Tailwind and no CSS import. Internal to the library: the
// package root (`index.ts`) is still its only public entry.

// Styles
export { DebugsyStyles } from "./styles/sheet";
export type { DebugsyTheme } from "./styles/themes";

// Primitives
export { Lamp, Meter, Segments, type LampState, type MeterTone } from "./primitives/lamp";
export { Notice, type NoticeTone } from "./primitives/notice";
export { Word, WordDivider, type WordTone } from "./primitives/word";

// Window
export {
  ShortcutList,
  SidebarSection,
  StatList,
  Window,
  WindowBody,
  WindowContent,
  WindowControl,
  WindowEdge,
  WindowRail,
  WindowSidebar,
  type StatItem,
} from "./window/window";

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

// Logs
export { LogEntry } from "./ui-blocks/log-entry/log-entry";
export { useLogEntryCopy } from "./ui-blocks/log-entry/use-log-entry-copy";
export { LogsContainer } from "./ui-blocks/logs-container/logs-container";

// Action rail
export {
  ActionToolbar,
  type ActionButton,
  type DepthControl,
} from "./ui-blocks/shared/action-toolbar/action-toolbar";
export {
  DEPTH_SETTINGS,
  getDepthDescription,
  getDepthSegments,
  type DepthSetting,
} from "./ui-blocks/shared/action-toolbar/depth-control-helpers";

// Control tray
export { Tray, TrayDisplay, TraySection } from "./ui-blocks/tray/tray";
export type { DisplayAction } from "./ui-blocks/shared/display/display";
