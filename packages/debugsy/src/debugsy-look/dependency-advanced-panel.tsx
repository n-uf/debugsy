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
const NORMAL: LevelChoice = {
  value: "normal",
  label: "Normal",
  title: "Changed dependencies, recreated functions and objects",
  hint: "Changed dependencies, recreated functions and objects. Verbose adds changed primitive values.",
};
const LEVELS: readonly LevelChoice[] = [
  {
    value: "quiet",
    label: "Quiet",
    title: "Logs what Normal logs",
    hint: "Quiet logs what Normal logs: changed dependencies, recreated functions and objects.",
  },
  NORMAL,
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

const ALL: FilterChoice = { value: "all", label: "All", hint: "Every dependency that changed." };
const FILTERS: readonly FilterChoice[] = [
  ALL,
  { value: "functions-only", label: "Functions", hint: "Only functions recreated since the last render." },
  { value: "objects-only", label: "Objects", hint: "Only objects and arrays recreated since the last render." },
  {
    value: "unstable-only",
    label: "Unstable",
    hint: "Only dependencies that keep changing, render after render, in quick succession.",
  },
];

// Dependency log tags counted in the summary; the rest only count in the total.
const TALLY: ReadonlyArray<{ tags: readonly string[]; one: string; many: string }> = [
  { tags: ["dep-change"], one: "render with changes", many: "renders with changes" },
  { tags: ["fn-recreation"], one: "function", many: "functions" },
  { tags: ["obj-recreation"], one: "object", many: "objects" },
  { tags: ["prim-change"], one: "value", many: "values" },
  { tags: ["render-warn", "mount-warn"], one: "warning", many: "warnings" },
];

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

  const level = LEVELS.find((l) => l.value === deps.logLevel) ?? NORMAL;
  const filter = FILTERS.find((f) => f.value === deps.filter) ?? ALL;

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
    ? new Date(latest.timestamp || Date.now()).toLocaleTimeString("en-US", { hour12: false })
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
                    active={level.value === l.value}
                    ariaPressed={level.value === l.value}
                    onClick={() => pickLevel(l.value)}
                    title={l.title}
                  >
                    {l.label}
                  </Word>
                ))}
              </div>
              <p className="dbg-advanced-hint">{level.hint}</p>
            </div>

            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Changes</span>
              <div className="dbg-words" data-wrap="true" role="group" aria-label="Changes to log">
                {FILTERS.map((f) => (
                  <Word
                    key={f.value}
                    size="sm"
                    pill
                    active={filter.value === f.value}
                    ariaPressed={filter.value === f.value}
                    onClick={() => pickFilter(f.value)}
                    title={f.hint}
                  >
                    {f.label}
                  </Word>
                ))}
              </div>
              <p className="dbg-advanced-hint">{filter.hint}</p>
            </div>

            <div className="dbg-advanced-group">
              <span className="dbg-advanced-label">Logged</span>
              {!deps.enabled ? (
                <>
                  <span className="dbg-advanced-value" data-tone="dim">
                    Off
                  </span>
                  <p className="dbg-advanced-hint">
                    Nothing is logged. Turn on Deps, or pick a level or a filter.
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
                  <span className="dbg-advanced-value">
                    {logs.length} {logs.length === 1 ? "log" : "logs"}
                    {tally.map((t) => (
                      <span key={t.word} className="dbg-advanced-tally">
                        {" · "}
                        {t.n} {t.word}
                      </span>
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
