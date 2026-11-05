/**
 * Deps Commands - debugsy.deps in the browser console
 *
 * Set the dependency tracking level and filter, as the panel's advanced
 * strip does. Every command but off() turns tracking on (the
 * "dependencies" debug point), and every one notifies subscribers, so an
 * open panel follows. On and off are saved; the level and the filter last
 * until the page reloads.
 */

import type {
  DepsFilter,
  DepsLogLevel,
} from "../../debugsy-space/debugsy-constants";
import { depsSettingsControls } from "../../debugsy-space/debugsy-space-settings";

export interface DepsCommands {
  /** Turn dependency tracking on */
  on: () => void;
  /** Turn dependency tracking off */
  off: () => void;
  /** Level quiet: warnings only */
  quiet: () => void;
  /** Level normal (the default) */
  normal: () => void;
  /** Level verbose: adds changed primitive values */
  verbose: () => void;
  /** Filter all (the default): every kind of change */
  all: () => void;
  /** Filter functions-only */
  functionsOnly: () => void;
  /** Filter objects-only */
  objectsOnly: () => void;
  /** Filter unstable-only */
  unstableOnly: () => void;
  /** Back to level normal and filter all, tracking on */
  reset: () => void;
}

/** One line with what is set now */
function printDepsSettings(): void {
  const on = depsSettingsControls.getEnabled();
  const stopped = globalThis.__DEBUGSY_EMERGENCY_STOP?.active
    ? " · emergency stop on: nothing is logged"
    : "";
  console.log(
    `[debugsy] Dependency tracking ${on ? "on" : "off"} · level ${depsSettingsControls.getLevel()} · filter ${depsSettingsControls.getFilter()}${stopped}`
  );
}

function turnOn(): void {
  if (!depsSettingsControls.getEnabled()) depsSettingsControls.setEnabled(true);
}

const setLevel = (level: DepsLogLevel) => (): void => {
  turnOn();
  depsSettingsControls.setLevel(level);
  printDepsSettings();
};

const setFilter = (filter: DepsFilter) => (): void => {
  turnOn();
  depsSettingsControls.setFilter(filter);
  printDepsSettings();
};

export function createDepsCommands(): DepsCommands {
  return {
    on: () => {
      depsSettingsControls.setEnabled(true);
      printDepsSettings();
    },
    off: () => {
      depsSettingsControls.setEnabled(false);
      printDepsSettings();
    },
    quiet: setLevel("quiet"),
    normal: setLevel("normal"),
    verbose: setLevel("verbose"),
    all: setFilter("all"),
    functionsOnly: setFilter("functions-only"),
    objectsOnly: setFilter("objects-only"),
    unstableOnly: setFilter("unstable-only"),
    reset: () => {
      turnOn();
      depsSettingsControls.setLevel("normal");
      depsSettingsControls.setFilter("all");
      printDepsSettings();
    },
  };
}
