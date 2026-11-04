/**
 * Display Alert — "error with recovery" state for the Display panel.
 *
 * An alert is an ERROR-priority queue item that carries an `alert` payload.
 * While it is the top visible item, the Display renders it in alert mode:
 * two lines (title + subtitle) in the error colour, and the panel's action
 * slots are replaced by the alert's recovery actions (e.g. Retry, Details,
 * Dismiss). Removing the item restores the normal content and slots.
 *
 * Design note: ui-blocks/shared/display/_agent/display-error-recovery.md
 */

import type { ReactNode } from "react";
import { DisplayPriority } from "./display-priority";
import type { DisplayQueueItem } from "./display-queue-state";

// =============================================================================
// CHARACTER BUDGETS
// =============================================================================

/**
 * Character budget per alert line. Text up to this length renders at full
 * size; longer text is scaled down (and wraps as a last resort), never
 * truncated. Write copy to fit the budget.
 */
export const DISPLAY_ALERT_LINE_BUDGET = 32;

// =============================================================================
// TYPES
// =============================================================================

export type DisplayAlertSeverity = "error" | "warning";

/**
 * Semantic kind of a slot action. Kinds pick a default icon and colours
 * from the slot palette; `custom` uses whatever the action provides.
 */
export type DisplayAlertActionKind = "retry" | "details" | "dismiss" | "custom";

/** One recovery action, rendered in a display action slot. */
export interface DisplayAlertAction {
  /** Stable id (React key, tests). */
  id: string;
  /** Accessible name and tooltip, e.g. "Retry redaction". Required. */
  label: string;
  /** Selection handler. */
  onSelect: () => void;
  /** Kind; defaults to `custom`. */
  kind?: DisplayAlertActionKind;
  /** Slot icon; defaults by `kind`. */
  icon?: ReactNode;
  /** Slot colours; default by `kind`. */
  backgroundColor?: string;
  hoverBackgroundColor?: string;
  color?: string;
}

/** Whether a fix step is already satisfied ("ok") or not possible right now ("blocked"). */
export type DisplayAlertStepStatus = "ok" | "blocked";

/**
 * One numbered "How to fix" step in the detail banner. The owner keeps steps
 * live: re-pass the alert with the same key and updated steps (e.g. a new
 * count) and the banner updates in place without a new announcement.
 */
export interface DisplayAlertStep {
  /** Stable id (React key, tests). */
  id: string;
  /** What to do, e.g. "Lower the detection level to High". */
  title: string;
  /** Why / effect, e.g. "Keeps the most sensitive findings · about 7,900 areas". */
  hint?: string;
  /** `ok` marks the hint with a check in the success colour; `blocked` mutes it. */
  status?: DisplayAlertStepStatus;
  /** Highlight this step's button as the suggested next move. */
  recommended?: boolean;
  /**
   * Inline button. `kind: "retry"` closes the banner (like the header
   * Retry); any other kind keeps it open so live hints stay visible.
   */
  action?: DisplayAlertAction;
}

/**
 * Structured content for the built-in detail banner, from basic to guided:
 * `body` alone, then `facts`, `errorId` / `support` ("Still stuck?"), then
 * `steps` ("How to fix"). Every part is optional and renders only when set.
 */
export interface DisplayAlertDetailContent {
  /** Full sentence: what happened and what to do. */
  body?: string;
  /** Plain-language numbers, e.g. "16,606 marked areas · one pass handles 10,000". */
  facts?: string;
  /** Numbered "How to fix" steps. */
  steps?: DisplayAlertStep[];
  /**
   * Machine diagnostics (code, status, raw numbers). Not rendered: put it in
   * the support payload (e.g. the mailto) and logs. Use `facts` for people.
   */
  technical?: string;
  /** Tracking id, shown with a copy button. */
  errorId?: string;
  /** "Contact support" link (e.g. a prepared mailto). */
  support?: { href: string; label?: string };
}

export interface DisplayAlert {
  /**
   * Identity of this alert occurrence. A new key replaces the alert and is
   * announced again; the same key with new copy updates it silently.
   */
  key: string;
  /** Default `error`. */
  severity?: DisplayAlertSeverity;
  /** Line 1, uppercase mono: "ACTION FAILED · REASON". Budget: 32 chars. */
  title: string;
  /** Line 2: numbers + reassurance, e.g. "16.6k / 10k areas · marks saved". Budget: 32 chars. */
  subtitle?: string;
  /** Leading icon; defaults to a warning glyph in the alert colour. */
  icon?: ReactNode;
  /**
   * Recovery actions shown in the action slots, before the built-in Details
   * and Dismiss slots (typically one Retry). Up to 4 slots fit in total.
   */
  actions?: DisplayAlertAction[];
  /**
   * Enables the built-in Details slot. Structured content renders the
   * standard panel above the display; a ReactNode renders as-is inside it.
   */
  detail?: DisplayAlertDetailContent | ReactNode;
  /** Show the built-in Dismiss slot. Default `true`. */
  dismissible?: boolean;
  /** Called when the person dismisses (or the alert auto-clears). */
  onDismiss?: () => void;
  /**
   * Auto-clear after this many ms (calls `onDismiss`). Default: never —
   * errors with recovery stay until retried or dismissed.
   */
  autoClearMs?: number;
}

// =============================================================================
// HELPERS
// =============================================================================

export function isDisplayAlertDetailContent(
  detail: DisplayAlert["detail"],
): detail is DisplayAlertDetailContent {
  if (detail === null || typeof detail !== "object") return false;
  if (Array.isArray(detail)) return false;
  // React elements carry `$$typeof`; plain detail objects do not.
  return !("$$typeof" in detail);
}

/** Whether `detail` has anything to show. */
export function hasDisplayAlertDetail(detail: DisplayAlert["detail"]): boolean {
  if (detail === undefined || detail === null || detail === false) return false;
  if (isDisplayAlertDetailContent(detail)) {
    return Boolean(
      detail.body ||
        detail.facts ||
        detail.steps?.length ||
        detail.errorId ||
        detail.support,
    );
  }
  return true;
}

/** Queue item config for an alert (ERROR priority, sticky, never memorized). */
export function createAlertQueueItem(
  alert: DisplayAlert,
): Omit<
  DisplayQueueItem,
  "id" | "timestamp" | "timerId" | "memorized" | "memorizedAt"
> {
  const severity = alert.severity ?? "error";
  return {
    message: alert.subtitle ? `${alert.title} · ${alert.subtitle}` : alert.title,
    type: severity,
    priority: DisplayPriority.ERROR,
    mode: "progress",
    phase: "complete",
    result: "error",
    autohide: false,
    persistent: true,
    alert,
  };
}

/** The alert to render from a visible queue list (newest alert wins). */
export function selectActiveAlert(
  items: readonly DisplayQueueItem[],
): DisplayQueueItem | undefined {
  let active: DisplayQueueItem | undefined;
  for (const item of items) {
    if (!item.alert) continue;
    if (!active || item.timestamp > active.timestamp) active = item;
  }
  return active;
}
