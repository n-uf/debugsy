import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { subscribeToDebugChanges } from "../src/debugsy-logs/hooks/debugsy-notifications";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";
import { depsSettingsControls } from "../src/debugsy-space/debugsy-space-settings";

const debugsy = getDebugsy();

/** Subscriber notifications are batched: a microtask, or up to 16 ms */
const settle = () => new Promise((resolve) => setTimeout(resolve, 40));

let logSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  debugsy.disable("dependencies");
});

afterEach(() => {
  depsSettingsControls.setLevel("normal");
  depsSettingsControls.setFilter("all");
  debugsy.disable("dependencies");
  logSpy.mockRestore();
});

describe("debugsy.emergency", () => {
  it("activate() stops all logging until deactivate()", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
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

    debugsy.setConsoleEnabled(true);
    warnSpy.mockRestore();
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
