"use client";

import { Word } from "../ui";
import React, { useState } from "react";
import type { DepsFilter, DepsLogLevel } from "../debugsy-space/debugsy-constants";
import { useDepsSettings } from "../debugsy-space/debugsy-space-settings";

export interface DependencyAdvancedPanelProps {
  className?: string;
  /** Whether to show the advanced toggle word */
  showToggle?: boolean;
  /** External control of advanced panel visibility */
  isVisible?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** @deprecated Ignored since the panel styles itself */
  theme?: unknown;
}

type Level = Extract<DepsLogLevel, "quiet" | "normal" | "verbose">;

interface LevelChoice {
  value: Level;
  label: string;
  title: string;
  hint: string;
}

// What each level logs today. The deps logger has no quieter cut for Quiet
// yet, so the copy says Quiet logs what Normal logs rather than promise one.
const LEVELS: readonly LevelChoice[] = [
  {
    value: "quiet",
    label: "Quiet",
    title: "Logs what Normal logs",
    hint: "Quiet logs what Normal logs: changed dependencies, recreated functions and objects.",
  },
  {
    value: "normal",
    label: "Normal",
    title: "Changed dependencies, recreated functions and objects",
    hint: "Changed dependencies, recreated functions and objects. Verbose adds changed primitive values.",
  },
  {
    value: "verbose",
    label: "Verbose",
    title: "Adds changed primitive values",
    hint: "Normal, plus changed primitive values with their old and new value.",
  },
];

interface FilterChoice {
  value: DepsFilter;
  label: string;
  hint: string;
}

// A change counts as Unstable once it keeps coming back within a few seconds
// (logic/change-tracking.ts, isFrequent). Unstable changes leave the Functions
// and Objects filters, so their hints say so.
const FILTERS: readonly FilterChoice[] = [
  { value: "all", label: "All", hint: "Every dependency that changed." },
  {
    value: "functions-only",
    label: "Functions",
    hint: "Recreated functions. Ones that keep changing show under Unstable instead.",
  },
  {
    value: "objects-only",
    label: "Objects",
    hint: "Recreated objects and arrays. Ones that keep changing show under Unstable instead.",
  },
  {
    value: "unstable-only",
    label: "Unstable",
    hint: "Dependencies that changed again within a few seconds, several times in a row.",
  },
];

// Dependency log tags counted in the summary; the rest only count in the total.
const TALLY: ReadonlyArray<{ tags: readonly string[]; one: string; many: string }> = [
  { tags: ["dep-change"], one: "render with changes", many: "renders with changes" },
  { tags: ["fn-recreation"], one: "function", many: "functions" },
  { tags: ["obj-recreation"], one: "object", many: "objects" },
  { tags: ["prim-change"], one: "value", many: "values" },
  { tags: ["render-warn"], one: "render warning", many: "render warnings" },
  { tags: ["mount-warn"], one: "remount warning", many: "remount warnings" },
];

// A level or filter the strip doesn't offer (silent, debug, loop-risks…) can
// still be set from code: name it instead of lighting a choice that isn't set.
const setElsewhere = (value: string) => `Set to "${value}" outside the panel. Pick one to change it.`;

const DEPS_POINT = "dependencies";

/**
 * Advanced dependency settings: the level and which changes to log, as direct
 * choices that say what they log; what has been logged so far; and the
 * console commands that exist for it.
 *
 * The panel shows it as a full-width strip above its tray while the tray's
 * Adv word is on. Turning tracking on and off stays with the tray's Deps word.
 */
