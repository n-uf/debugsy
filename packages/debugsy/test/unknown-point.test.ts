import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerModule } from "../src/config";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";

const nextMicrotask = () => new Promise<void>((resolve) => queueMicrotask(resolve));

let warn: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  warn = vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  warn.mockRestore();
});

describe("logging to a point no module registered", () => {
  it("warns once per key in development", async () => {
    const dsy = getDebugsy();
    dsy.warn("auth.session", "Session expired");
    dsy.log("auth.session", "Session expired again");
    await nextMicrotask();
    dsy.error("auth.session", "Still expired");
    await nextMicrotask();

    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0]![0])).toContain('"auth.session"');
  });

  it("stays quiet for a registered point that is off", async () => {
    registerModule("checkout", {
      label: "Checkout",
      emoji: "🛒",
      description: "Cart and payment",
      points: {
        cart: { emoji: "🛒", label: "Cart", description: "Cart changes" },
      },
    });

    getDebugsy().log("cart", "Item added");
    await nextMicrotask();

    expect(warn).not.toHaveBeenCalled();
  });

  it("stays quiet when the module registers right after the call", async () => {
    getDebugsy().log("upload", "Started");
    registerModule("files", {
      label: "Files",
      emoji: "📁",
      description: "File uploads",
      points: {
        upload: { emoji: "⬆️", label: "Upload", description: "Upload progress" },
      },
    });
    await nextMicrotask();

    expect(warn).not.toHaveBeenCalled();
  });

  it("stays quiet for an unregistered point that was turned on", async () => {
    const dsy = getDebugsy();
    dsy.setConsoleEnabled(false);
    dsy.enable("adhoc");
    dsy.log("adhoc", "Logged");
    await nextMicrotask();

    expect(warn).not.toHaveBeenCalled();
    expect(dsy.getLogs().some((entry) => entry.point === "adhoc")).toBe(true);
    dsy.disable("adhoc");
  });
});
