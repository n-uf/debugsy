import { act, Activity, Fragment, StrictMode, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { DEPS_CONFIG_DEFAULTS } from "../src/debugsy-deps/deps-config";
import {
  useRenderTracker,
  type RenderRateInfo,
  type RenderTrackerOptions,
} from "../src/debugsy-deps/use-deps";
import { getDebugsy } from "../src/debugsy-space/debugsy-space";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

// Remount counts are shared per component name: every test uses its own.
let nameCounter = 0;
const uniqueName = () => `Tracked${++nameCounter}`;

let container: HTMLDivElement;
let root: Root;

function render(ui: ReactNode) {
  act(() => root.render(ui));
}

function Tracked(props: {
  name: string;
  options: RenderTrackerOptions;
  tick?: number;
}) {
  useRenderTracker(props.name, props.options);
  return null;
}

function TrackedPositional(props: {
  name: string;
  onExcessiveRenders: (info: RenderRateInfo) => void;
  tick?: number;
}) {
  useRenderTracker(props.name, undefined, props.onExcessiveRenders);
  return null;
}

beforeAll(() => {
  getDebugsy().setConsoleEnabled(false);
});

beforeEach(() => {
  getDebugsy().enable("dependencies");
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  getDebugsy().disable("dependencies");
  vi.useRealTimers();
});

/** Fakes Date only: React's scheduler keeps its real timers */
function fakeClock() {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-03T12:00:00Z"));
}

function advanceClock(ms: number) {
  vi.setSystemTime(Date.now() + ms);
}

describe("useRenderTracker options form", () => {
  it("counts renders without trackRenders: true", () => {
    const name = uniqueName();
    const onExcessiveRenders = vi.fn();
    const options = { renderThreshold: 3, onExcessiveRenders };

    for (let tick = 0; tick < 3; tick++) {
      render(<Tracked name={name} options={options} tick={tick} />);
    }

    expect(onExcessiveRenders).toHaveBeenCalledTimes(1);
    expect(onExcessiveRenders.mock.calls[0]![0]).toMatchObject({
      renderCount: 3,
      threshold: 3,
      isExcessive: true,
    });
  });

  it("counts remounts without trackMounts: true", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };

    render(<Tracked key="a" name={name} options={options} />);
    render(<Tracked key="b" name={name} options={options} />);

    expect(onExcessiveMounts).toHaveBeenCalledTimes(1);
  });

  it("counts nothing with trackRenders: false and trackMounts: false", () => {
    const name = uniqueName();
    const onExcessiveRenders = vi.fn();
    const onExcessiveMounts = vi.fn();
    const options = {
      renderThreshold: 1,
      mountThreshold: 1,
      trackRenders: false,
      trackMounts: false,
      onExcessiveRenders,
      onExcessiveMounts,
    };

    for (let key = 0; key < 3; key++) {
      render(<Tracked key={key} name={name} options={options} />);
    }

    expect(onExcessiveRenders).not.toHaveBeenCalled();
    expect(onExcessiveMounts).not.toHaveBeenCalled();
  });

  it("counts nothing while the dependencies point is off", () => {
    getDebugsy().disable("dependencies");
    const name = uniqueName();
    const onExcessiveRenders = vi.fn();
    const onExcessiveMounts = vi.fn();
    const options = {
      renderThreshold: 1,
      mountThreshold: 1,
      onExcessiveRenders,
      onExcessiveMounts,
    };

    for (let key = 0; key < 3; key++) {
      render(<Tracked key={key} name={name} options={options} />);
    }

    expect(onExcessiveRenders).not.toHaveBeenCalled();
    expect(onExcessiveMounts).not.toHaveBeenCalled();
  });
});

describe("useRenderTracker default render threshold", () => {
  it("is 10, from DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold", () => {
    expect(DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold).toBe(10);

    const name = uniqueName();
    const onExcessiveRenders = vi.fn();
    const options = { onExcessiveRenders };

    for (let tick = 0; tick < 9; tick++) {
      render(<Tracked name={name} options={options} tick={tick} />);
    }
    expect(onExcessiveRenders).not.toHaveBeenCalled();

    render(<Tracked name={name} options={options} tick={9} />);
    expect(onExcessiveRenders).toHaveBeenCalledTimes(1);
    expect(onExcessiveRenders.mock.calls[0]![0]).toMatchObject({
      renderCount: 10,
      threshold: 10,
    });
  });

  it("is the same in the positional form", () => {
    const name = uniqueName();
    const onExcessiveRenders = vi.fn();

    for (let tick = 0; tick < 10; tick++) {
      render(
        <TrackedPositional
          name={name}
          onExcessiveRenders={onExcessiveRenders}
          tick={tick}
        />
      );
    }

    expect(onExcessiveRenders).toHaveBeenCalledTimes(1);
    expect(onExcessiveRenders.mock.calls[0]![0]).toMatchObject({
      renderCount: 10,
      threshold: 10,
    });
  });

  it("follows the config value", () => {
    const configured = DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold;
    DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold = 4;
    try {
      const name = uniqueName();
      const onExcessiveRenders = vi.fn();
      const options = { onExcessiveRenders };

      for (let tick = 0; tick < 4; tick++) {
        render(<Tracked name={name} options={options} tick={tick} />);
      }

      expect(onExcessiveRenders).toHaveBeenCalledTimes(1);
      expect(onExcessiveRenders.mock.calls[0]![0]).toMatchObject({
        renderCount: 4,
        threshold: 4,
      });
    } finally {
      DEPS_CONFIG_DEFAULTS.renderRateDefaultThreshold = configured;
    }
  });
});

