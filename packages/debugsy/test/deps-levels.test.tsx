import { act } from "react";
import { createRoot } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { shouldLogLevel } from "../src/debugsy-deps/deps-filters";
import { initializationPhase } from "../src/debugsy-deps/logic/change-tracking";
import {
  useRenderTracker,
  useWhyDidYouUpdate,
} from "../src/debugsy-deps/use-deps";
import type {
  DebugLogEntry,
  DepsLogLevel,
} from "../src/debugsy-space/debugsy-constants";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";
import {
  depsSettingsControls,
  getGlobalDebugState,
} from "../src/debugsy-space/debugsy-space-settings";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Change tracking is kept per hook name and prop: every scenario uses its own.
let nameCounter = 0;
const uniqueName = () => `Deps${++nameCounter}`;

function Watched(props: { name: string; deps: Record<string, unknown> }) {
  useWhyDidYouUpdate(props.name, props.deps);
  return null;
}

function Tracked(props: { name: string; tick: number }) {
  useRenderTracker(props.name, { renderThreshold: 3, trackMounts: false });
  return null;
}

function depsLogs(): DebugLogEntry[] {
  // The global state, not getLogs(): that one is memoised by wall-clock time
  return getGlobalDebugState().logs.filter((l) => l.point === "dependencies");
}

const hasTag = (log: DebugLogEntry, tag: string) =>
  (log.tags ?? []).includes(tag);

function advanceClock(ms: number) {
  vi.setSystemTime(Date.now() + ms);
}

/**
 * One component whose function, object and primitive props change on each
 * of three renders, 200 ms apart, after the app's initialization phase. The
 * second and third changes come fast enough to count as frequent.
 */
function runChangingProps(level: DepsLogLevel): DebugLogEntry[] {
  depsSettingsControls.setLevel(level);
  getGlobalDebugState().logs = [];
  const name = uniqueName();
  const container = document.createElement("div");
  const root = createRoot(container);
  for (let i = 0; i < 4; i++) {
    const deps = { onClick: () => i, style: { gap: i }, count: i };
    act(() => root.render(<Watched name={name} deps={deps} />));
    advanceClock(200);
  }
  act(() => root.unmount());
  return depsLogs();
}

beforeAll(() => {
  getDebugsy().setConsoleEnabled(false);
});

beforeEach(() => {
  getDebugsy().enable("dependencies");
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  // Frequent changes warn only at runtime, after the initialization phase
  initializationPhase.isActive = false;
});

afterEach(() => {
  if (initializationPhase.endTimeout) {
    clearTimeout(initializationPhase.endTimeout);
    initializationPhase.endTimeout = null;
  }
  initializationPhase.isActive = true;
  depsSettingsControls.setLevel("normal");
  getDebugsy().disable("dependencies");
  getGlobalDebugState().logs = [];
  vi.useRealTimers();
});

describe("shouldLogLevel", () => {
  it.each([
    ["silent", { info: false, warn: false, error: false }],
    ["quiet", { info: false, warn: true, error: true }],
    ["normal", { info: true, warn: true, error: true }],
    ["verbose", { info: true, warn: true, error: true }],
    ["debug", { info: true, warn: true, error: true }],
  ] as const)("%s", (level, expected) => {
    depsSettingsControls.setLevel(level);
    expect({
      info: shouldLogLevel("info"),
      warn: shouldLogLevel("warn"),
      error: shouldLogLevel("error"),
    }).toEqual(expected);
  });
});

describe("dependency changes per level", () => {
  it("Normal logs each render's summary and every function and object", () => {
    const logs = runChangingProps("normal");

    expect(logs.filter((l) => hasTag(l, "dep-change"))).toHaveLength(3);
    expect(logs.filter((l) => hasTag(l, "fn-recreation"))).toHaveLength(3);
    expect(logs.filter((l) => hasTag(l, "obj-recreation"))).toHaveLength(3);
    expect(logs.filter((l) => hasTag(l, "prim-change"))).toHaveLength(0);
    expect(logs).toHaveLength(9);
  });

  it("Quiet logs only the frequent functions and objects, as warnings", () => {
    const logs = runChangingProps("quiet");

    // Change 1 is the first one seen (stable); changes 2 and 3 are frequent
    expect(logs).toHaveLength(4);
    expect(logs.every((l) => l.level === "warn")).toBe(true);
    expect(logs.every((l) => l.message.includes("⚠️ FREQUENT"))).toBe(true);
    expect(logs.filter((l) => hasTag(l, "fn-recreation"))).toHaveLength(2);
    expect(logs.filter((l) => hasTag(l, "obj-recreation"))).toHaveLength(2);
    expect(logs.some((l) => hasTag(l, "dep-change"))).toBe(false);
  });

  it("Verbose adds a line for each changed primitive", () => {
    const logs = runChangingProps("verbose");

    const prims = logs.filter((l) => hasTag(l, "prim-change"));
    expect(prims).toHaveLength(3);
    expect(prims[0]?.data).toEqual({ from: 0, to: 1 });
    expect(logs).toHaveLength(12);
  });

  it("logs less at each quieter level", () => {
    const counts = (["silent", "quiet", "normal", "verbose"] as const).map(
      (level) => runChangingProps(level).length
    );

    expect(counts).toEqual([0, 4, 9, 12]);
  });
});

describe("render warnings per level", () => {
  function renderThreeTimes(level: DepsLogLevel): DebugLogEntry[] {
    depsSettingsControls.setLevel(level);
    getGlobalDebugState().logs = [];
    const name = uniqueName();
    const container = document.createElement("div");
    const root = createRoot(container);
    for (let tick = 0; tick < 3; tick++) {
      act(() => root.render(<Tracked name={name} tick={tick} />));
      advanceClock(10_000); // past the render notifier's cooldown
    }
    act(() => root.unmount());
    return depsLogs();
  }

  it("Quiet keeps the excessive render warning", () => {
    const logs = renderThreeTimes("quiet");

    expect(logs.length).toBeGreaterThan(0);
    expect(logs.every((l) => hasTag(l, "render-warn"))).toBe(true);
    expect(logs.every((l) => l.level === "warn")).toBe(true);
  });

  it("Silent logs nothing", () => {
    expect(renderThreeTimes("silent")).toHaveLength(0);
  });
});
