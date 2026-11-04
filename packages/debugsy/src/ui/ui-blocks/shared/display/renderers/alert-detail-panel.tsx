"use client";

/**
 * AlertDetailPanel - the display alert's Details panel (concept C banner).
 *
 * A deep-red banner portalled to `document.body` at `Z_INDEX.FLOATING_PANEL`
 * (UI chrome, above content and interaction layers), so the footer layout
 * never shifts. When
 * the display sits in a harbuz `Tray` (`data-harbuz-tray`) it docks on top
 * of the tray, spanning its full width; elsewhere it floats above the
 * display (480-720px wide) and flips below when there is no room above.
 *
 * Row 1: icon | TITLE | full sentence | error id | actions (Retry) | x.
 * Row 2 (muted): technical numbers, Copy error ID, Contact support.
 * Everything is shown at once (no nested Details). The x only closes the
 * banner; the alert stays in the display, whose own x dismisses it.
 *
 * Accessibility: `role="dialog"` labelled by the title. Focus moves into it
 * on open and back to the Details slot on close (Escape, x, Tab out). A
 * click outside closes it. It never carries `role="alert"`; the display's
 * alert region is the only live announcement.
 */

import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  isDisplayAlertDetailContent,
  type DisplayAlert,
  type DisplayAlertAction,
  type DisplayAlertStep,
} from "../../../../patterns/display-system/display-alert";
import {
  alertBannerLayout,
  useDisplayAlertBannerConfig,
  type DisplayAlertBannerConfig,
} from "../alert-banner-config";
import { DISPLAY_ALERT_BANNER } from "../display-helpers";
import { Z_INDEX } from "../../../../tokens/z-index";
import {
  AlertCheckIcon,
  AlertCopyIcon,
  AlertDetailsIcon,
  AlertDismissIcon,
  AlertMailIcon,
  AlertRetryIcon,
  AlertWarningIcon,
} from "./alert-icons";

export interface AlertDetailPanelProps {
  alert: DisplayAlert;
  /** Element the panel is anchored to (the display panel). */
  anchorRef: React.RefObject<HTMLElement | null>;
  /** Element that opened it (focus returns here on close). */
  returnFocusRef: React.RefObject<HTMLElement | null>;
  /** `id` for the dialog (target of the Details slot's `aria-controls`). */
  id: string;
  /** Close the panel (the alert stays). */
  onClose: () => void;
  /** Dock, breakpoints and labels (overrides `DisplayAlertBannerProvider`). */
  config?: DisplayAlertBannerConfig;
}

/** Space between the display's top edge and the panel's bottom edge. */
export const ALERT_PANEL_GAP = 8;
/** Minimum distance from the viewport edges. */
export const ALERT_PANEL_VIEWPORT_MARGIN = 16;
export const ALERT_PANEL_MIN_WIDTH = 480;
export const ALERT_PANEL_MAX_WIDTH = 720;
const COPIED_FEEDBACK_MS = 2000;

interface Position {
  left: number;
  width: number;
  /** Set when the panel sits above the display. */
  bottom?: number;
  /** Set when the panel flipped below the display. */
  top?: number;
  maxHeight: number;
}

/**
 * Pure placement: above the display, left-aligned, width = max(display, 480)
 * capped at min(720, viewport - 2 margins); flips below when it does not fit
 * above and there is more room below; always clamped to the viewport.
 */
export function computeAlertPanelPosition(
  anchor: Pick<DOMRect, "left" | "top" | "bottom" | "width">,
  panelHeight: number,
  viewport: { width: number; height: number },
): Position {
  const margin = ALERT_PANEL_VIEWPORT_MARGIN;
  const maxWidth = Math.max(
    0,
    Math.min(ALERT_PANEL_MAX_WIDTH, viewport.width - margin * 2),
  );
  const width = Math.min(Math.max(anchor.width, ALERT_PANEL_MIN_WIDTH), maxWidth);
  const left = Math.max(
    margin,
    Math.min(anchor.left, viewport.width - width - margin),
  );

  const roomAbove = Math.max(0, anchor.top - ALERT_PANEL_GAP - margin / 2);
  const roomBelow = Math.max(
    0,
    viewport.height - anchor.bottom - ALERT_PANEL_GAP - margin / 2,
  );
  const above = panelHeight <= roomAbove || roomAbove >= roomBelow;

  return above
    ? {
        left,
        width,
        bottom: viewport.height - anchor.top + ALERT_PANEL_GAP,
        maxHeight: roomAbove,
      }
    : {
        left,
        width,
        top: anchor.bottom + ALERT_PANEL_GAP,
        maxHeight: roomBelow,
      };
}

/**
 * Docked placement (concept C): when the display sits inside a harbuz `Tray`
 * (the footer bar, marked `data-harbuz-tray`), the panel spans the footer's
 * full width and rests directly on top of it.
 */
