"use client";

import React from "react";
import { Lamp, Segments, type LampState } from "./lamp";

export type WordTone = "led" | "caution" | "warn";

export interface WordProps {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  /** Current choice: brighter, with an LED mark (or a pill with `pill`) */
  active?: boolean;
  /** Show the active state as a caution-pink outline pill */
  pill?: boolean;
  /** Accent the word itself */
  tone?: WordTone;
  /** "button": kavun's tinted command button */
  variant?: "word" | "button";
  size?: "sm" | "md";
  /** Fill its cell (in a grid or a column) */
  block?: boolean;
  align?: "start" | "center";
  disabled?: boolean;
  /** Working: the word breathes */
  busy?: boolean;
  /** Brief failure flash (caution fill) */
  flash?: boolean;
  /** 0..100: a thin LED fill along the bottom edge */
  progress?: number;
  /** Count after the word */
  count?: number;
  /** New data: a blinking LED dot */
  signal?: boolean;
  /** A status lamp before the word */
  lamp?: LampState;
  /** LED segments before the word (a level or a choice) */
  segments?: readonly boolean[];
  /** Any other indicator before the word */
  indicator?: React.ReactNode;
  title?: string;
  ariaLabel?: string;
  ariaPressed?: boolean;
  onPointerDown?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerUp?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onPointerLeave?: (event: React.PointerEvent<HTMLButtonElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * The control: an engraved word (kavun's Word). Commands are words, not
 * icons, so every action reads as what it does.
 */
export const Word = React.forwardRef<HTMLButtonElement, WordProps>(function Word(
  {
    children,
    onClick,
    active,
    pill,
    tone,
    variant = "word",
    size,
    block,
    align,
    disabled,
    busy,
    flash,
    progress,
    count,
    signal,
    lamp,
    segments,
    indicator,
    title,
    ariaLabel,
    ariaPressed,
    onPointerDown,
    onPointerUp,
    onPointerLeave,
    onMouseEnter,
    onMouseLeave,
    className,
    style,
  },
  ref,
) {
  const hasIndicator = lamp !== undefined || segments !== undefined || indicator !== undefined;
  return (
    <button
      ref={ref}
      type="button"
      className={className ? `dbg-word ${className}` : "dbg-word"}
      style={style}
      data-active={active ? "true" : undefined}
      data-pill={pill ? "true" : undefined}
      data-tone={tone}
      data-variant={variant === "button" ? "button" : undefined}
      data-size={size === "sm" ? "sm" : undefined}
      data-block={block ? "true" : undefined}
      data-align={align === "center" ? "center" : undefined}
      data-busy={busy ? "true" : undefined}
      data-flash={flash ? "true" : undefined}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerLeave}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {lamp !== undefined && <Lamp state={lamp} />}
      {segments !== undefined && <Segments lit={segments} />}
      {indicator}
      <span className="dbg-word-label">{children}</span>
      {progress !== undefined && (
        <span
          className="dbg-fill"
          aria-hidden
          style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
        />
      )}
      {count !== undefined && <span className="dbg-count">{count}</span>}
      {signal && <span className="dbg-signal" aria-hidden />}
      {active && !pill && !hasIndicator && <span className="dbg-mark" aria-hidden />}
    </button>
  );
});

/** Hairline between word groups */
export const WordDivider: React.FC = () => <span className="dbg-divider" aria-hidden />;
