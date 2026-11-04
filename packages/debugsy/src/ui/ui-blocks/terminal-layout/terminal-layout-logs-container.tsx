// Backward compatibility - re-export from ui-blocks/logs-container
export {
  LogsContainer as TerminalLayoutLogsContainer,
  type LogsContainerProps as TerminalLayoutLogsContainerProps,
  type LogsContainerBanner,
  type LogsContainerTruncation,
} from "../logs-container/logs-container";

// Re-export PauseState and ScrollFollowingState from hooks (canonical source)
export type { PauseState } from "../../hooks/use-pause-state";
export type { ScrollFollowingState } from "../../hooks/use-scroll-following";