export function computeDockedAlertPanelPosition(
  host: Pick<DOMRect, "left" | "top" | "width">,
  viewport: { width: number; height: number },
): Position {
  const left = Math.max(0, host.left);
  const width = Math.max(0, Math.min(host.width, viewport.width - left));
  return {
    left,
    width,
    bottom: viewport.height - host.top,
    maxHeight: Math.max(0, host.top - ALERT_PANEL_VIEWPORT_MARGIN),
  };
}

/** Dock only to a visible tray in the lower half of the viewport (a footer). */
function canDock(
  host: Pick<DOMRect, "top" | "width">,
  viewport: { height: number },
): boolean {
  return host.width > 0 && host.top > viewport.height / 2;
}

function samePosition(a: Position, b: Position): boolean {
  return (
    a.left === b.left &&
    a.width === b.width &&
    a.top === b.top &&
    a.bottom === b.bottom &&
    a.maxHeight === b.maxHeight
  );
}

const ACTION_ICONS = {
  retry: <AlertRetryIcon />,
  details: <AlertDetailsIcon />,
  dismiss: <AlertDismissIcon />,
  custom: null,
} as const;

const FOCUSABLE =
  'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const AlertDetailPanel: React.FC<AlertDetailPanelProps> = ({
  alert,
  anchorRef,
  returnFocusRef,
  id,
  onClose,
  config,
}) => {
  const banner = useDisplayAlertBannerConfig(config);
  const dockToTray = banner.dock === "tray";
  const dialogRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<Position | null>(null);
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  /** Close and hand focus back to the Details slot. */
  const close = useCallback(() => {
    onClose();
    returnFocusRef.current?.focus();
  }, [onClose, returnFocusRef]);

  useLayoutEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const host = dockToTray ? anchor.closest<HTMLElement>("[data-harbuz-tray]") : null;
    const update = () => {
      const dialog = dialogRef.current;
      const naturalHeight = dialog
        ? dialog.scrollHeight + (dialog.offsetHeight - dialog.clientHeight)
        : 0;
      const viewport = { width: window.innerWidth, height: window.innerHeight };
      const hostRect = host?.getBoundingClientRect();
      const next =
        hostRect && canDock(hostRect, viewport)
          ? computeDockedAlertPanelPosition(hostRect, viewport)
          : computeAlertPanelPosition(anchor.getBoundingClientRect(), naturalHeight, viewport);
      setPosition((prev) => (prev && samePosition(prev, next) ? prev : next));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    // The tray / display can change size while the panel is open
    const observer =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    observer?.observe(anchor);
    if (host) observer?.observe(host);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      observer?.disconnect();
    };
  }, [anchorRef, dockToTray]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.focus();
    // Slide up from the footer edge (skipped for reduced motion / no WAAPI)
    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (dialog && !reduce && typeof dialog.animate === "function") {
      dialog.animate(
        [
          { transform: "translateY(12px)", opacity: 0 },
          { transform: "translateY(0)", opacity: 1 },
        ],
        { duration: 160, easing: "ease-out" },
      );
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        close();
      }
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (dialogRef.current?.contains(target)) return;
      if (returnFocusRef.current?.contains(target)) return; // the toggle handles itself
      onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [close, onClose, returnFocusRef]);

  useEffect(() => () => clearTimeout(copiedTimer.current), []);

  const detail = alert.detail;
  const content = isDisplayAlertDetailContent(detail) ? detail : null;
  const errorId = content?.errorId;

  const copyErrorId = useCallback(() => {
    if (!errorId) return;
    const clipboard = typeof navigator !== "undefined" ? navigator.clipboard : undefined;
    if (!clipboard) return;
    void clipboard.writeText(errorId).then(
      () => {
        setCopied(true);
        clearTimeout(copiedTimer.current);
        copiedTimer.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
      },
      () => {
        /* clipboard blocked: the id stays selectable */
      },
    );
  }, [errorId]);

  /** Tab out of the panel closes it and returns to the Details slot. */
  const onDialogKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const leavingBackwards = event.shiftKey && (active === dialog || active === first);
    const leavingForwards = !event.shiftKey && (items.length === 0 || active === last);
    if (leavingBackwards || leavingForwards) {
      event.preventDefault();
      close();
    }
  };

  const runAction = (action: DisplayAlertAction) => {
    close();
    action.onSelect();
  };

  /** Step buttons: Retry closes the banner; other fixes keep it open (live hints). */
  const runStepAction = (action: DisplayAlertAction) => {
    if (action.kind === "retry") {
      runAction(action);
      return;
    }
    action.onSelect();
  };

  if (typeof document === "undefined") return null;

  const severity = alert.severity ?? "error";
  const palette = DISPLAY_ALERT_BANNER[severity];
  const labels = banner.labels;
  const layout = alertBannerLayout(position?.width ?? 0, banner.breakpoints);
  const titleId = `${id}-title`;
  const actions = alert.actions ?? [];
  const body = content ? content.body : (detail as React.ReactNode);
  const facts = content?.facts;
  const steps = content?.steps ?? [];
  const support = content?.support;
  /** Rows under the header line up with the title (icon 20px + gap 12px). */
  const indent = "32px";

  const headerActions = actions.length > 0 && (
    <div data-detail="actions" style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
      {actions.map((action) => {
        const kind = action.kind ?? "custom";
        return (
          <BannerButton
            key={action.id}
            kind={kind}
            onClick={() => runAction(action)}
            color={palette.text}
            borderColor={palette.controlBorder}
            hoverBackgroundColor={palette.controlHover}
          >
            {action.icon ?? ACTION_ICONS[kind]}
            {action.label}
          </BannerButton>
        );
      })}
    </div>
  );

  const closeButton = (
    <button
      type="button"
      onClick={close}
      aria-label={labels.close}
      title={labels.close}
      style={{
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "28px",
        height: "28px",
        background: "transparent",
        border: "none",
        borderRadius: "6px",
        color: palette.text,
        cursor: "pointer",
      }}
    >
      <AlertDismissIcon />
    </button>
  );

  const bodyBlock = body ? (
    <div
      data-detail="body"
      style={
        layout === "wide"
          ? { flex: "1 1 auto", minWidth: 0, fontSize: "13px", overflowWrap: "anywhere" }
          : { marginTop: "6px", paddingLeft: indent, fontSize: "13px", overflowWrap: "anywhere" }
      }
    >
      {body}
    </div>
  ) : null;

  return createPortal(
    <div
      ref={dialogRef}
      id={id}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      data-display-alert-details=""
      data-severity={severity}
      data-layout={layout}
      onKeyDown={onDialogKeyDown}
      style={{
        position: "fixed",
        zIndex: Z_INDEX.FLOATING_PANEL,
        boxSizing: "border-box",
        left: position?.left ?? 0,
        width: position?.width ?? ALERT_PANEL_MIN_WIDTH,
        top: position?.top,
        bottom: position?.bottom,
        maxHeight: position?.maxHeight,
        overflowY: "auto",
        visibility: position ? "visible" : "hidden",
        backgroundColor: palette.background,
        color: palette.text,
        borderTop: `1px solid ${palette.rule}`,
        padding: "12px 16px",
        fontSize: "13px",
        lineHeight: 1.4,
        outline: "none",
      }}
    >
      {/* Header: icon | title | (wide: sentence) | actions | x */}
      <div data-detail="row" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <span data-detail="icon" aria-hidden="true" style={{ display: "flex", flexShrink: 0 }}>
          {alert.icon ?? <AlertWarningIcon size={20} />}
        </span>
        <div
          id={titleId}
          data-detail="title"
          style={{
            flex: layout === "narrow" ? "1 1 auto" : "0 0 auto",
            minWidth: 0,
            fontFamily: "monospace",
            fontWeight: 600,
            fontSize: "13px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {alert.title}
        </div>
        {layout === "wide" ? bodyBlock : layout === "medium" && <span style={{ flex: 1 }} />}
        {layout !== "narrow" && headerActions}
        {closeButton}
      </div>

      {layout !== "wide" && bodyBlock}

      {layout === "narrow" && headerActions && (
        <div style={{ marginTop: "8px", paddingLeft: indent }}>{headerActions}</div>
      )}

      {facts && (
        <div
          data-detail="facts"
          style={{ marginTop: "6px", paddingLeft: indent, fontSize: "12px", color: palette.muted }}
        >
          {facts}
        </div>
      )}

      {steps.length > 0 && (
        <div data-detail="steps" style={{ marginTop: "10px", paddingLeft: indent }}>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: palette.muted,
              marginBottom: "4px",
            }}
          >
            {labels.howToFix}
          </div>
          <ol style={{ listStyle: "none", margin: 0, padding: 0 }}>
            {steps.map((step, index) => (
              <BannerStep
                key={step.id}
                step={step}
                number={index + 1}
                narrow={layout === "narrow"}
                palette={palette}
                onAction={runStepAction}
              />
            ))}
          </ol>
        </div>
      )}

      {(errorId || support) && (
        <div
          data-detail="support-row"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "8px 10px",
            marginTop: "10px",
            paddingLeft: indent,
          }}
        >
          <span style={{ flex: "1 1 auto", fontSize: "12px", color: palette.muted }}>
            {labels.stillStuck}
          </span>
          {errorId && (
            <BannerButton
              kind="copy"
              small
              onClick={copyErrorId}
              ariaLabel={copied ? labels.copied : labels.copyErrorId}
              color={palette.text}
              borderColor={palette.controlBorder}
              hoverBackgroundColor={palette.controlHover}
            >
              {copied ? <AlertCheckIcon /> : <AlertCopyIcon />}
              {copied ? labels.copied : labels.copyErrorId}
              <code data-detail="error-id" style={{ color: palette.muted, userSelect: "all" }}>
                {errorId}
              </code>
            </BannerButton>
          )}
          {support && (
            <a
              href={support.href}
              data-detail="support"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                color: palette.text,
                border: `1px solid ${palette.controlBorder}`,
                borderRadius: "6px",
                padding: "3px 10px",
                fontFamily: "monospace",
                fontSize: "11px",
                textDecoration: "none",
              }}
            >
              <AlertMailIcon />
              {support.label ?? labels.emailSupport}
            </a>
          )}
          <span
            role="status"
            style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
          >
            {copied ? labels.copied : ""}
          </span>
        </div>
      )}
    </div>,
    document.body,
  );
};

