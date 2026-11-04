import type React from "react";

/**
 * off: unlit. on: lit (LED). partial: half lit (some of a group on).
 * ok / warn: a finished or warning state. busy: blinking. alert: caution.
 */
export type LampState = "off" | "on" | "partial" | "ok" | "warn" | "busy" | "alert";

/** 7px status lamp, from kavun */
export const Lamp: React.FC<{ state: LampState; title?: string }> = ({ state, title }) => (
  <span
    className="dbg-lamp"
    data-state={state}
    title={title}
    role={title ? "img" : undefined}
    aria-label={title}
    aria-hidden={title ? undefined : true}
  />
);

/** A row of tiny LED segments: a level (lit up to one) or a choice (one lit) */
export const Segments: React.FC<{ lit: readonly boolean[] }> = ({ lit }) => (
  <span className="dbg-segs" aria-hidden>
    {lit.map((on, i) => (
      <i key={i} data-on={on ? "true" : undefined} />
    ))}
  </span>
);

export type MeterTone = "led" | "ok" | "warn" | "caution";

export interface MeterProps {
  /** 0..100; undefined = indeterminate sweep */
  value?: number;
  tone?: MeterTone;
  width?: number | string;
  label?: string;
  className?: string;
}

/** 3px glowing bar, from kavun */
export const Meter: React.FC<MeterProps> = ({ value, tone, width = "100%", label, className }) => {
  const indeterminate = value === undefined;
  const clamped = Math.max(0, Math.min(100, value ?? 0));
  return (
    <span
      className={className ? `dbg-meter ${className}` : "dbg-meter"}
      data-tone={tone && tone !== "led" ? tone : undefined}
      data-indeterminate={indeterminate ? "true" : undefined}
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped)}
      style={{ width }}
    >
      <i style={{ width: `${clamped}%` }} />
    </span>
  );
};
