import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The `debugsy` console command (globalThis.debugsy) is a window onto the page's one debug space, which lives
 * under a Symbol.for key: on in development, off in production builds, switched by exposeConsole. Every copy of
 * debugsy on the page (both entries, a duplicate in another bundle, an HMR reload) shares the space and the
 * switch. Each test loads fresh copies of the modules (vi.resetModules), as a second bundle would.
 */
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const SPACE_KEY = Symbol.for("@n-uf/debugsy");
const CONSOLE_KEY = Symbol.for("@n-uf/debugsy/console");
const SHOWN_KEY = Symbol.for("@n-uf/debugsy/shown");
const holder = globalThis as unknown as Record<symbol, unknown>;
const nodeEnv = process.env.NODE_ENV;

type Core = typeof import("../core");

/** A fresh copy of the core entry, as another bundle on the page would load it */
async function loadCore(): Promise<Core> {
  vi.resetModules();
  return import("../core");
}

function resetPage(): void {
  delete holder[SPACE_KEY];
  delete holder[CONSOLE_KEY];
  delete holder[SHOWN_KEY];
  delete globalThis.debugsy;
}

beforeEach(() => {
  resetPage();
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterEach(() => {
  if (nodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = nodeEnv;
  vi.restoreAllMocks();
  resetPage();
});

describe("the console command's default", () => {
  it("is on in development", async () => {
    process.env.NODE_ENV = "development";
    const core = await loadCore();
    expect(globalThis.debugsy).toBe(core.getDebugsy());
  });

  it("is off in a production build, with logging still working", async () => {
    process.env.NODE_ENV = "production";
    const core = await loadCore();
    expect(globalThis.debugsy).toBeUndefined();
    expect("debugsy" in globalThis).toBe(false);

    core.registerModule("console-off", {
      label: "Console off",
      emoji: "🧪",
      description: "console command tests",
      points: { "console-probe": { emoji: "🧪", label: "Probe", description: "Test lines" } },
    });
    const space = core.getDebugsy();
    space.setConsoleEnabled(false);
    space.enable("console-probe");
    space.log("console-probe", "logged with the console command off");
    expect(space.getLogs().map((e) => e.message)).toContain("logged with the console command off");
    expect(core.dsy).toBe(space);
  });
});

describe("exposeConsole", () => {
  it("puts the space on the page and takes it off again", async () => {
    process.env.NODE_ENV = "production";
    const core = await loadCore();
    core.exposeConsole(true);
    expect(globalThis.debugsy).toBe(core.getDebugsy());
    core.exposeConsole(false);
    expect(globalThis.debugsy).toBeUndefined();
    core.exposeConsole(false);
    expect(globalThis.debugsy).toBeUndefined();
  });

  it("holds through a re-initialisation (HMR, another copy loading later)", async () => {
    process.env.NODE_ENV = "development";
    const first = await loadCore();
    first.exposeConsole(false);
    const second = await loadCore();
    expect(globalThis.debugsy).toBeUndefined();
    second.exposeConsole(true);
    expect(globalThis.debugsy).toBe(first.getDebugsy());
  });

  it("holds through a re-initialisation in the same copy (HMR), showing the new space", async () => {
    process.env.NODE_ENV = "production";
    const core = await loadCore();
    core.exposeConsole(true);
    const before = core.getDebugsy();
    core.initializeUnifiedDebugSystem();
    expect(core.getDebugsy()).not.toBe(before);
    expect(globalThis.debugsy).toBe(core.getDebugsy());
  });

  it("never removes a debugsy global that isn't debugsy's", async () => {
    process.env.NODE_ENV = "production";
    const core = await loadCore();
    const theirs = { mine: true } as unknown as typeof globalThis.debugsy;
    globalThis.debugsy = theirs;
    core.exposeConsole(false);
    core.initializeUnifiedDebugSystem();
    expect(globalThis.debugsy).toBe(theirs);
  });
});

describe("two copies of debugsy on one page", () => {
  it("share one space through the Symbol key, as globalThis.debugsy did", async () => {
    process.env.NODE_ENV = "production";
    const a = await loadCore();
    const b = await loadCore();
    expect(a.getDebugsy).not.toBe(b.getDebugsy); // two module copies
    expect(a.getDebugsy()).toBe(b.getDebugsy());
    expect(holder[SPACE_KEY]).toBe(a.getDebugsy());
  });

  it("the root entry of one copy and the core of another share it too", async () => {
    process.env.NODE_ENV = "production";
    const core = await loadCore();
    vi.resetModules();
    const root = await import("../index");
    expect(root.getDebugsy()).toBe(core.getDebugsy());
    root.exposeConsole(true);
    expect(globalThis.debugsy).toBe(core.getDebugsy());
  });
});

describe("the panel with the console command off", () => {
  it("renders and reads the space", async () => {
    process.env.NODE_ENV = "production";
    vi.resetModules();
    const root = await import("../index");
    expect(globalThis.debugsy).toBeUndefined();
    const host = document.createElement("div");
    document.body.append(host);
    const reactRoot = createRoot(host);
    await act(async () => {
      reactRoot.render(<root.DebugsyLook initialVisible />);
    });
    expect(host.innerHTML).not.toBe("");
    expect(globalThis.debugsy).toBeUndefined();
    await act(async () => reactRoot.unmount());
    host.remove();
  });
});
