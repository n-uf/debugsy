import { notifySubscribers } from "../../debugsy-logs/hooks/debug-notifications";
import { getGlobalDebugState } from "../../debugsy-shared/debug-settings";

/**
 * Browser CLI Dependency Commands
 * Provides dependency tracking control for the debugsy browser console interface
 */

export interface DepsCommands {
  off: () => void;
  on: () => void;
  quiet: () => void;
  initAware: () => void;
  normal: () => void;
  verbose: () => void;
  debug: () => void;
  functionsOnly: () => void;
  objectsOnly: () => void;
  unstableOnly: () => void;
}

/**
 * Creates the dependency commands interface
 */
export function createDepsCommands(): DepsCommands {
  return {
    off: () => {
      const state = getGlobalDebugState();
      state.enabled.delete("dependencies");
      console.log(`
🎛️ Dependency Tracking Control

🔇 DEPENDENCY TRACKING DISABLED
   All dependency change logging has been stopped.
   
💡 TO RE-ENABLE:
   debugsy.deps.on()        - Basic tracking
   debugsy.deps.verbose()   - Detailed tracking
   debugsy.deps.initAware() - Smart init filtering
`);
      notifySubscribers();
    },

    on: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      console.log(`
🎛️ Dependency Tracking Control

✅ DEPENDENCY TRACKING ENABLED
   React hooks will now log dependency changes to console.
   
🎯 WHAT TO EXPECT:
   • useCallback/useMemo dependency changes
   • useEffect dependency warnings
   • Component prop changes (when using useWhyDidYouUpdate)
   
🔧 ADJUST VERBOSITY:
   debugsy.deps.quiet()     - Only critical changes
   debugsy.deps.verbose()   - Detailed analysis
   debugsy.deps.debug()     - Maximum detail
`);
      notifySubscribers();
    },

    quiet: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.level = "quiet";
      console.log(`
🎛️ Dependency Tracking Control

🤫 QUIET MODE ACTIVATED
   Only critical dependency changes will be logged.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  Quiet (critical only)
   Filter: All dependencies
   
🔧 OTHER LEVELS:
   debugsy.deps.normal()    - Standard tracking
   debugsy.deps.verbose()   - Detailed tracking
   debugsy.deps.debug()     - Maximum detail
`);
      notifySubscribers();
    },

    initAware: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.level = "normal"; // Use valid DependencyLogLevel
      console.log(`
🎛️ Dependency Tracking Control

🚀 INIT-AWARE MODE ACTIVATED
   Smart filtering of initialization-related changes.
   
✨ INIT-AWARE FEATURES:
   • Reduced noise during component mounting
   • Focuses on runtime dependency issues
   • Ideal for identifying infinite render loops
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  Normal (init-aware)
   Filter: All dependencies
   
💡 RECOMMENDED FOR:
   • Debugging "Maximum update depth exceeded" errors
   • Finding parasitic re-renders
   • Production-like dependency tracking
`);
      notifySubscribers();
    },

    normal: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.level = "normal";
      console.log(`
🎛️ Dependency Tracking Control

📊 NORMAL MODE ACTIVATED
   Standard dependency change reporting.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  Normal
   Filter: All dependencies
   
🎯 NORMAL MODE PROVIDES:
   • Balanced detail level
   • Most common dependency issues
   • Good signal-to-noise ratio
`);
      notifySubscribers();
    },

    verbose: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.level = "verbose";
      console.log(`
🎛️ Dependency Tracking Control

📢 VERBOSE MODE ACTIVATED
   Detailed dependency change analysis.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  Verbose (detailed)
   Filter: All dependencies
   
🔍 VERBOSE MODE INCLUDES:
   • All dependency changes
   • Before/after value comparisons
   • Detailed change analysis
   • Hook-specific information
   
⚠️  NOTE: May produce significant console output
`);
      notifySubscribers();
    },

    debug: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.level = "debug";
      console.log(`
🎛️ Dependency Tracking Control

🐛 DEBUG MODE ACTIVATED
   Maximum detail for debugging dependency issues.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  Debug (maximum detail)
   Filter: All dependencies
   
🔍 DEBUG MODE INCLUDES:
   • Every dependency change
   • Internal hook states
   • Timing information
   • Stack traces (when relevant)
   • Performance metrics
   
⚠️  WARNING: Very verbose output - use sparingly!
`);
      notifySubscribers();
    },

    functionsOnly: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.filter = "functions-only";
      console.log(`
🎛️ Dependency Tracking Control

⚙️ FUNCTIONS FILTER ACTIVATED
   Only function/callback changes will be logged.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  ${state.dependencies.level}
   Filter: Functions only
   
🎯 FUNCTIONS FILTER TRACKS:
   • useCallback dependency changes
   • Function prop changes
   • Event handler modifications
   • Memoized function updates
   
💡 USEFUL FOR:
   • Debugging callback-related re-renders
   • Function dependency issues
`);
      notifySubscribers();
    },

    objectsOnly: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.filter = "objects-only";
      console.log(`
🎛️ Dependency Tracking Control

📦 OBJECTS FILTER ACTIVATED
   Only object/array changes will be logged.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  ${state.dependencies.level}
   Filter: Objects only
   
🎯 OBJECTS FILTER TRACKS:
   • Object prop changes
   • Array dependency modifications
   • State object updates
   • Complex data structure changes
   
💡 USEFUL FOR:
   • Debugging object reference issues
   • Tracking state mutations
`);
      notifySubscribers();
    },

    unstableOnly: () => {
      const state = getGlobalDebugState();
      state.enabled.add("dependencies");
      state.dependencies.filter = "unstable-only";
      console.log(`
🎛️ Dependency Tracking Control

⚠️ UNSTABLE FILTER ACTIVATED
   Only frequently changing dependencies will be logged.
   
📊 CURRENT SETTINGS:
   Status: ✅ Enabled
   Level:  ${state.dependencies.level}
   Filter: Unstable only
   
🎯 UNSTABLE FILTER TRACKS:
   • Dependencies that change frequently
   • Potential infinite loop sources
   • Unstable object references
   • Problematic re-renders
   
💡 IDEAL FOR:
   • Finding infinite render loops
   • Identifying parasitic activity
   • Performance debugging
`);
      notifySubscribers();
    },
  };
}
