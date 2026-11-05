import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeToDebugChanges } from "../src/debugsy-logs/hooks/debugsy-notifications";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";
import { depsSettingsControls } from "../src/debugsy-space/debugsy-space-settings";

const debugsy = getDebugsy();

/** Subscriber notifications are batched: a microtask, or up to 16 ms */
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

let logSpy: ReturnType<typeof vi.spyOn>;
let warnSpy: ReturnType<typeof vi.spyOn>;
let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  debugsy.disable("dependencies");
});

// Restored here, not at the end of a test, so a failing test leaks nothing
afterEach(() => {
  globalThis.__DEBUGSY_EMERGENCY_STOP.active = false;
  debugsy.setConsoleEnabled(true);
  depsSettingsControls.setLevel("normal");
  depsSettingsControls.setFilter("all");
  debugsy.disable("dependencies");
  vi.restoreAllMocks();
});

/** `debugsy.a.b(` in some text → ["a.b", …] */
const commandsIn = (text: string) =>
  [...text.matchAll(/debugsy\.([\w.]+)\(/g)].map((m) => m[1] as string);

/** The value at a dotted path on the debugsy global */
const lookUp = (path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (at, key) => (at as Record<string, unknown> | undefined)?.[key],
      debugsy
    );

describe("debugsy.help()", () => {
  it("names only commands that exist", () => {
    debugsy.help();
    const named = commandsIn(String(logSpy.mock.calls[0]?.[0]));

    expect(named.length).toBeGreaterThan(25);
    expect(named.filter((path) => typeof lookUp(path) !== "function")).toEqual(
      []
    );
  });

  it("names every debugsy.deps command", () => {
    debugsy.help();
    const named = commandsIn(String(logSpy.mock.calls[0]?.[0]));

    for (const command of Object.keys(debugsy.deps)) {
      expect(named).toContain(`deps.${command}`);
    }
  });

  it("runs every command it names, and they name only commands that exist", () => {
    const printed: string[] = [];
    const keep = (...args: unknown[]) => void printed.push(args.join(" "));
    for (const spy of [logSpy, warnSpy, errorSpy]) spy.mockImplementation(keep);

    // Arguments for the commands that take some
    const args: Record<string, unknown[]> = {
      "status.logs": [10],
      log: ["dependencies", "from the help test"],
      enable: ["dependencies"],
      disable: ["dependencies"],
    };

    debugsy.help();
    const named = commandsIn(printed.join("\n"));
    // help() lists activate() before deactivate(), so the stop ends off
    for (const path of named) {
      if (path === "help") continue;
      const run = lookUp(path) as (...a: unknown[]) => unknown;
      const parent = lookUp(path.split(".").slice(0, -1).join(".")) ?? debugsy;
      run.call(parent, ...(args[path] ?? []));
    }

    const unknown = commandsIn(printed.join("\n")).filter(
      (path) => typeof lookUp(path) !== "function"
    );
    expect(unknown).toEqual([]);
    expect(globalThis.__DEBUGSY_EMERGENCY_STOP.active).toBe(false);
  });
});

describe("debugsy.emergency", () => {
  it("activate() stops all logging until deactivate()", () => {
    debugsy.setConsoleEnabled(false);
    debugsy.enable("dependencies");
    const count = () => debugsy.getDebugState().logs.length;
    const before = count();

    debugsy.emergency.activate();
    debugsy.log("dependencies", "dropped");
    debugsy.warn("dependencies", "dropped too");
    expect(count()).toBe(before);

    debugsy.emergency.deactivate();
    debugsy.log("dependencies", "kept");
    expect(count()).toBe(before + 1);
  });

  it("deps commands say when the stop is on", () => {
    debugsy.emergency.activate();
    debugsy.deps.on();

    expect(logSpy).toHaveBeenLastCalledWith(
      "[debugsy] Dependency tracking on · level normal · filter all · emergency stop on: nothing is logged"
    );
  });
});

describe("debugsy.deps", () => {
  it.each([
    ["quiet", "quiet"],
    ["normal", "normal"],
    ["verbose", "verbose"],
  ] as const)("%s() turns tracking on at that level", (command, level) => {
    debugsy.deps[command]();

    expect(debugsy.getDepsSettings()).toMatchObject({ enabled: true, level });
    expect(logSpy).toHaveBeenLastCalledWith(
      `[debugsy] Dependency tracking on · level ${level} · filter all`
    );
  });

  it.each([
    ["all", "all"],
    ["functionsOnly", "functions-only"],
    ["objectsOnly", "objects-only"],
    ["unstableOnly", "unstable-only"],
  ] as const)("%s() turns tracking on with that filter", (command, filter) => {
    if (command === "all") depsSettingsControls.setFilter("objects-only");

    debugsy.deps[command]();

    expect(debugsy.getDepsSettings()).toMatchObject({ enabled: true, filter });
  });

  it("on() and off() turn tracking on and off", () => {
    debugsy.deps.on();
    expect(debugsy.isEnabled("dependencies")).toBe(true);

    debugsy.deps.off();
    expect(debugsy.isEnabled("dependencies")).toBe(false);
    expect(logSpy).toHaveBeenLastCalledWith(
      "[debugsy] Dependency tracking off · level normal · filter all"
    );
  });

  it("reset() goes back to normal and all, tracking on", () => {
    debugsy.deps.verbose();
    debugsy.deps.unstableOnly();
    debugsy.deps.off();

    debugsy.deps.reset();

    expect(debugsy.getDepsSettings()).toMatchObject({
      enabled: true,
      level: "normal",
      filter: "all",
    });
  });

  it("notifies subscribers, so an open panel follows", async () => {
    await settle();
    const listener = vi.fn();
    const unsubscribe = subscribeToDebugChanges(listener);

    debugsy.deps.quiet();
    await settle();

    expect(listener).toHaveBeenCalled();
    unsubscribe();
  });
});
