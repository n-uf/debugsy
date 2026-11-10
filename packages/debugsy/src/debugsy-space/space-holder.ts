/**
 * Where the page's one debug space lives, and whether the console command shows it.
 *
 * The space sits under a `Symbol.for` key on globalThis, so every copy of debugsy on the page finds the same one:
 * the root and core entries, a duplicate copy in another bundle, a copy reloaded by HMR. The console command
 * (`globalThis.debugsy`) is only a window onto it, put there by `exposeConsole`. Leaving the command off keeps
 * the log out of casual reach, not out of reach: anyone with the page open can still find the space by its key.
 * No imports: the CLI commands read the space from here without an import cycle.
 */
import type { DebugsySpaceWithCLI } from "./debugsy-space";

const SPACE_KEY = Symbol.for("@n-uf/debugsy");
const CONSOLE_KEY = Symbol.for("@n-uf/debugsy/console");
/** The space debugsy last put on globalThis.debugsy, so taking it off never removes someone else's value */
const SHOWN_KEY = Symbol.for("@n-uf/debugsy/shown");

interface Holder {
  [SPACE_KEY]?: DebugsySpaceWithCLI;
  [CONSOLE_KEY]?: boolean;
  [SHOWN_KEY]?: DebugsySpaceWithCLI;
}

const holder = globalThis as unknown as Holder;

/** The page's debug space, if a copy of debugsy has made it */
export function readSpace(): DebugsySpaceWithCLI | undefined {
  return holder[SPACE_KEY];
}

export function writeSpace(space: DebugsySpaceWithCLI): void {
  holder[SPACE_KEY] = space;
}

/** Whether the console command should show: the app's last exposeConsole call, else `fallback` */
export function consoleExposed(fallback: boolean): boolean {
  return holder[CONSOLE_KEY] ?? fallback;
}

export function rememberConsoleExposed(on: boolean): void {
  holder[CONSOLE_KEY] = on;
}

/** Puts the console command on the page (the space as it is now) or takes it off */
export function applyConsole(on: boolean): void {
  const space = readSpace();
  if (on && space) {
    globalThis.debugsy = space;
    holder[SHOWN_KEY] = space;
    return;
  }
  const shown = globalThis.debugsy;
  if (shown !== undefined && (shown === holder[SHOWN_KEY] || shown === space)) delete globalThis.debugsy;
  delete holder[SHOWN_KEY];
}