export const DependencyAdvancedPanel: React.FC<DependencyAdvancedPanelProps> = ({
  className,
  showToggle = true,
  isVisible,
  onVisibilityChange,
}) => {
  const deps = useDepsSettings();
  const [internalShow, setInternalShow] = useState(false);
  const show = isVisible ?? internalShow;

  const toggle = () => {
    if (onVisibilityChange) onVisibilityChange(!show);
    else setInternalShow(!show);
  };

  // Picking a level or a filter means you want the logs: turn tracking on.
  const pickLevel = (value: Level) => {
    if (!deps.enabled) deps.enable();
    deps.setLogLevel(value);
  };
  const pickFilter = (value: DepsFilter) => {
    if (!deps.enabled) deps.enable();
    deps.setFilter(value);
  };

  const level = LEVELS.find((l) => l.value === deps.logLevel);
  const filter = FILTERS.find((f) => f.value === deps.filter);

  const logs = deps.logs;
  const counted = TALLY.map((t) => ({ ...t, n: 0 }));
  for (const log of logs) {
    const tags = log.tags ?? [];
    for (const t of counted) {
      if (t.tags.some((tag) => tags.includes(tag))) t.n++;
    }
  }
  const tally = counted
    .filter((t) => t.n > 0)
    .map((t) => ({ n: t.n, word: t.n === 1 ? t.one : t.many }));
  const latest = logs[logs.length - 1];
  const latestTime = latest
    ? new Date(latest.timestamp || Date.now()).toLocaleTimeString("en-US", { hourCycle: "h23" })
    : null;

  return (
    <>
      {showToggle && (
        <Word size="sm" pill active={show} ariaPressed={show} onClick={toggle}>
          Adv
        </Word>
      )}

      {show && (
        <section
          className={className ? `dbg-advanced ${className}` : "dbg-advanced"}
          aria-label="Dependency tracking settings"
        >
          <div className="dbg-advanced-grid">
            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Level</span>
              <div className="dbg-words" data-wrap="true" role="group" aria-label="Level">
                {LEVELS.map((l) => (
                  <Word
                    key={l.value}
                    size="sm"
                    pill
                    active={level?.value === l.value}
                    ariaPressed={level?.value === l.value}
                    onClick={() => pickLevel(l.value)}
                    title={l.title}
                  >
                    {l.label}
                  </Word>
                ))}
              </div>
              <p className="dbg-advanced-hint">{level?.hint ?? setElsewhere(deps.logLevel)}</p>
            </div>

            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Changes</span>
              <div className="dbg-words" data-wrap="true" role="group" aria-label="Changes to log">
                {FILTERS.map((f) => (
                  <Word
                    key={f.value}
                    size="sm"
                    pill
                    active={filter?.value === f.value}
                    ariaPressed={filter?.value === f.value}
                    onClick={() => pickFilter(f.value)}
                    title={f.hint}
                  >
                    {f.label}
                  </Word>
                ))}
              </div>
              <p className="dbg-advanced-hint">{filter?.hint ?? setElsewhere(deps.filter)}</p>
            </div>

            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Logged</span>
              {!deps.enabled ? (
                <>
                  <span className="dbg-advanced-value" data-tone="dim">
                    Off
                  </span>
                  <p className="dbg-advanced-hint">
                    Nothing new is logged. Turn on Deps, or pick a level or a filter.
                  </p>
                </>
              ) : logs.length === 0 ? (
                <>
                  <span className="dbg-advanced-value">0 logs</span>
                  <p className="dbg-advanced-hint">
                    From components that call <code>useWhyDidYouUpdate</code> or{" "}
                    <code>useRenderTracker</code>.
                  </p>
                </>
              ) : (
                <>
                  {/* Lines break only between items, never inside "2 functions" */}
                  <span className="dbg-advanced-value">
                    <span className="dbg-advanced-item">
                      {logs.length} {logs.length === 1 ? "log" : "logs"}
                    </span>
                    {tally.map((t) => (
                      <React.Fragment key={t.word}>
                        {" "}
                        <span className="dbg-advanced-item dbg-advanced-tally">
                          · {t.n} {t.word}
                        </span>
                      </React.Fragment>
                    ))}
                  </span>
                  <p className="dbg-advanced-hint">Latest at {latestTime}.</p>
                </>
              )}
            </div>

            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Console</span>
              <code className="dbg-advanced-code" title="Click to select">
                {deps.enabled ? `debugsy.disable("${DEPS_POINT}")` : `debugsy.enable("${DEPS_POINT}")`}
              </code>
              <code className="dbg-advanced-code" title="Click to select">
                debugsy.status.deps()
              </code>
            </div>
          </div>
        </section>
      )}
    </>
  );
};
