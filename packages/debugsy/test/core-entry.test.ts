import { describe, expect, it } from "vitest";
import * as core from "../core";
import * as root from "../index";

/**
 * `@n-uf/debugsy/core`: logging without the panel. The root re-exports all
 * of it, and both share one state, so a panel loaded from the root shows
 * what code logged through the core. (The built package is checked the same
 * way by scripts/check-dist.mjs, chunks included.)
 */
describe("the core entry", () => {
  it("has dsy, the module registry and the hooks, and no panel", () => {
    expect(typeof core.dsy).toBe("object");
    expect(typeof core.registerModule).toBe("function");
    expect(typeof core.useDebugsy).toBe("function");
    expect(typeof core.useRenderTracker).toBe("function");
    expect(typeof core.useWhyDidYouUpdate).toBe("function");
    expect("DebugsyLook" in core).toBe(false);
    expect("ModuleNav" in core).toBe(false);
  });

  it("shares the root's state: the same dsy and the same registry", () => {
    expect(core.dsy).toBe(root.dsy);
    expect(core.getDebugsy()).toBe(root.getDebugsy());
    expect(core.registerModule).toBe(root.registerModule);
  });

  it("is a subset of the root: every core export is the root's", () => {
    const rootExports = root as Record<string, unknown>;
    for (const [name, value] of Object.entries(core)) {
      expect(rootExports[name], name).toBe(value);
    }
  });
});