describe("useRenderTracker remount count", () => {
  it("adds up remounts across instances of one name", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { onExcessiveMounts }; // default mountThreshold: 3

    render(<Tracked key={0} name={name} options={options} />);
    render(<Tracked key={1} name={name} options={options} />);
    render(<Tracked key={2} name={name} options={options} />);
    expect(onExcessiveMounts).not.toHaveBeenCalled();

    render(<Tracked key={3} name={name} options={options} />);
    expect(onExcessiveMounts).toHaveBeenCalledTimes(1);
    expect(onExcessiveMounts.mock.calls[0]![0]).toMatchObject({
      mountCount: 3,
      threshold: 3,
      isExcessive: true,
      alertsTriggered: 1,
    });
  });

  it("catches a component its parent re-creates on every render", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();

    function Parent(_props: { tick: number }) {
      // A new component type each render: React remounts it every time.
      const Inner = () => {
        useRenderTracker(name, { onExcessiveMounts });
        return null;
      };
      // eslint-disable-next-line react-hooks/static-components -- the bug under test
      return <Inner />;
    }

    for (let tick = 0; tick < 7; tick++) {
      render(<Parent tick={tick} />);
    }

    // 6 remounts, threshold 3: two warnings
    expect(onExcessiveMounts).toHaveBeenCalledTimes(2);
    expect(onExcessiveMounts.mock.calls[1]![0]).toMatchObject({
      mountCount: 3,
      alertsTriggered: 2,
    });
  });

  it("doesn't count instances on screen together", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };

    render(
      <Fragment>
        {[0, 1, 2, 3, 4].map((row) => (
          <Tracked key={row} name={name} options={options} />
        ))}
      </Fragment>
    );

    expect(onExcessiveMounts).not.toHaveBeenCalled();
  });

  it("doesn't count Strict Mode's second mount", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };

    render(
      <StrictMode>
        <Tracked key="a" name={name} options={options} />
      </StrictMode>
    );
    expect(onExcessiveMounts).not.toHaveBeenCalled();

    render(
      <StrictMode>
        <Tracked key="b" name={name} options={options} />
      </StrictMode>
    );
    expect(onExcessiveMounts).toHaveBeenCalledTimes(1);
    expect(onExcessiveMounts.mock.calls[0]![0]).toMatchObject({
      mountCount: 1,
    });
  });

  it("starts counting again after 5 seconds without a remount", () => {
    expect(DEPS_CONFIG_DEFAULTS.mountRateResetMs).toBe(5000);
    fakeClock();
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 2, onExcessiveMounts };

    render(<Tracked key={0} name={name} options={options} />);
    render(<Tracked key={1} name={name} options={options} />); // remount 1
    advanceClock(6000);
    render(<Tracked key={2} name={name} options={options} />); // new run: 1
    expect(onExcessiveMounts).not.toHaveBeenCalled();

    advanceClock(1000);
    render(<Tracked key={3} name={name} options={options} />); // 2
    expect(onExcessiveMounts).toHaveBeenCalledTimes(1);
    expect(onExcessiveMounts.mock.calls[0]![0]).toMatchObject({
      mountCount: 2,
    });
  });

  it("pairs a mount only with a recent unmount", () => {
    fakeClock();
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };

    // Opened again long after it closed: not a remount
    render(<Tracked name={name} options={options} />);
    render(null);
    advanceClock(6000);
    render(<Tracked name={name} options={options} />);
    expect(onExcessiveMounts).not.toHaveBeenCalled();

    // Closed and opened again at once: a remount
    render(null);
    render(<Tracked name={name} options={options} />);
    expect(onExcessiveMounts).toHaveBeenCalledTimes(1);
  });

  it("ignores an unmount while the dependencies point is off", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };

    render(<Tracked name={name} options={options} />);
    getDebugsy().disable("dependencies");
    render(null);
    getDebugsy().enable("dependencies");
    render(<Tracked name={name} options={options} />);

    expect(onExcessiveMounts).not.toHaveBeenCalled();
  });

  it("doesn't count an <Activity> shown again", () => {
    const name = uniqueName();
    const onExcessiveMounts = vi.fn();
    const options = { mountThreshold: 1, onExcessiveMounts };
    const tree = (mode: "visible" | "hidden") => (
      <Activity mode={mode}>
        <Tracked name={name} options={options} />
      </Activity>
    );

    render(tree("visible"));
    render(tree("hidden"));
    render(tree("visible"));
    render(tree("hidden"));
    render(tree("visible"));

    expect(onExcessiveMounts).not.toHaveBeenCalled();
  });
});
