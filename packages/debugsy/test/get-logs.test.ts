import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerModule } from "../src/config";
import { MAX_STORED_LOGS } from "../src/debugsy-space/debugsy-constants";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";

/**
 * getLogs() reuses one copy for repeated reads within a frame (16 ms), but
 * never past a change: a subscriber that re-renders right after a clear or a
 * new line must read the log as it is now. Date is frozen, so every read
 * below falls inside one frame.
 */
const dsy = getDebugsy();

registerModule("memo", {
  label: "Memo",
  emoji: "🧪",
  description: "getLogs tests",
  points: {
    probe: { emoji: "🧪", label: "Probe", description: "Test lines" },
  },
});

const logLines = (count: number) => {
  for (let i = 0; i < count; i++) dsy.log("probe", `line ${i}`);
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.spyOn(console, "log").mockImplementation(() => {});
  dsy.enable("probe");
  dsy.clearLogs();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("getLogs within one frame", () => {
  it("is empty right after a clear", () => {
    logLines(5);
    expect(dsy.getLogs()).toHaveLength(5);

    dsy.clearLogs();
    expect(dsy.getLogs()).toHaveLength(0);
  });

  it("has a new line at once", () => {
    logLines(5);
    expect(dsy.getLogs()).toHaveLength(5);

    dsy.log("probe", "one more");
    const logs = dsy.getLogs();
    expect(logs).toHaveLength(6);
    expect(logs[logs.length - 1]?.message).toBe("one more");
  });

  it("has a new line at once when the log is full and keeps its length", () => {
    logLines(MAX_STORED_LOGS);
    expect(dsy.getLogs()).toHaveLength(MAX_STORED_LOGS);

    dsy.log("probe", "one more");
    const logs = dsy.getLogs();
    expect(logs).toHaveLength(MAX_STORED_LOGS);
    expect(logs[0]?.message).toBe("line 1");
    expect(logs[logs.length - 1]?.message).toBe("one more");
  });

  it("returns the same copy while nothing changes", () => {
    logLines(3);
    const first = dsy.getLogs();
    expect(dsy.getLogs()).toBe(first);
  });
});
