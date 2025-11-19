/**
 * Debug Display Module
 *
 * Provides debug display state management and UI components.
 */

// Export display state management (now in shared location)
export {
  clearDebugDisplayContent,
  setDebugDisplayContent,
  useDebugDisplayContent,
  type DebugDisplayContent,
  type DebugDisplayState,
} from "../../shared/debug-display-state";

// Export display component
export {
  DebugDisplayPanel,
  type DebugDisplayPanelProps,
} from "./debug-display-panel";
