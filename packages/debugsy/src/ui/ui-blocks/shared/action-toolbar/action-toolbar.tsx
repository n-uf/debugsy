"use client";

import React from "react";
import { Word, type WordTone } from "../../../primitives/word";

export interface ActionButton {
  /** The word, e.g. "COPY" */
  label: string;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: WordTone;
  active?: boolean;
  /** 0..100: an LED fill along the word's bottom edge */
  progress?: number;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export interface DepthControl<T extends string = string> {
  value: T;
  options: readonly T[];
  onChange: (value: T) => void;
  getDescription: (value: T) => string;
  /** Lit segments for a value */
  getSegments: (value: T) => readonly boolean[];
}

export interface ActionToolbarProps<TDepth extends string = string> {
  actions: readonly ActionButton[];
  depthControl?: DepthControl<TDepth>;
}

/**
 * The action rail beside the logs: a column of words (copy, pause,
 * snapshot) under a depth control that cycles on click.
 */
export const ActionToolbar = <TDepth extends string = string>({
  actions,
  depthControl,
}: ActionToolbarProps<TDepth>): React.ReactElement => {
  const cycleDepth = (): void => {
    if (!depthControl) return;
    const i = depthControl.options.indexOf(depthControl.value);
    const next = depthControl.options[(i + 1) % depthControl.options.length];
    if (next !== undefined) depthControl.onChange(next);
  };

  return (
    <div className="dbg-actions">
      {depthControl && (
        <div className="dbg-depth">
          <span className="dbg-depth-label">Depth</span>
          <Word
            size="sm"
            block
            align="center"
            segments={depthControl.getSegments(depthControl.value)}
            onClick={cycleDepth}
            title={`Copy depth: ${depthControl.getDescription(depthControl.value)} (click to cycle)`}
            ariaLabel={`Copy depth: ${depthControl.getDescription(depthControl.value)}`}
            className="dbg-depth-word"
          >
            {depthControl.value}
          </Word>
        </div>
      )}
      {actions.map((action) => (
        <Word
          key={action.label}
          size="sm"
          block
          align="center"
          tone={action.tone}
          active={action.active}
          disabled={action.disabled}
          progress={action.progress}
          onClick={action.onClick}
          onMouseEnter={action.onMouseEnter}
          onMouseLeave={action.onMouseLeave}
          title={action.title}
        >
          {action.label}
        </Word>
      ))}
    </div>
  );
};

ActionToolbar.displayName = "ActionToolbar";