type BannerPalette = (typeof DISPLAY_ALERT_BANNER)[keyof typeof DISPLAY_ALERT_BANNER];

/** One numbered "How to fix" step: number | title + hint | optional button. */
const BannerStep: React.FC<{
  step: DisplayAlertStep;
  number: number;
  narrow: boolean;
  palette: BannerPalette;
  onAction: (action: DisplayAlertAction) => void;
}> = ({ step, number, narrow, palette, onAction }) => {
  const action = step.action;
  const kind = action?.kind ?? "custom";
  return (
    <li
      data-step={step.id}
      data-status={step.status}
      style={{
        display: "grid",
        gridTemplateColumns: narrow ? "22px minmax(0, 1fr)" : "22px minmax(0, 1fr) auto",
        alignItems: "center",
        gap: "6px 10px",
        padding: "6px 0",
        borderTop: `1px solid ${palette.controlHover}`,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: "20px",
          height: "20px",
          borderRadius: "50%",
          border: `1px solid ${palette.controlStrongBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "monospace",
          fontSize: "11px",
        }}
      >
        {number}
      </span>
      <div style={{ minWidth: 0 }}>
        <div data-step-part="title" style={{ fontSize: "13px" }}>
          {step.title}
        </div>
        {step.hint && (
          <div
            data-step-part="hint"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              fontSize: "12px",
              color: step.status === "ok" ? palette.ok : palette.muted,
              opacity: step.status === "blocked" ? 0.75 : undefined,
            }}
          >
            {step.status === "ok" && <AlertCheckIcon />}
            {step.hint}
          </div>
        )}
      </div>
      {action && (
        <div style={narrow ? { gridColumn: "2" } : undefined}>
          <BannerButton
            kind={kind}
            onClick={() => onAction(action)}
            color={palette.text}
            borderColor={step.recommended ? palette.controlStrongBorder : palette.controlBorder}
            backgroundColor={step.recommended ? palette.controlHover : undefined}
            hoverBackgroundColor={palette.controlHover}
          >
            {action.icon ?? ACTION_ICONS[kind]}
            {action.label}
          </BannerButton>
        </div>
      )}
    </li>
  );
};

/**
 * @deprecated Renamed to `AlertDetailPanel` (the details now open as a
 * banner docked on the footer, not a small popover).
 */
export const AlertDetailsPopover = AlertDetailPanel;
/** @deprecated Use `AlertDetailPanelProps`. */
export type AlertDetailsPopoverProps = AlertDetailPanelProps;

interface BannerButtonProps {
  kind: string;
  onClick: () => void;
  color: string;
  borderColor: string;
  hoverBackgroundColor: string;
  /** Resting fill; transparent by default (outlined). */
  backgroundColor?: string;
  /** Compact size (support row). */
  small?: boolean;
  /** Accessible name when the visible content is not enough. */
  ariaLabel?: string;
  children: React.ReactNode;
}

/** Outlined banner button: no fill by default, soft accent text, tinted on hover. */
const BannerButton: React.FC<BannerButtonProps> = ({
  kind,
  onClick,
  color,
  borderColor,
  hoverBackgroundColor,
  backgroundColor = "transparent",
  small = false,
  ariaLabel,
  children,
}) => (
  <button
    type="button"
    data-panel-action={kind}
    onClick={onClick}
    aria-label={ariaLabel}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      backgroundColor,
      color,
      border: `1px solid ${borderColor}`,
      borderRadius: "6px",
      padding: small ? "3px 10px" : "5px 12px",
      fontFamily: "monospace",
      fontSize: small ? "11px" : "12px",
      whiteSpace: "nowrap",
      cursor: "pointer",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = hoverBackgroundColor;
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = backgroundColor;
    }}
  >
    {children}
  </button>
);
